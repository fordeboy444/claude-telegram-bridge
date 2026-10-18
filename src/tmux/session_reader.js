import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

/**
 * Format a project path into the Claude project slug format.
 * The drive colon becomes one dash, and each path separator becomes another,
 * e.g. C:\Users\taro8\Projects\my-project -> C--Users-taro8-Projects-my-project
 *      /home/user/projects/my-project -> -home-user-projects-my-project
 */
export function getProjectSlug(projectPath) {
  const resolved = path.resolve(projectPath);
  return resolved
    .replace(/^([A-Za-z]):/, (_, drive) => `${drive}-`)
    .replace(/[/\\]/g, '-')
    .replace(/ /g, '-');
}

// Shared path helpers (also used by src/status_report.js for /status).

export async function resolveClaudeProjectDir(claudeHome, projectPath) {
  const slug = getProjectSlug(projectPath);
  const projectsRoot = path.join(claudeHome, 'projects');
  const projectDir = path.join(projectsRoot, slug);

  try {
    await fs.access(projectDir);
    return projectDir;
  } catch {}

  // Claude's own slug drive-letter casing can vary; fall back to a
  // case-insensitive directory match if the exact name is missing.
  try {
    const lower = slug.toLowerCase();
    const entries = await fs.readdir(projectsRoot, { withFileTypes: true });
    const match = entries.find(e => e.isDirectory() && e.name.toLowerCase() === lower);
    return match ? path.join(projectsRoot, match.name) : null;
  } catch {
    return null;
  }
}

export async function findLatestJsonlFile(projectDir) {
  try {
    const entries = await fs.readdir(projectDir, { withFileTypes: true });
    const jsonlFiles = entries
      .filter(e => e.isFile() && e.name.endsWith('.jsonl'))
      .map(e => ({
        name: e.name,
        fullPath: path.join(projectDir, e.name)
      }));

    if (jsonlFiles.length === 0) {
      return null;
    }

    // Sort by mtime descending
    const stats = await Promise.all(
      jsonlFiles.map(async f => ({
        ...f,
        mtime: (await fs.stat(f.fullPath)).mtimeMs
      }))
    );

    stats.sort((a, b) => b.mtime - a.mtime);
    return stats[0].fullPath;
  } catch {
    return null;
  }
}

// The tools that end a turn with a question for the user.
const ASK_TOOL_NAMES = new Set(['AskUserQuestion', 'Question']);

// An assistant record's stop_reason says whether Claude continues or waits.
// `tool_use` and `pause_turn` continue the turn; these reasons end it, so the
// record is the honest "Claude is now waiting for the user" signal. An
// interactive transcript writes no `result` record, so this is the only one.
const TURN_END_REASONS = new Set(['end_turn', 'max_tokens', 'stop_sequence', 'refusal']);

// An interrupted turn writes this user record and no assistant record, so the
// record itself is the end-of-turn signal. Claude now waits for the user.
const INTERRUPT_MARKER = /^\s*\[Request interrupted by user/;

// Claude Code writes its own notices into the transcript as user turns: a
// finished background task, a hook reminder, a slash-command record. They are
// not typed input, so the reader never reports them as a user event.
const SYSTEM_INJECTED_USER_RECORD =
  /<(?:task-notification|system-reminder|local-command-caveat|command-name|command-args)\b/;

// How much of a transcript's tail is scanned for a question Claude is waiting
// on. Nothing is written after such a question, so it sits at the very end of
// the file. 1 MB is far more than one turn, and a transcript grows to many
// megabytes, so the head is never read.
const OPEN_QUESTION_TAIL_BYTES = 1048576;

/**
 * The question Claude is waiting on, or null. A question is open until an
 * answer names its tool_use id, and until no later user turn has taken over:
 * an interrupted question leaves no answer behind.
 *
 * @param {string|null} filePath a transcript
 * @returns {Promise<{id: string|null, input: object}|null>}
 */
export async function findOpenQuestion(filePath) {
  if (typeof filePath !== 'string' || filePath === '') return null;

  let handle = null;
  try {
    handle = await fs.open(filePath, 'r');
    const { size } = await handle.stat();
    const length = Math.min(size, OPEN_QUESTION_TAIL_BYTES);
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, size - length);

    let open = null; // {id, input} of the newest question seen
    const answered = new Set(); // every tool_use id an answer names

    for (const line of buffer.toString('utf8').split('\n')) {
      const text = line.trim();
      if (text === '') continue;
      let entry;
      // A tail that starts mid-line is unparseable text, not an error.
      try {
        entry = JSON.parse(text);
      } catch {
        continue;
      }

      const content = entry?.message?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (!block || typeof block !== 'object') continue;
          if (block.type === 'tool_use' && ASK_TOOL_NAMES.has(block.name)) {
            open = { id: block.id ?? null, input: block.input || block.arguments || {} };
          } else if (block.type === 'tool_result' && block.tool_use_id) {
            answered.add(block.tool_use_id);
          } else if (block.type === 'text' && entry.type === 'user') {
            // The user took a new turn, so every question above it is over.
            open = null;
          }
        }
      } else if (entry?.type === 'tool_use' && ASK_TOOL_NAMES.has(entry.name)) {
        open = { id: entry.id ?? null, input: entry.input || entry.arguments || {} }; // legacy shape
      }
    }

    if (!open) return null;
    return answered.has(open.id) ? null : open;
  } catch {
    return null; // unreadable file: no question to report
  } finally {
    if (handle) await handle.close().catch(() => {});
  }
}

export class ClaudeSessionReader {
  constructor(options = {}) {
    this.claudeHome = options.claudeHome || path.join(os.homedir(), '.claude');
    this.sessionId = options.sessionId || null;
    this.sessionFile = null; // the transcript this reader follows, once started
    this._pinned = false; // start() pinned this reader to one transcript file
    this.lastFileOffsets = new Map(); // filePath -> byte offset
    this._reading = false; // a poll tick is in flight; hold the next one back
    this._lastQuestionId = null; // newest question reported, streamed or scanned
    this.pollingTimer = null;
    this._stopped = false;
  }

  async resolveProjectDir(projectPath) {
    return resolveClaudeProjectDir(this.claudeHome, projectPath);
  }

  async findLatestSessionFile(projectPath) {
    try {
      const projectDir = await this.resolveProjectDir(projectPath);
      if (!projectDir) {
        return null;
      }
      return findLatestJsonlFile(projectDir);
    } catch {
      return null;
    }
  }

  // The file this reader must follow: the bound session's own transcript when
  // sessionId is set, else the newest transcript in the project dir (legacy).
  // The bound path is returned even when the file does not exist yet: claude
  // creates it on first write, and readNewEvents returns [] until then.
  // A pinned reader returns the pinned path immediately — including null, which
  // means "the joined target has not written its transcript yet". A pin never
  // falls through to newest-file mode, or it would drift to another tab's file.
  async resolveSessionFile(projectPath) {
    if (this._pinned) {
      return this.sessionFile;
    }
    if (!this.sessionId) {
      return this.findLatestSessionFile(projectPath);
    }
    const projectDir = await this.resolveProjectDir(projectPath);
    return projectDir ? path.join(projectDir, `${this.sessionId}.jsonl`) : null;
  }

  async readNewEvents(projectPath) {
    const latestFile = await this.resolveSessionFile(projectPath);
    if (!latestFile) {
      return [];
    }

    try {
      const stat = await fs.stat(latestFile);
      const currentSize = stat.size;
      const lastOffset = this.lastFileOffsets.get(latestFile) || 0;

      if (currentSize <= lastOffset) {
        // If file shrunk or didn't grow, check if it's a new/different session file or reset
        if (currentSize < lastOffset) {
          this.lastFileOffsets.set(latestFile, 0);
        }
        return [];
      }

      const handle = await fs.open(latestFile, 'r');
      const bufferSize = currentSize - lastOffset;
      const buffer = Buffer.alloc(bufferSize);
      await handle.read(buffer, 0, bufferSize, lastOffset);
      await handle.close();

      this.lastFileOffsets.set(latestFile, currentSize);

      const chunk = buffer.toString('utf8');
      const lines = chunk.split('\n').filter(l => l.trim().length > 0);

      const events = [];

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.type === 'user' && entry.message && entry.message.content) {
            const raw = typeof entry.message.content === 'string'
              ? entry.message.content
              : Array.isArray(entry.message.content)
                ? entry.message.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
                : '';
            // Ignore system-injected records, local commands, and empty content
            if (raw && !SYSTEM_INJECTED_USER_RECORD.test(raw)) {
              events.push({ type: 'user', content: raw.trim() });
              // This record also ends the turn: the user event starts typing
              // again, so the end must come after it.
              if (INTERRUPT_MARKER.test(raw)) {
                events.push({ type: 'turn_end', subtype: 'interrupted' });
              }
            }
          } else if (entry.type === 'assistant' && entry.message && entry.message.content) {
            const content = entry.message.content;
            if (Array.isArray(content)) {
              for (const block of content) {
                if (block.type === 'text' && block.text) {
                  events.push({ type: 'text', content: block.text });
                } else if (block.type === 'tool_use' && ASK_TOOL_NAMES.has(block.name)) {
                  // Remembered so the tail scan does not report this question a
                  // second time while the user has not answered it yet.
                  this._lastQuestionId = block.id ?? this._lastQuestionId;
                  events.push({ type: 'question', content: block.input || block.arguments, id: block.id ?? null });
                }
              }
            }
            // The record that ends a turn carries the terminal stop_reason, so
            // the text above it and this event arrive in the right order.
            const stopReason = entry.message.stop_reason;
            if (TURN_END_REASONS.has(stopReason)) {
              events.push({ type: 'turn_end', subtype: stopReason });
            }
          } else if (entry.type === 'tool_use' && ASK_TOOL_NAMES.has(entry.name)) {
            this._lastQuestionId = entry.id ?? this._lastQuestionId;
            events.push({ type: 'question', content: entry.input || entry.arguments, id: entry.id ?? null });
          } else if (entry.type === 'result') {
            // Claude writes one result entry at the end of every turn.
            events.push({ type: 'result', subtype: entry.subtype || null });
          }
        } catch {
          // Ignore malformed JSON lines
        }
      }

      return events;
    } catch {
      return [];
    }
  }

  start(projectPath, onEvent, pollIntervalMs = 1000, options = {}) {
    if (this.pollingTimer) {
      this.stop();
    }
    this.sessionId = options.sessionId ?? this.sessionId ?? null;
    this._stopped = false;

    let trackedFile = null;
    let tickCount = 0;
    let questionTicks = 0;
    // A fresh join reports a question Claude is already waiting on again.
    this._lastQuestionId = null;
    const getBoundSessionId = options.getBoundSessionId || null;
    const getSessionFile = typeof options.getSessionFile === 'function' ? options.getSessionFile : null;
    // A joined Orca tab pins ONE transcript. Either option being present pins
    // the reader: options.sessionFile is the initial path (null is valid and
    // means "not written yet"), getSessionFile re-pins on a later tick.
    this._pinned = options.sessionFile !== undefined || getSessionFile !== null;
    this.sessionFile = this._pinned ? (options.sessionFile ?? null) : null;

    // Initialize offset to current size so we only read future events if file already exists
    this.resolveSessionFile(projectPath).then(async file => {
      if (this._stopped) return; // stop() raced the initial file resolution
      if (file) {
        trackedFile = file;
        this.sessionFile = file;
        try {
          const stat = await fs.stat(file);
          this.lastFileOffsets.set(file, stat.size);
        } catch {}
      }

      this.pollingTimer = setInterval(async () => {
        // A tick that does async I/O can outlast pollIntervalMs. Without this
        // guard two ticks both read the same offset before either writes it,
        // and the same records are emitted twice.
        if (this._reading) return;
        this._reading = true;
        try {
          // Every 5th poll tick: check whether /clear, /resume or /branch
          // moved us to a new Claude session id inside the same tmux pane,
          // and whether a joined target re-pinned us to another transcript.
          // The SessionStart hook publishes the id onto the tmux session.
          if ((getBoundSessionId || getSessionFile) && ++tickCount % 5 === 0) {
            if (getBoundSessionId) {
              let boundId = null;
              try {
                boundId = await getBoundSessionId();
              } catch {
                boundId = null; // option not set / tmux down: keep current binding
              }
              if (boundId && boundId !== this.sessionId) {
                this.sessionId = boundId;
                const newFile = await this.resolveSessionFile(projectPath);
                if (newFile) {
                  trackedFile = newFile;
                  this.sessionFile = newFile;
                  try {
                    const stat = await fs.stat(newFile);
                    this.lastFileOffsets.set(newFile, stat.size); // adopt from now, no replay
                  } catch {
                    this.lastFileOffsets.set(newFile, 0); // file appears later, read from start
                  }
                }
              }
            }

            if (getSessionFile) {
              let pinnedFile = null;
              try {
                pinnedFile = await getSessionFile();
              } catch {
                pinnedFile = null; // probe failed: leave the current pin untouched
              }
              // A null result keeps the current pin. A new path is adopted at its
              // CURRENT size, so records already in it are never replayed.
              if (pinnedFile && pinnedFile !== this.sessionFile) {
                this.sessionFile = pinnedFile;
                trackedFile = pinnedFile;
                try {
                  const stat = await fs.stat(pinnedFile);
                  this.lastFileOffsets.set(pinnedFile, stat.size);
                } catch {
                  this.lastFileOffsets.delete(pinnedFile); // missing: read it in full when it appears
                }
              }
            }
          }

          // With a bound sessionId the resolved path is constant (no flipping);
          // the fallback still follows the newest file for legacy sessions.
          // A pinned reader resolves to its pin, so this never flips either.
          const currentLatest = await this.resolveSessionFile(projectPath);
          if (currentLatest && currentLatest !== trackedFile) {
            trackedFile = currentLatest;
            if (!this.lastFileOffsets.has(trackedFile)) {
              this.lastFileOffsets.set(trackedFile, 0);
            }
          }
          this.sessionFile = currentLatest;

          const events = await this.readNewEvents(projectPath);
          for (const ev of events) {
            onEvent(ev);
          }

          // First tick, then every 5th: this reader adopted the transcript at
          // its current size, so a question Claude is waiting on right now was
          // written before the join and streams no event. Report it once per
          // question id. The check runs after the read above, so a question
          // that just streamed is already known and stays a single card.
          if (++questionTicks % 5 === 1) {
            const open = await findOpenQuestion(this.sessionFile);
            if (open && open.id !== this._lastQuestionId) {
              this._lastQuestionId = open.id;
              onEvent({ type: 'question', content: open.input, id: open.id });
            }
          }
        } catch {
        } finally {
          this._reading = false;
        }
      }, pollIntervalMs);
      if (this.pollingTimer.unref) {
        this.pollingTimer.unref();
      }
    });
  }

  stop() {
    this._stopped = true;
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }
}

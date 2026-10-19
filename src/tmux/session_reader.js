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

// A background task resumes the turn by itself. Claude Code writes a
// task-notification record when the task completes and Claude continues with
// no user input. A turn that ends while such work runs is a PAUSE, not a stop
// that waits for the user.
const BACKGROUND_TASK_LAUNCH = /Async agent launched successfully|Command running in background/;
const TASK_NOTIFICATION_TOOL_ID = /<tool-use-id>([^<]+)<\/tool-use-id>/;

// An agent transcript can be large; its completion marker is its last
// assistant stop_reason, so only the tail is needed.
const AGENT_TRANSCRIPT_TAIL_BYTES = 65536;

// True when one sub-agent transcript is still working: no assistant record
// yet (the agent just started) or a non-terminal stop_reason. There is no time
// limit, exactly like the /status card.
async function agentIsRunning(filePath) {
  let handle = null;
  try {
    handle = await fs.open(filePath, 'r');
    const { size } = await handle.stat();
    const length = Math.min(size, AGENT_TRANSCRIPT_TAIL_BYTES);
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, size - length);
    const lines = buffer.toString('utf8').split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!lines[i].trim()) continue;
      let record;
      try {
        record = JSON.parse(lines[i]);
      } catch {
        continue; // a tail that starts mid-line is not a record
      }
      if (record.type === 'assistant' && record.message) {
        return !TURN_END_REASONS.has(record.message.stop_reason ?? null);
      }
    }
    return true; // no assistant record yet: the agent still works
  } catch {
    return true; // unreadable: do not turn a live agent into a stop
  } finally {
    if (handle) await handle.close().catch(() => {});
  }
}

// True when any side-chain transcript of this session still works. The
// sub-agents of a session sit in <session>/subagents/ next to its transcript.
export async function hasRunningSubAgent(sessionFile) {
  if (typeof sessionFile !== 'string' || sessionFile === '') return false;
  const agentsDir = path.join(
    path.dirname(sessionFile),
    path.basename(sessionFile, '.jsonl'),
    'subagents'
  );
  let names;
  try {
    names = await fs.readdir(agentsDir);
  } catch {
    return false; // no sub-agents for this session
  }
  for (const name of names) {
    if (!/^agent-.*\.jsonl$/.test(name)) continue;
    if (await agentIsRunning(path.join(agentsDir, name))) return true;
  }
  return false;
}

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
    this._pendingBackgroundTasks = new Set(); // tool_use ids that still run
    this.pollingTimer = null;
    this._stopped = false;
  }

  // Add the background tasks that a record launches, and drop the ones it
  // reports as finished. A launched task resumes the turn by itself, so a
  // terminal stop with a task in this set is a pause, not a stop.
  _noteBackgroundRecord(entry) {
    if (!entry || typeof entry !== 'object') return;

    // A killed harness clears every background task at once.
    if (entry.type === 'system' && entry.subtype === 'agents_killed') {
      this._pendingBackgroundTasks.clear();
      return;
    }

    // A task-notification is a user record (or a queued operation) with XML
    // text. Its <tool-use-id> names the task that just finished.
    const text = typeof entry.content === 'string'
      ? entry.content
      : typeof entry.message?.content === 'string'
        ? entry.message.content
        : '';
    if (text) {
      for (const match of text.matchAll(new RegExp(TASK_NOTIFICATION_TOOL_ID.source, 'g'))) {
        this._pendingBackgroundTasks.delete(match[1]);
      }
    }

    const content = entry.message?.content;
    if (!Array.isArray(content)) return;
    for (const block of content) {
      if (!block || typeof block !== 'object') continue;
      if (block.type === 'tool_use' && block.name === 'Bash' &&
          block.input && block.input.run_in_background === true &&
          typeof block.id === 'string') {
        this._pendingBackgroundTasks.add(block.id);
      } else if (block.type === 'tool_result' && typeof block.tool_use_id === 'string') {
        const resultText = typeof block.content === 'string'
          ? block.content
          : Array.isArray(block.content)
            ? block.content.filter(b => b && b.type === 'text').map(b => b.text).join('\n')
            : '';
        if (BACKGROUND_TASK_LAUNCH.test(resultText)) {
          this._pendingBackgroundTasks.add(block.tool_use_id);
        }
      }
    }
  }

  // True when the turn pauses for work that will resume it by itself: a
  // launched background task that has not notified yet, or a running
  // side-chain sub-agent. Claude Code then continues with no user input.
  async hasPendingWork() {
    if (this._pendingBackgroundTasks.size > 0) return true;
    return hasRunningSubAgent(this.sessionFile);
  }

  // A joined tab starts at the current file size, so it never sees the launch
  // records of a task that is already running. Read the tail once to seed the
  // set. The window is the same one used for an open question.
  async seedPendingBackgroundTasks(filePath) {
    if (typeof filePath !== 'string' || filePath === '') return;
    let handle = null;
    try {
      handle = await fs.open(filePath, 'r');
      const { size } = await handle.stat();
      const length = Math.min(size, OPEN_QUESTION_TAIL_BYTES);
      const buffer = Buffer.alloc(length);
      await handle.read(buffer, 0, length, size - length);
      for (const line of buffer.toString('utf8').split('\n')) {
        if (!line.trim()) continue;
        let entry;
        try {
          entry = JSON.parse(line);
        } catch {
          continue;
        }
        this._noteBackgroundRecord(entry);
      }
    } catch {
      // unreadable tail: no seed, the live records still feed the set
    } finally {
      if (handle) await handle.close().catch(() => {});
    }
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
    this.sessionFile = latestFile;

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

      // The turn end is decided AFTER the chunk is parsed: a terminal
      // stop_reason is only a real stop when no background work will resume
      // the turn. The newest terminal record wins; its index, compared with the
      // turn_duration marker, tells which came last.
      let terminalStop = null;
      let pendingAgentsAt = -1;
      let lineIndex = -1;

      for (const line of lines) {
        lineIndex++;
        try {
          const entry = JSON.parse(line);
          this._noteBackgroundRecord(entry);
          if (entry.type === 'system' && entry.subtype === 'turn_duration' &&
              Number(entry.pendingBackgroundAgentCount) > 0) {
            pendingAgentsAt = lineIndex;
          }
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
              terminalStop = { subtype: stopReason, at: lineIndex };
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

      // A turn that pauses for background work sends NO turn_end: Claude
      // resumes by itself and the stop notice must stay silent. The typing
      // indicator stays on until the real turn end arrives.
      if (terminalStop) {
        const agentsPending = pendingAgentsAt > terminalStop.at;
        if (!agentsPending && !(await this.hasPendingWork())) {
          events.push({ type: 'turn_end', subtype: terminalStop.subtype });
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
    this._pendingBackgroundTasks.clear(); // a new start sees a new turn stream

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
        // The join skips the records above the offset; seed the pending set
        // from the tail so an already-running task still holds the turn.
        await this.seedPendingBackgroundTasks(file);
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
                  // A new transcript has its own tasks: drop the old set.
                  this._pendingBackgroundTasks.clear();
                  await this.seedPendingBackgroundTasks(newFile);
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
                // A re-pin to another tab's transcript starts with its tasks.
                this._pendingBackgroundTasks.clear();
                await this.seedPendingBackgroundTasks(pinnedFile);
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

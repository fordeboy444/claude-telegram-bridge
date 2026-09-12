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

export class ClaudeSessionReader {
  constructor(options = {}) {
    this.claudeHome = options.claudeHome || path.join(os.homedir(), '.claude');
    this.sessionId = options.sessionId || null;
    this.lastFileOffsets = new Map(); // filePath -> byte offset
    this.pollingTimer = null;
    this._stopped = false;
  }

  async resolveProjectDir(projectPath) {
    const slug = getProjectSlug(projectPath);
    const projectsRoot = path.join(this.claudeHome, 'projects');
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

  async findLatestSessionFile(projectPath) {
    try {
      const projectDir = await this.resolveProjectDir(projectPath);
      if (!projectDir) {
        return null;
      }

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

  // The file this reader must follow: the bound session's own transcript when
  // sessionId is set, else the newest transcript in the project dir (legacy).
  // The bound path is returned even when the file does not exist yet: claude
  // creates it on first write, and readNewEvents returns [] until then.
  async resolveSessionFile(projectPath) {
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
            // Ignore system caveats, local commands, and empty content
            if (raw && !raw.includes('<local-command-caveat>') && !raw.includes('<command-name>')) {
              events.push({ type: 'user', content: raw.trim() });
            }
          } else if (entry.type === 'assistant' && entry.message && entry.message.content) {
            const content = entry.message.content;
            if (Array.isArray(content)) {
              for (const block of content) {
                if (block.type === 'text' && block.text) {
                  events.push({ type: 'text', content: block.text });
                } else if (block.type === 'tool_use' && (block.name === 'AskUserQuestion' || block.name === 'Question')) {
                  events.push({ type: 'question', content: block.input || block.arguments });
                }
              }
            }
          } else if (entry.type === 'tool_use' && (entry.name === 'AskUserQuestion' || entry.name === 'Question')) {
            events.push({ type: 'question', content: entry.input || entry.arguments });
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
    const getBoundSessionId = options.getBoundSessionId || null;

    // Initialize offset to current size so we only read future events if file already exists
    this.resolveSessionFile(projectPath).then(async file => {
      if (this._stopped) return; // stop() raced the initial file resolution
      if (file) {
        trackedFile = file;
        try {
          const stat = await fs.stat(file);
          this.lastFileOffsets.set(file, stat.size);
        } catch {}
      }

      this.pollingTimer = setInterval(async () => {
        try {
          // Every 5th poll tick: check whether /clear, /resume or /branch
          // moved us to a new Claude session id inside the same tmux pane.
          // The SessionStart hook publishes the id onto the tmux session.
          if (getBoundSessionId && ++tickCount % 5 === 0) {
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
                try {
                  const stat = await fs.stat(newFile);
                  this.lastFileOffsets.set(newFile, stat.size); // adopt from now, no replay
                } catch {
                  this.lastFileOffsets.set(newFile, 0); // file appears later, read from start
                }
              }
            }
          }

          // With a bound sessionId the resolved path is constant (no flipping);
          // the fallback still follows the newest file for legacy sessions.
          const currentLatest = await this.resolveSessionFile(projectPath);
          if (currentLatest && currentLatest !== trackedFile) {
            trackedFile = currentLatest;
            if (!this.lastFileOffsets.has(trackedFile)) {
              this.lastFileOffsets.set(trackedFile, 0);
            }
          }

          const events = await this.readNewEvents(projectPath);
          for (const ev of events) {
            onEvent(ev);
          }
        } catch {}
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

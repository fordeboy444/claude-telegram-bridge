import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

/**
 * Format a project path into the Claude project slug format.
 * Examples:
 *   C:\Users\taro8\Projects\my-project -> C---Users-taro8-Projects-my-project
 *   /home/user/projects/my-project -> -home-user-projects-my-project
 */
export function getProjectSlug(projectPath) {
  const resolved = path.resolve(projectPath);
  return resolved
    .replace(/^([A-Za-z]):/, (_, drive) => `${drive}--`)
    .replace(/[/\\]/g, '-');
}

export class ClaudeSessionReader {
  constructor(options = {}) {
    this.claudeHome = options.claudeHome || path.join(os.homedir(), '.claude');
    this.lastFileOffsets = new Map(); // filePath -> byte offset
    this.pollingTimer = null;
  }

  async findLatestSessionFile(projectPath) {
    const slug = getProjectSlug(projectPath);
    const projectDir = path.join(this.claudeHome, 'projects', slug);

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

  async readNewEvents(projectPath) {
    const latestFile = await this.findLatestSessionFile(projectPath);
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
          if (entry.type === 'assistant' && entry.message && entry.message.content) {
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

  start(projectPath, onEvent, pollIntervalMs = 1000) {
    if (this.pollingTimer) {
      this.stop();
    }

    // Initialize offset to current size so we only read future events
    this.findLatestSessionFile(projectPath).then(async file => {
      if (file) {
        try {
          const stat = await fs.stat(file);
          this.lastFileOffsets.set(file, stat.size);
        } catch {}
      }

      this.pollingTimer = setInterval(async () => {
        try {
          const events = await this.readNewEvents(projectPath);
          for (const ev of events) {
            onEvent(ev);
          }
        } catch {}
      }, pollIntervalMs);
    });
  }

  stop() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }
}

// claude-telegram-bridge/src/skills/scanner.js
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export function getBuiltInCommands() {
  return [
    { id: 'builtin:clear', name: 'clear', description: 'Clear conversation context and restart clean', command: '/clear' },
    { id: 'builtin:compact', name: 'compact', description: 'Summarize and compress current chat history', command: '/compact' },
    { id: 'builtin:cost', name: 'cost', description: 'Show total token usage and estimated cost', command: '/cost' },
    { id: 'builtin:doctor', name: 'doctor', description: 'Check health and configuration of Claude Code', command: '/doctor' },
    { id: 'builtin:review', name: 'review', description: 'Review changes or PR against quality rules', command: '/review' },
    { id: 'builtin:help', name: 'help', description: 'Show help and available commands', command: '/help' }
  ];
}

export async function scanSkills(directories = []) {
  const results = [];
  const seenIds = new Set();

  for (const dir of directories) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const skillFilePath = path.join(dir, entry.name, 'SKILL.md');
        try {
          const content = await fs.readFile(skillFilePath, 'utf8');
          const parsed = matter(content);
          const name = parsed.data.name || entry.name;
          const description = parsed.data.description || 'No description provided';
          const id = `skill:${name}`;

          if (!seenIds.has(id)) {
            seenIds.add(id);
            results.push({
              id,
              name,
              description: description.replace(/[*_`#]/g, '').trim(),
              command: `/${name}`
            });
          }
        } catch {
          // File does not exist or invalid YAML, skip
        }
      }
    } catch {
      // Directory cannot be read, continue to next
    }
  }

  return results;
}

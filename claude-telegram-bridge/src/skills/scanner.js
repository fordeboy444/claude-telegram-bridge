// claude-telegram-bridge/src/skills/scanner.js
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export function getBuiltInCommands() {
  return [
    { id: 'builtin:clear', name: 'clear', description: 'Clear conversation context and restart clean', command: '/clear' },
    { id: 'builtin:compact', name: 'compact', description: 'Summarize and compress current chat history', command: '/compact' },
    { id: 'builtin:model', name: 'model', description: 'Switch model (fable, opus, sonnet, haiku)', command: '/model', choices: ['fable', 'opus', 'sonnet', 'haiku'] },
    { id: 'builtin:effort', name: 'effort', description: 'Adjust thinking effort', command: '/effort', choices: ['low', 'medium', 'high', 'xhigh', 'max'] }
  ];
}

export function sanitizeTelegramCommand(name) {
  if (!name) return '';
  // Telegram command rules: 1-32 chars, only a-z, 0-9, and _
  let clean = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  // Remove consecutive underscores and trim leading/trailing underscores
  clean = clean.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  if (!clean) return '';
  // If starts with a digit, prefix with 'cmd_'
  if (/^[0-9]/.test(clean)) {
    clean = `cmd_${clean}`;
  }
  return clean.slice(0, 32);
}

// Each directory carries the label shown to the user (📁 local / 🌐 global / project).
export function resolveSkillsDirectories({ cwd, home, projectsDir, activeSessionName }) {
  const dirs = [
    { dir: path.join(cwd, '.claude', 'skills'), source: 'local' },
    { dir: path.join(home, '.claude', 'skills'), source: 'global' }
  ];
  if (activeSessionName && projectsDir) {
    dirs.push({
      dir: path.join(projectsDir, activeSessionName.replace(/^claude-/, ''), '.claude', 'skills'),
      source: 'project'
    });
  }
  return dirs;
}

export async function scanSkills(directories = []) {
  const results = [];
  const seenIds = new Set();

  for (const dirEntry of directories) {
    const dir = typeof dirEntry === 'string' ? dirEntry : dirEntry.dir;
    const source = typeof dirEntry === 'string' ? undefined : dirEntry.source;
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        // Support regular directories and symlinks pointing to directories
        if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
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
              command: `/${name}`,
              source
            });
          }
        } catch {
          // File does not exist, invalid YAML, or broken symlink, skip
        }
      }
    } catch (err) {
      console.warn(`⚠️ Skills directory could not be read (${dir}):`, err.message);
    }
  }

  return results;
}

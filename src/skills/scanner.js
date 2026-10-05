// claude-telegram-bridge/src/skills/scanner.js
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { projectNameFromSession } from '../projects/manager.js';

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

// Each directory carries the label shown to the user (📁 local / 📁 global / project).
// An explicit projectPath (the real worktree path from orca-data.json) wins;
// the name-derived path stays as fallback for older callers that cannot pass one.
export function resolveSkillsDirectories({ cwd, home, projectsDir, activeSessionName, projectPath }) {
  const dirs = [
    { dir: path.join(cwd, '.claude', 'skills'), source: 'local' },
    { dir: path.join(home, '.claude', 'skills'), source: 'global' }
  ];
  if (projectPath) {
    dirs.push({ dir: path.join(projectPath, '.claude', 'skills'), source: 'project' });
  } else if (activeSessionName && projectsDir) {
    dirs.push({
      dir: path.join(projectsDir, projectNameFromSession(activeSessionName), '.claude', 'skills'),
      source: 'project'
    });
  }
  return dirs;
}

// Claude Code also loads plugin folders that hold .claude-plugin/plugin.json
// under ~/.claude/skills AND the project's .claude/skills (origin @skills-dir).
// scanSkills reads only <dir>/<name>/SKILL.md, so these inner skills need this
// probe. Default layout only: <pluginRoot>/skills/<name>/SKILL.md.
// pluginSource: 'plugin-local' under project/local dirs, 'plugin' under global.
export async function scanSkillsDirPlugin(pluginRoot, pluginSource, seenIds) {
  const results = [];
  let manifest;
  try {
    manifest = JSON.parse(
      await fs.readFile(path.join(pluginRoot, '.claude-plugin', 'plugin.json'), 'utf8')
    );
  } catch {
    return results; // broken or missing manifest -> skip silently
  }
  const pluginName = manifest.name || path.basename(pluginRoot);

  let dirs;
  try {
    dirs = await fs.readdir(path.join(pluginRoot, 'skills'), { withFileTypes: true });
  } catch {
    return results; // no skills/ layout -> nothing to list
  }

  for (const dirEntry of dirs) {
    if (!dirEntry.isDirectory() && !dirEntry.isSymbolicLink()) continue;
    let parsed;
    try {
      parsed = matter(await fs.readFile(path.join(pluginRoot, 'skills', dirEntry.name, 'SKILL.md'), 'utf8'));
    } catch {
      continue; // no/invalid SKILL.md -> skip
    }
    const name = parsed.data.name || dirEntry.name;
    const id = `skillsdir:${pluginName}:${name}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    results.push({
      id,
      name: `${pluginName}:${name}`,
      description: (parsed.data.description || 'No description provided').replace(/[*_`#]/g, '').trim(),
      command: `/${name}`,
      source: pluginSource
    });
  }
  return results;
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
          // Not a plain skill folder. Probe a skills-directory plugin instead:
          // a child dir with .claude-plugin/plugin.json, local under project dirs.
          const pluginSource = source === 'global' ? 'plugin' : 'plugin-local';
          results.push(...await scanSkillsDirPlugin(path.join(dir, entry.name), pluginSource, seenIds));
        }
      }
    } catch (err) {
      console.warn(`⚠️ Skills directory could not be read (${dir}):`, err.message);
    }
  }

  return results;
}

// Discover skills shipped inside Claude Code plugins. installed_plugins.json
// (v2) maps "<name>@<marketplace>" to install entries; entries without
// projectPath are global installs, entries with projectPath are project-scoped.
export async function scanPluginSkills({ home, projectPath } = {}) {
  const results = [];
  if (!home) return results;
  const pluginsFile = path.join(home, '.claude', 'plugins', 'installed_plugins.json');

  let raw;
  try {
    raw = await fs.readFile(pluginsFile, 'utf8');
  } catch {
    return results; // no plugins file -> no plugin skills
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.warn('⚠️ installed_plugins.json unreadable, skipping plugin skills:', err.message);
    return results;
  }

  const normProject = projectPath ? path.resolve(projectPath).toLowerCase() : null;
  const seen = new Set(); // dedup key: installPath + skill name

  for (const [key, entries] of Object.entries(data?.plugins || {})) {
    if (!Array.isArray(entries)) continue;
    const pluginName = key.split('@')[0];

    const eligible = entries.filter(entry => entry && entry.installPath && (
      !entry.projectPath ||
      (normProject && path.resolve(entry.projectPath).toLowerCase() === normProject)
    ));
    if (eligible.length === 0) continue;

    // A project-scoped install of the same plugin beats the global one
    const chosen = eligible.some(entry => entry.projectPath)
      ? eligible.filter(entry => entry.projectPath)
      : eligible;

    for (const install of chosen) {
      const skillsRoot = path.join(install.installPath, 'skills');
      let dirs;
      try {
        dirs = await fs.readdir(skillsRoot, { withFileTypes: true });
      } catch {
        continue; // installPath missing -> skip silently
      }
      for (const dirEntry of dirs) {
        if (!dirEntry.isDirectory() && !dirEntry.isSymbolicLink()) continue;
        let parsed;
        try {
          parsed = matter(await fs.readFile(path.join(skillsRoot, dirEntry.name, 'SKILL.md'), 'utf8'));
        } catch {
          continue; // no/invalid SKILL.md -> skip
        }
        const name = parsed.data.name || dirEntry.name;
        const dedupKey = `${install.installPath}:${name}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);
        results.push({
          id: `plugin:${pluginName}:${name}`,
          name: `${pluginName}:${name}`,
          description: (parsed.data.description || 'No description provided').replace(/[*_`#]/g, '').trim(),
          command: `/${name}`,
          source: install.projectPath ? 'plugin-local' : 'plugin',
          installPath: install.installPath
        });
      }
    }
  }

  return results;
}

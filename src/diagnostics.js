// claude-telegram-bridge/src/diagnostics.js
// Live bridge state for the /project-resources Telegram command (/diag is a
// hidden alias). Gathers what the bridge can see right now: active session,
// tmux sessions, and four name-only skill/plugin buckets.
import fs from 'node:fs/promises';
import path from 'node:path';
import { scanSkills, resolveSkillsDirectories, scanPluginSkills } from './skills/scanner.js';
import { projectNameFromSession } from './projects/manager.js';

export async function gatherDiagnostics({ cwd, home, projectsDir, activeSessionName, activeProjectPath, tmux }) {
  const dirs = resolveSkillsDirectories({
    cwd,
    home,
    projectsDir,
    activeSessionName,
    projectPath: activeProjectPath
  });

  const skillSources = [];
  const seen = new Set();
  let totalScannedSkills = 0;
  // Four name-only buckets for the /project-resources card. Names dedup across
  // overlapping dirs (cwd and an active worktree can hold the same skill).
  const localSkillNames = new Set();
  const globalSkillNames = new Set();
  const localPluginNames = new Set();
  const globalPluginNames = new Set();

  for (const { dir, source } of dirs) {
    // Duplicate dirs (e.g. cwd === home) would double-count; dedup them
    if (seen.has(dir)) continue;
    seen.add(dir);

    let exists = true;
    try {
      await fs.access(dir);
    } catch {
      exists = false;
    }

    const skills = exists ? await scanSkills([dir]) : [];
    totalScannedSkills += skills.length;
    // Skills-directory plugins carry their own source (plugin-local/plugin);
    // route them to the plugin buckets instead of the plain skill buckets.
    for (const skill of skills) {
      if (skill.source === 'plugin-local' || skill.source === 'plugin') {
        (skill.source === 'plugin' ? globalPluginNames : localPluginNames).add(skill.name);
      } else {
        (source === 'global' ? globalSkillNames : localSkillNames).add(skill.name);
      }
    }
    skillSources.push({
      dir,
      source,
      exists,
      skillCount: skills.length,
      skillNames: skills.map(s => s.name)
    });
  }

  let pluginSkills = [];
  try {
    // Explicit project path wins; the name-derived path stays as fallback.
    const pluginProjectPath = activeProjectPath
      || (activeSessionName && projectsDir
        ? path.join(projectsDir, projectNameFromSession(activeSessionName))
        : null);
    pluginSkills = await scanPluginSkills({ home, projectPath: pluginProjectPath });
  } catch {
    pluginSkills = [];
  }
  const pluginSources = [];
  const pluginSeen = new Set();
  for (const skill of pluginSkills) {
    if (pluginSeen.has(skill.installPath)) continue;
    pluginSeen.add(skill.installPath);
    pluginSources.push({
      installPath: skill.installPath,
      skillCount: pluginSkills.filter(s => s.installPath === skill.installPath).length,
      source: skill.source
    });
  }

  let tmuxSessions = [];
  try {
    tmuxSessions = await tmux.listSessions('claude-');
  } catch {
    tmuxSessions = [];
  }

  let activeSessionAlive = null;
  if (activeSessionName) {
    try {
      activeSessionAlive = await tmux.hasSession(activeSessionName);
    } catch {
      activeSessionAlive = false;
    }
  }

  // Plugin installs found via installed_plugins.json join the same buckets.
  for (const skill of pluginSkills) {
    (skill.source === 'plugin' ? globalPluginNames : localPluginNames).add(skill.name);
  }

  return {
    activeSession: activeSessionName,
    activeSessionAlive,
    tmuxSessions,
    skillSources,
    totalScannedSkills,
    pluginSources,
    plugins: pluginSkills.map(p => ({ name: p.name, source: p.source })),
    localSkillNames: [...localSkillNames],
    globalSkillNames: [...globalSkillNames],
    localPluginNames: [...localPluginNames],
    globalPluginNames: [...globalPluginNames]
  };
}

export function formatDiagnosticsMessage(diag) {
  const lines = ['🗂️ *Resources*', ''];

  if (diag.activeSession) {
    const status = diag.activeSessionAlive ? '🟢 Online' : '🔴 Terminated';
    lines.push(`🎯 *Active session:* \`${projectNameFromSession(diag.activeSession)}\` (${status})`);
  } else {
    lines.push('⚪ *No active session.*');
  }
  lines.push('');

  // Four name-only lists; a section with zero entries is omitted entirely.
  const section = (header, names) => {
    if (!names?.length) return;
    lines.push('', header);
    for (const name of names) lines.push(`• ${name}`);
  };
  section('📁 *Local skills:*', diag.localSkillNames);
  section('📁 *Global skills:*', diag.globalSkillNames);
  section('🧩 *Local plugins:*', diag.localPluginNames);
  section('🧩 *Global plugins:*', diag.globalPluginNames);

  return lines.join('\n');
}
// claude-telegram-bridge/src/diagnostics.js
// Live bridge health reporting for the /diag Telegram command.
// Gathers what the bridge can actually see right now: active session,
// tmux sessions, and per-directory skill discovery results.
import fs from 'node:fs/promises';
import path from 'node:path';
import { scanSkills, getBuiltInCommands, resolveSkillsDirectories, scanPluginSkills } from './skills/scanner.js';

export async function gatherDiagnostics({ cwd, home, projectsDir, activeSessionName, tmux }) {
  const dirs = resolveSkillsDirectories({ cwd, home, projectsDir, activeSessionName });

  const skillSources = [];
  const seen = new Set();
  let totalScannedSkills = 0;

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
    const pluginProjectPath = activeSessionName && projectsDir
      ? path.join(projectsDir, activeSessionName.replace(/^claude-/, ''))
      : null;
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
      skillCount: pluginSkills.filter(s => s.installPath === skill.installPath).length
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

  return {
    activeSession: activeSessionName,
    activeSessionAlive,
    tmuxSessions,
    skillSources,
    totalScannedSkills,
    builtinsCount: getBuiltInCommands().length,
    pluginSources,
    pluginSkillsCount: pluginSkills.length
  };
}

function formatDirLabel(dir) {
  if (dir.includes('.claude')) {
    const idx = dir.indexOf('.claude');
    return '…' + dir.slice(idx);
  }
  return dir;
}

export function formatDiagnosticsMessage(diag) {
  const lines = ['🩺 *Bridge Diagnostics*', ''];

  if (diag.activeSession) {
    const status = diag.activeSessionAlive ? '🟢 Online' : '🔴 Terminated';
    lines.push(`🎯 *Active session:* \`${diag.activeSession}\` (${status})`);
  } else {
    lines.push('⚪ *No active session.*');
  }
  lines.push(
    `🖥️ *tmux claude sessions:* ${diag.tmuxSessions.length ? diag.tmuxSessions.map(s => `\`${s}\``).join(', ') : 'none'}`,
    ''
  );

  lines.push('🗂️ *Skill sources:*');
  for (const source of diag.skillSources) {
    const marker = source.exists ? '✅' : '❌';
    const label = source.source ? ` (${source.source})` : '';
    lines.push(`${marker} \`${formatDirLabel(source.dir)}\`${label} — ${source.skillCount} skill(s)`);
    for (const name of source.skillNames) {
      lines.push(`   • ${name}`);
    }
  }
  if (diag.pluginSources?.length) {
    lines.push('', '🧩 *Plugin skills:*');
    for (const plugin of diag.pluginSources) {
      lines.push(`✅ \`${formatDirLabel(plugin.installPath)}\` — ${plugin.skillCount} skill(s)`);
    }
  }
  lines.push('');
  const pluginNote = diag.pluginSkillsCount ? ` + ${diag.pluginSkillsCount} plugin` : '';
  lines.push(`⚡ ${diag.totalScannedSkills} scanned + ${diag.builtinsCount} built-in${pluginNote} skill(s)`);

  return lines.join('\n');
}
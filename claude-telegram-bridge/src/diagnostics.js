// claude-telegram-bridge/src/diagnostics.js
// Live bridge health reporting for the /diag Telegram command.
// Gathers what the bridge can actually see right now: active session,
// tmux sessions, and per-directory skill discovery results.
import fs from 'node:fs/promises';
import path from 'node:path';
import { scanSkills, getBuiltInCommands, resolveSkillsDirectories } from './skills/scanner.js';

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
    builtinsCount: getBuiltInCommands().length
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
  lines.push('');
  lines.push(`⚡ ${diag.totalScannedSkills} scanned + ${diag.builtinsCount} built-in skill(s)`);

  return lines.join('\n');
}
import dotenv from 'dotenv';
import path from 'node:path';
import os from 'node:os';
dotenv.config();

export function loadConfig(env = process.env) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  if (!botToken || !botToken.trim()) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }

  const rawUsers = env.ALLOWED_USER_IDS;
  if (!rawUsers || !rawUsers.trim()) {
    throw new Error('ALLOWED_USER_IDS is required');
  }

  const allowedUserIds = rawUsers
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  if (allowedUserIds.length === 0) {
    throw new Error('ALLOWED_USER_IDS must contain at least one user ID');
  }

  return {
    botToken,
    allowedUserIds,
    projectsDir: env.PROJECTS_DIR || process.cwd(),
    claudeHome: env.CLAUDE_HOME || path.join(os.homedir(), '.claude'),
    tmuxPath: env.TMUX_PATH || 'tmux',
    pollIntervalMs: Number(env.POLL_INTERVAL_MS) || 1000,
    // How often the turn monitor samples the transport status. The monitor
    // decides when a status has settled enough to notify.
    typingIntervalMs: Number(env.TYPING_INTERVAL_MS) || 4000,
    // How long the typing indicator stays on after the last output event.
    // Output is what the indicator reports, not the whole turn.
    typingHoldMs: Number(env.TYPING_HOLD_MS) || 3000
  };
}

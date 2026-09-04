import dotenv from 'dotenv';
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
    tmuxPath: env.TMUX_PATH || 'tmux',
    pollIntervalMs: Number(env.POLL_INTERVAL_MS) || 1000
  };
}

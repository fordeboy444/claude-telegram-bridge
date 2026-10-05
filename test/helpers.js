// Shared test helpers: fixtures and stub factories used across test files.
import fs from 'node:fs/promises';
import path from 'node:path';

// Write a minimal SKILL.md into <root>/<folderName>/ as scanSkills expects it.
export async function makeSkill(root, folderName, name, description = 'A test skill') {
  const skillFolder = path.join(root, folderName);
  await fs.mkdir(skillFolder, { recursive: true });
  await fs.writeFile(
    path.join(skillFolder, 'SKILL.md'),
    `---\nname: ${name}\ndescription: ${description}\n---\nBody`
  );
  return skillFolder;
}

// Write a plugin skill folder: <installPath>/skills/<folder>/SKILL.md,
// as scanPluginSkills expects it.
export async function makePluginSkill(installPath, folder, name, description) {
  const skillFolder = path.join(installPath, 'skills', folder);
  await fs.mkdir(skillFolder, { recursive: true });
  await fs.writeFile(
    path.join(skillFolder, 'SKILL.md'),
    `---\nname: ${name}\ndescription: ${description}\n---\nBody`
  );
}

// Write ~/.claude/plugins/installed_plugins.json (v2 shape).
export async function writePluginsFile(home, plugins) {
  const pluginsDir = path.join(home, '.claude', 'plugins');
  await fs.mkdir(pluginsDir, { recursive: true });
  await fs.writeFile(
    path.join(pluginsDir, 'installed_plugins.json'),
    JSON.stringify({ version: 2, plugins }, null, 2)
  );
}

// Default createBot config for tests; irrelevant values only for auth scope.
export function defaultTestConfig(overrides = {}) {
  return {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111', '222'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000,
    ...overrides
  };
}

// Stub Telegraf bot. Registered handlers are recorded for later dispatch:
//   mockBot.handlers.on.text        -> bot.on('text', ...) handler
//   mockBot.handlers.actions[..]    -> bot.action(pattern, ...) handlers,
//                                      keyed by the pattern's toString()
export function makeBotMock() {
  const handlers = { on: {}, actions: {} };
  return {
    handlers,
    use: () => {},
    command: () => {},
    on: (evt, handler) => { handlers.on[evt] = handler; },
    action: (pattern, handler) => { handlers.actions[pattern.toString()] = handler; },
    telegram: {
      setMyCommands: async () => {},
      sendMessage: async () => {},
      sendChatAction: async () => {}
    }
  };
}

// Stub TmuxController. Override any method to record calls:
//   makeTmuxMock({ sendKeys: async (session, keys, enter) => { calls.push(...) } })
export function makeTmuxMock(overrides = {}) {
  return {
    hasSession: async () => true,
    listSessions: async () => [],
    getSessionOption: async () => null,
    capturePane: async () => '❯ normal terminal output',
    sendKeys: async () => {},
    sendKeysWithDelay: async () => {},
    killSession: async () => {},
    ...overrides
  };
}

// Fetch a registered bot.action handler whose pattern string contains the
// given substring (e.g. actionHandler(mockBot, 'qa:')). Returns null when the
// pattern was never registered.
export function actionHandler(mockBot, substring) {
  const key = Object.keys(mockBot.handlers.actions).find(k => k.includes(substring));
  return key ? mockBot.handlers.actions[key] : null;
}
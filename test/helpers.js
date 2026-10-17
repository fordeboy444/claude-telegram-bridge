// Shared test helpers: fixtures and stub factories used across test files.
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// Where the reader looks for Orca's profile on this platform: %APPDATA%\Orca
// on Windows, XDG_CONFIG_HOME-or-~/.config/orca elsewhere. Tests point the
// matching env var at a temp root, so both sides must use the same spelling.
export function orcaConfigDirUnder(root) {
  return process.platform === 'win32'
    ? path.join(root, 'Orca')
    : path.join(root, 'orca');
}

// Write an Orca live profile store (profile-state.db) under a temp config
// root, mirroring the real schema: one JSON payload per domain. Returns the
// db path.
export function writeOrcaProfileStateDb(root, domains) {
  const profileDir = path.join(orcaConfigDirUnder(root), 'profiles', 'local-default');
  fsSync.mkdirSync(profileDir, { recursive: true });
  const dbPath = path.join(profileDir, 'profile-state.db');
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE profile_state_documents (
    domain TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL,
    domain_version INTEGER NOT NULL, revision INTEGER NOT NULL,
    updated_at INTEGER NOT NULL, content_hash TEXT NOT NULL
  )`);
  const stmt = db.prepare(
    'INSERT INTO profile_state_documents (domain, payload, domain_version, revision, updated_at, content_hash) VALUES (?, ?, 1, 1, 1, ?)'
  );
  for (const [domain, payload] of Object.entries(domains)) {
    stmt.run(domain, JSON.stringify(payload), 'hash');
  }
  db.close();
  return dbPath;
}

// Point the platform's Orca config env var at a temp root and return a
// restore function. Keeps each test's env mutation contained.
export function useOrcaConfigRoot(root) {
  const key = process.platform === 'win32' ? 'APPDATA' : 'XDG_CONFIG_HOME';
  const previous = process.env[key];
  process.env[key] = root;
  return () => {
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  };
}

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

// Write a skills-directory plugin as scanSkillsDirPlugin expects it:
//   <skillsRoot>/<pluginFolder>/.claude-plugin/plugin.json
//   <skillsRoot>/<pluginFolder>/skills/<skillFolder>/SKILL.md
export async function makeSkillsDirPlugin(skillsRoot, pluginFolder, pluginName, skillFolder, skillName, description = 'A plugin skill') {
  const pluginRoot = path.join(skillsRoot, pluginFolder);
  await fs.mkdir(path.join(pluginRoot, '.claude-plugin'), { recursive: true });
  await fs.writeFile(
    path.join(pluginRoot, '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name: pluginName })
  );
  await makeSkill(path.join(pluginRoot, 'skills'), skillFolder, skillName, description);
  return pluginRoot;
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
    claudeHome: path.join(os.homedir(), '.claude'),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000,
    ...overrides
  };
}

// Stub Telegraf bot. Registered handlers are recorded for later dispatch:
//   mockBot.handlers.on.text        -> bot.on('text', ...) handler
//   mockBot.handlers.commands[name] -> bot.command(name, ...) handler
//   mockBot.handlers.actions[..]    -> bot.action(pattern, ...) handlers,
//                                      keyed by the pattern's toString()
export function makeBotMock() {
  const handlers = { on: {}, commands: {}, actions: {} };
  return {
    handlers,
    use: () => {},
    command: (name, handler) => { handlers.commands[name] = handler; },
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
// claude-telegram-bridge/test/diagnostics.test.js
// /diag command internals: gathering live bridge state and formatting it
// into a readable Telegram message.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { gatherDiagnostics, formatDiagnosticsMessage } from '../src/diagnostics.js';

async function makeSkill(root, folderName, name) {
  const skillFolder = path.join(root, folderName);
  await fs.mkdir(skillFolder, { recursive: true });
  await fs.writeFile(
    path.join(skillFolder, 'SKILL.md'),
    `---\nname: ${name}\ndescription: Test skill ${name}\n---\nBody`
  );
}

async function makePluginSkill(installPath, folder, name, description) {
  const skillFolder = path.join(installPath, 'skills', folder);
  await fs.mkdir(skillFolder, { recursive: true });
  await fs.writeFile(
    path.join(skillFolder, 'SKILL.md'),
    `---\nname: ${name}\ndescription: ${description}\n---\nBody`
  );
}

test('gatherDiagnostics reports skill counts per source directory', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'diag-test-'));
  const home = path.join(tmp, 'home');
  await fs.mkdir(path.join(tmp, '.claude', 'skills'), { recursive: true });
  await fs.mkdir(path.join(home, '.claude', 'skills'), { recursive: true });
  await makeSkill(path.join(tmp, '.claude', 'skills'), 'alpha', 'local-skill');
  await makeSkill(path.join(home, '.claude', 'skills'), 'beta', 'user-skill');
  await makeSkill(path.join(home, '.claude', 'skills'), 'gamma', 'user-skill-2');

  const diag = await gatherDiagnostics({
    cwd: tmp,
    home,
    projectsDir: path.join(tmp, 'projects'),
    activeSessionName: null,
    tmux: { listSessions: async () => [], hasSession: async () => false }
  });

  assert.equal(diag.skillSources.length, 2);
  assert.equal(diag.skillSources[0].dir, path.join(tmp, '.claude', 'skills'));
  assert.equal(diag.skillSources[0].skillCount, 1);
  assert.deepEqual(diag.skillSources[0].skillNames, ['local-skill']);
  assert.equal(diag.skillSources[0].source, 'local');
  assert.equal(diag.skillSources[1].source, 'global');
  assert.equal(diag.skillSources[1].dir, path.join(home, '.claude', 'skills'));
  assert.equal(diag.skillSources[1].skillCount, 2);
  assert.equal(diag.totalScannedSkills, 3);

  await fs.rm(tmp, { recursive: true, force: true });
});

test('gatherDiagnostics dedups identical source directories', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'diag-dedup-'));

  const diag = await gatherDiagnostics({
    cwd: tmp,
    home: tmp, // local and user skills dirs resolve to the same path
    projectsDir: null,
    activeSessionName: null,
    tmux: { listSessions: async () => [], hasSession: async () => false }
  });

  assert.equal(diag.skillSources.length, 1);

  await fs.rm(tmp, { recursive: true, force: true });
});

test('gatherDiagnostics flags missing directories and reports tmux state', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'diag-missing-'));
  const diag = await gatherDiagnostics({
    cwd: tmp,
    home: path.join(tmp, 'nope'),
    projectsDir: path.join(tmp, 'projects'),
    activeSessionName: 'claude-my-app',
    tmux: {
      listSessions: async () => ['claude-my-app'],
      hasSession: async () => true
    }
  });

  assert.equal(diag.activeSession, 'claude-my-app');
  assert.equal(diag.activeSessionAlive, true);
  assert.deepEqual(diag.tmuxSessions, ['claude-my-app']);

  const missing = diag.skillSources.filter(s => !s.exists);
  assert.ok(missing.length >= 1, 'should flag the missing home skills dir');
  assert.equal(missing[0].skillCount, 0);

  await fs.rm(tmp, { recursive: true, force: true });
});

test('gatherDiagnostics survives a tmux failure without throwing', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'diag-tmux-'));
  const diag = await gatherDiagnostics({
    cwd: tmp,
    home: tmp,
    projectsDir: null,
    activeSessionName: null,
    tmux: {
      listSessions: async () => { throw new Error('tmux not found'); },
      hasSession: async () => { throw new Error('tmux not found'); }
    }
  });

  assert.equal(diag.activeSession, null);
  assert.equal(diag.tmuxSessions.length, 0);

  await fs.rm(tmp, { recursive: true, force: true });
});

test('gatherDiagnostics lists plugin skill sources', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'diag-plugin-'));
  const home = path.join(tmp, 'home');
  const installPath = path.join(tmp, 'plugins', 'superpowers');
  await makePluginSkill(installPath, 'alpha', 'plug-skill', 'From plugin');
  await fs.mkdir(path.join(home, '.claude', 'plugins'), { recursive: true });
  await fs.writeFile(
    path.join(home, '.claude', 'plugins', 'installed_plugins.json'),
    JSON.stringify({ plugins: { 'superpowers@obra': [{ installPath }] } })
  );

  const diag = await gatherDiagnostics({
    cwd: tmp,
    home,
    projectsDir: null,
    activeSessionName: null,
    tmux: { listSessions: async () => [], hasSession: async () => false }
  });

  assert.equal(diag.pluginSkillsCount, 1);
  assert.equal(diag.pluginSources.length, 1);
  assert.equal(diag.pluginSources[0].installPath, installPath);
  assert.equal(diag.pluginSources[0].skillCount, 1);

  await fs.rm(tmp, { recursive: true, force: true });
});

test('formatDiagnosticsMessage renders readable Telegram markdown', async () => {
  const message = formatDiagnosticsMessage({
    activeSession: 'claude-my-app',
    activeSessionAlive: true,
    tmuxSessions: ['claude-my-app'],
    skillSources: [
      { dir: '/bridge/.claude/skills', exists: true, skillCount: 2, skillNames: ['one', 'two'] },
      { dir: '/home/.claude/skills', exists: false, skillCount: 0, skillNames: [] }
    ],
    totalScannedSkills: 2,
    builtinsCount: 6,
    pluginSources: [{ installPath: '/home/.claude/plugins/cache/superpowers', skillCount: 2 }],
    pluginSkillsCount: 2
  });

  assert.match(message, /claude-my-app/);
  assert.match(message, /🟢/); // alive session
  assert.match(message, /2 skill/);
  assert.match(message, /❌/); // missing dir marker
  assert.match(message, /🧩/); // plugin section rendered
  assert.match(message, /2 plugin/);
  assert.ok(!message.includes('undefined'));
});
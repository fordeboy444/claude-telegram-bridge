// claude-telegram-bridge/test/diagnostics.test.js
// /resources command internals: gathering live bridge state and formatting it
// into a readable Telegram message.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { gatherDiagnostics, formatDiagnosticsMessage } from '../src/diagnostics.js';
import { makeSkill, makePluginSkill } from './helpers.js';

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

  assert.equal(diag.plugins.length, 1);
  assert.equal(diag.plugins[0].name, 'superpowers:plug-skill');
  assert.equal(diag.plugins[0].source, 'plugin');
  assert.equal(diag.pluginSources.length, 1);
  assert.equal(diag.pluginSources[0].installPath, installPath);
  assert.equal(diag.pluginSources[0].skillCount, 1);

  await fs.rm(tmp, { recursive: true, force: true });
});

test('gatherDiagnostics scans the explicit activeProjectPath and matches plugin installs against it', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'diag-projpath-'));
  const home = path.join(tmp, 'home');
  const worktreePath = path.join(tmp, 'worktrees', 'feat'); // NOT under projectsDir/<session-name>
  await makeSkill(path.join(worktreePath, '.claude', 'skills'), 'proj-skill', 'worktree-skill');
  const installPath = path.join(tmp, 'plugins', 'bridge');
  await makePluginSkill(installPath, 'deploy', 'deploy', 'Deploy app');
  await fs.mkdir(path.join(home, '.claude', 'plugins'), { recursive: true });
  await fs.writeFile(
    path.join(home, '.claude', 'plugins', 'installed_plugins.json'),
    JSON.stringify({ plugins: { 'bridge@market': [{ installPath, projectPath: worktreePath.toUpperCase() }] } })
  );

  const diag = await gatherDiagnostics({
    cwd: tmp,
    home,
    projectsDir: path.join(tmp, 'projects'),
    activeSessionName: 'claude-feat',
    activeProjectPath: worktreePath,
    tmux: { listSessions: async () => [], hasSession: async () => false }
  });

  const project = diag.skillSources.find(s => s.source === 'project');
  assert.ok(project, 'project source present');
  assert.equal(project.dir, path.join(worktreePath, '.claude', 'skills'));
  assert.equal(project.skillCount, 1);
  assert.deepEqual(project.skillNames, ['worktree-skill']);

  assert.equal(diag.plugins.length, 1, 'project-scoped install matched against the worktree path');
  assert.equal(diag.plugins[0].source, 'plugin-local');

  await fs.rm(tmp, { recursive: true, force: true });
});

test('formatDiagnosticsMessage renders four name-only lists from gathered state', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'diag-format-'));
  const home = path.join(tmp, 'home');
  const worktree = path.join(tmp, 'worktrees', 'feat');
  await makeSkill(path.join(tmp, '.claude', 'skills'), 'alpha', 'local-skill');
  await makeSkill(path.join(home, '.claude', 'skills'), 'beta', 'user-skill');
  await makeSkill(path.join(worktree, '.claude', 'skills'), 'gamma', 'worktree-skill');
  const localInstall = path.join(tmp, 'plugins', 'bridge');
  const globalInstall = path.join(tmp, 'plugins', 'superpowers');
  await makePluginSkill(localInstall, 'deploy', 'deploy-skill', 'Local plugin skill');
  await makePluginSkill(globalInstall, 'review', 'review-skill', 'Global plugin skill');
  await fs.mkdir(path.join(home, '.claude', 'plugins'), { recursive: true });
  await fs.writeFile(
    path.join(home, '.claude', 'plugins', 'installed_plugins.json'),
    JSON.stringify({
      plugins: {
        'bridge@market': [{ installPath: localInstall, projectPath: worktree.toUpperCase() }],
        'superpowers@obra': [{ installPath: globalInstall }]
      }
    })
  );

  const diag = await gatherDiagnostics({
    cwd: tmp,
    home,
    projectsDir: path.join(tmp, 'projects'),
    activeSessionName: 'claude-my-app',
    activeProjectPath: worktree,
    tmux: { listSessions: async () => ['claude-my-app'], hasSession: async () => true }
  });
  const message = formatDiagnosticsMessage(diag);

  assert.match(message, /🗂️ \*Resources\*/);
  assert.match(message, /`my-app`/); // project name shown, prefix stripped
  assert.ok(!/claude-my-app/.test(message)); // raw session name gone
  assert.match(message, /🟢/); // alive session
  assert.match(message, /📁 \*Local skills:\*\n• local-skill\n• worktree-skill/);
  assert.match(message, /📁 \*Global skills:\*\n• user-skill/);
  assert.match(message, /🧩 \*Local plugins:\*\n• bridge:deploy-skill/);
  assert.match(message, /🧩 \*Global plugins:\*\n• superpowers:review-skill/);
  assert.ok(!message.includes('.claude')); // no paths in the card
  assert.ok(!message.includes('tmux claude sessions')); // sessions row removed
  assert.ok(!/scanned/.test(message)); // no totals row
  assert.ok(!message.includes('undefined'));

  await fs.rm(tmp, { recursive: true, force: true });
});

test('formatDiagnosticsMessage omits sections with no entries', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'diag-omit-'));
  const home = path.join(tmp, 'home');
  await makeSkill(path.join(home, '.claude', 'skills'), 'beta', 'user-skill');

  const diag = await gatherDiagnostics({
    cwd: tmp,
    home,
    projectsDir: path.join(tmp, 'projects'),
    activeSessionName: null,
    tmux: { listSessions: async () => [], hasSession: async () => false }
  });
  const message = formatDiagnosticsMessage(diag);

  assert.match(message, /📁 \*Global skills:\*/);
  assert.ok(!message.includes('*Local skills:*'));
  assert.ok(!message.includes('*Local plugins:*'));
  assert.ok(!message.includes('*Global plugins:*'));

  await fs.rm(tmp, { recursive: true, force: true });
});

test('formatDiagnosticsMessage dedups a skill present in cwd and worktree dirs', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'diag-dup-'));
  const worktree = path.join(tmp, 'worktrees', 'feat');
  await makeSkill(path.join(tmp, '.claude', 'skills'), 'dup', 'shared-skill');
  await makeSkill(path.join(worktree, '.claude', 'skills'), 'dup', 'shared-skill');

  const diag = await gatherDiagnostics({
    cwd: tmp,
    home: path.join(tmp, 'home'),
    projectsDir: path.join(tmp, 'projects'),
    activeSessionName: 'claude-feat',
    activeProjectPath: worktree,
    tmux: { listSessions: async () => [], hasSession: async () => false }
  });
  const message = formatDiagnosticsMessage(diag);

  assert.equal(diag.localSkillNames.filter(n => n === 'shared-skill').length, 1);
  assert.equal(message.split('\n').filter(l => l === '• shared-skill').length, 1);
  assert.match(message, /📁 \*Local skills:\*/);
  assert.ok(!/\*Global skills:\*/.test(message));

  await fs.rm(tmp, { recursive: true, force: true });
});

test('formatDiagnosticsMessage strips the prefix from suffixed session names', async () => {
  const message = formatDiagnosticsMessage({
    activeSession: 'claude-my-app-2',
    activeSessionAlive: true,
    tmuxSessions: ['claude-my-app-2'],
    localSkillNames: [],
    globalSkillNames: [],
    localPluginNames: [],
    globalPluginNames: []
  });

  assert.match(message, /`my-app-2`/); // only the leading claude- is removed
  assert.ok(!/claude-my-app/.test(message));
  assert.ok(!/my-app-2-2/.test(message)); // no double strip of the inner text
});
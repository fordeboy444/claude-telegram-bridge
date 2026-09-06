import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ProjectManager } from '../src/projects/manager.js';
import { buildProjectsMenu, buildProjectActionView } from '../src/projects/menu.js';

test('ProjectManager discovers folders and correlates active tmux sessions', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'proj-test-'));
  await fs.mkdir(path.join(tmpDir, 'web-backend'));
  await fs.mkdir(path.join(tmpDir, 'mobile-app'));
  await fs.mkdir(path.join(tmpDir, '.git')); // Hidden folder, should be ignored

  const mockController = {
    listSessions: async () => ['claude-web-backend']
  };

  const manager = new ProjectManager(tmpDir, mockController, { orcaReader: async () => [] });
  const list = await manager.listProjects();

  assert.equal(list.length, 2);
  const webProj = list.find(p => p.name === 'web-backend');
  const mobProj = list.find(p => p.name === 'mobile-app');

  assert.deepEqual(webProj.runningSessions, ['claude-web-backend']);
  assert.deepEqual(mobProj.runningSessions, []);

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('ProjectManager uses orcaReader when provided', async () => {
  const mockOrcaReader = async () => [
    { name: 'Orca Project 1', displayName: 'Orca Project 1', path: '/orca/path/1', kind: 'orca' }
  ];

  const mockController = {
    listSessions: async () => ['claude-Orca-Project-1']
  };

  const manager = new ProjectManager('/tmp/fallback', mockController, { orcaReader: mockOrcaReader });
  const list = await manager.listProjects();

  assert.equal(list.length, 1);
  assert.equal(list[0].name, 'Orca Project 1');
  assert.equal(list[0].path, '/orca/path/1');
  assert.deepEqual(list[0].runningSessions, ['claude-Orca-Project-1']);
});

test('normalizeSessionName replaces spaces and special characters', async () => {
  const manager = new ProjectManager('/tmp', {});
  assert.equal(manager.normalizeSessionName('Main Agent'), 'Main-Agent');
  assert.equal(manager.normalizeSessionName('foo/bar#baz'), 'foo-bar-baz');
  assert.equal(manager.normalizeSessionName('test_project-123'), 'test_project-123');
});

test('killCurrentSession terminates only the current session for that project', async () => {
  let killed = [];
  const mockController = {
    hasSession: async (name) => name === 'claude-Main-Agent',
    killSession: async (name) => { killed.push(name); }
  };

  const manager = new ProjectManager('/tmp', mockController);
  await manager.killCurrentSession('Main Agent');

  assert.deepEqual(killed, ['claude-Main-Agent']);
});

test('ProjectManager starts a fresh session by terminating previous if existing', async () => {
  let killed = [];
  let created = [];
  let optionsSet = [];

  const mockController = {
    hasSession: async (name) => name === 'claude-web-backend',
    killSession: async (name) => { killed.push(name); },
    newSession: async (name, cwd, cmd) => { created.push({ name, cwd, cmd }); },
    setSessionOption: async (session, key, value) => { optionsSet.push({ session, key, value }); }
  };

  const manager = new ProjectManager('/tmp/projects', mockController);
  const session = await manager.startFreshSession('web-backend');

  assert.equal(session, 'claude-web-backend');
  assert.deepEqual(killed, ['claude-web-backend']);
  assert.equal(created.length, 1);
  assert.equal(created[0].name, 'claude-web-backend');

  // Launch command pins the session id so the bridge can bind the transcript
  const match = created[0].cmd.match(/^claude --session-id ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}) --permission-mode bypassPermissions$/);
  assert.ok(match, `expected --session-id launch command, got: ${created[0].cmd}`);

  assert.equal(optionsSet.length, 1);
  assert.equal(optionsSet[0].session, 'claude-web-backend');
  assert.equal(optionsSet[0].key, '@claude_session_id');
  assert.equal(optionsSet[0].value, match[1]);
});

test('ProjectManager kills all sessions matching project prefix', async () => {
  let killed = [];

  const mockController = {
    listSessions: async (prefix) => ['claude-web', 'claude-web-worker', 'claude-other'],
    killSession: async (name) => { killed.push(name); }
  };

  const manager = new ProjectManager('/tmp/projects', mockController);
  await manager.killProjectSessions('web');

  assert.deepEqual(killed, ['claude-web', 'claude-web-worker']);
});

test('findProjectBySession resolves the project that owns a live session', async () => {
  const mockController = {
    listSessions: async () => ['claude-claude-code-telegram']
  };
  const manager = new ProjectManager('/tmp/projects', mockController, { orcaReader: async () => [
    { name: 'claude-code-telegram', displayName: 'claude-code-telegram', path: 'C:/projects/claude-code-telegram', kind: 'orca' }
  ] });

  const match = await manager.findProjectBySession('claude-claude-code-telegram');
  assert.ok(match, 'expected a project match for the live session');
  assert.equal(match.name, 'claude-code-telegram');
  assert.equal(match.path, 'C:/projects/claude-code-telegram');

  const noMatch = await manager.findProjectBySession('claude-unknown-project');
  assert.equal(noMatch, null);
});

test('buildProjectsMenu renders list with status badges', () => {
  const projects = [
    { name: 'web-backend', runningSessions: ['claude-web-backend'] },
    { name: 'mobile-app', runningSessions: [] }
  ];

  const menu = buildProjectsMenu(projects);
  assert.ok(menu.text.includes('Projects'));
  const buttons = menu.reply_markup.inline_keyboard.flat();
  assert.ok(buttons.some(b => b.text.includes('web-backend') && b.text.includes('🟢')));
  assert.ok(buttons.some(b => b.text.includes('mobile-app') && b.text.includes('⚪')));
});

test('buildProjectsMenu renders empty state when no projects exist', () => {
  const menu = buildProjectsMenu([]);
  assert.ok(menu.text.includes('No project folders found'));
  assert.deepEqual(menu.reply_markup.inline_keyboard, []);
});

test('buildProjectActionView renders appropriate buttons based on running status', () => {
  const idleProj = { name: 'mobile-app', path: '/projects/mobile-app', runningSessions: [] };
  const idleView = buildProjectActionView(idleProj);
  assert.ok(idleView.text.includes('mobile-app'));
  assert.ok(idleView.text.includes('No active current session'));
  const idleButtons = idleView.reply_markup.inline_keyboard.flat();
  assert.ok(idleButtons.some(b => b.text.includes('Start Session')));
  assert.ok(!idleButtons.some(b => b.text.includes('Kill Current Session')));
  assert.ok(!idleButtons.some(b => b.text.includes('Connect')), 'idle project must not offer Connect');

  const runningProj = { name: 'web-backend', path: '/projects/web-backend', runningSessions: ['claude-web-backend'] };
  const runningView = buildProjectActionView(runningProj);
  assert.ok(runningView.text.includes('Active (Session: claude-web-backend)'));
  const runningButtons = runningView.reply_markup.inline_keyboard.flat();
  assert.ok(runningButtons.some(b => b.text.includes('End Session')));
  assert.ok(!runningButtons.some(b => b.text.includes('Connect')), 'running project must not offer Connect');
});

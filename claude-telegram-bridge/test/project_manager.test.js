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

  const manager = new ProjectManager(tmpDir, mockController);
  const list = await manager.listProjects();

  assert.equal(list.length, 2);
  const webProj = list.find(p => p.name === 'web-backend');
  const mobProj = list.find(p => p.name === 'mobile-app');

  assert.deepEqual(webProj.runningSessions, ['claude-web-backend']);
  assert.deepEqual(mobProj.runningSessions, []);

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('ProjectManager starts a fresh session by terminating previous if existing', async () => {
  let killed = [];
  let created = [];

  const mockController = {
    hasSession: async (name) => name === 'claude-web-backend',
    killSession: async (name) => { killed.push(name); },
    newSession: async (name, cwd, cmd) => { created.push({ name, cwd, cmd }); }
  };

  const manager = new ProjectManager('/tmp/projects', mockController);
  const session = await manager.startFreshSession('web-backend');

  assert.equal(session, 'claude-web-backend');
  assert.deepEqual(killed, ['claude-web-backend']);
  assert.equal(created.length, 1);
  assert.equal(created[0].name, 'claude-web-backend');
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
  assert.ok(idleView.text.includes('⚪ Idle'));
  const idleButtons = idleView.reply_markup.inline_keyboard.flat();
  assert.ok(idleButtons.some(b => b.text.includes('Start Fresh Session')));
  assert.ok(!idleButtons.some(b => b.text.includes('Kill All Sessions')));

  const runningProj = { name: 'web-backend', path: '/projects/web-backend', runningSessions: ['claude-web-backend'] };
  const runningView = buildProjectActionView(runningProj);
  assert.ok(runningView.text.includes('🟢 Running'));
  const runningButtons = runningView.reply_markup.inline_keyboard.flat();
  assert.ok(runningButtons.some(b => b.text.includes('Kill All Sessions')));
});

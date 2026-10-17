import assert from 'node:assert/strict';
import { test } from 'node:test';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ProjectManager } from '../src/projects/manager.js';

// A launcher must point tmux at a directory that exists, so each test makes
// a real one and removes it again.
function makeProjectDir() {
  return fsSync.mkdtempSync(path.join(os.tmpdir(), 'wsl-proj-'));
}

// Minimal tmux stub: records calls, reports no live sessions.
function makeStub() {
  const calls = { newSession: [], setOption: [], killed: [] };
  return {
    calls,
    tmuxPath: 'wsl -d Ubuntu tmux',
    hasSession: async (name) => false,
    killSession: async (name) => { calls.killed.push(name); },
    listSessions: async () => [],
    newSession: async (name, cwd, cmd) => {
      calls.newSession.push({ name, cwd, cmd });
    },
    setSessionOption: async (session, key, value) => {
      calls.setOption.push({ session, key, value });
    }
  };
}

test('startFreshSession launches claude.exe when tmux runs via wsl', async () => {
  const tmux = makeStub();
  const projectDir = makeProjectDir();
  const pm = new ProjectManager(path.dirname(projectDir), tmux, { hookSettingsPath: null });
  await pm.startFreshSession('web', projectDir);

  const launched = tmux.calls.newSession[0];
  assert.ok(launched, 'a session was created');
  const match = launched.cmd.match(/^claude\.exe --session-id ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}) --permission-mode bypassPermissions$/);
  assert.ok(match, `expected claude.exe --session-id launch command, got: ${launched.cmd}`);

  fsSync.rmSync(projectDir, { recursive: true, force: true });
});

test('startFreshSession keeps bare claude when tmux is native (no wsl)', async () => {
  const tmux = makeStub();
  const projectDir = makeProjectDir();
  const pm = new ProjectManager(path.dirname(projectDir), tmux, { hookSettingsPath: null });
  pm.cliExecutable = 'claude';
  await pm.startFreshSession('web', projectDir);

  const launched = tmux.calls.newSession[0];
  const match = launched.cmd.match(/^claude --session-id /);
  assert.ok(match, `expected bare claude launch command, got: ${launched.cmd}`);

  fsSync.rmSync(projectDir, { recursive: true, force: true });
});

test('startFreshSession appends the quoted --settings flag on wsl launches too', async () => {
  const tmux = makeStub();
  const projectDir = makeProjectDir();
  const pm = new ProjectManager(path.dirname(projectDir), tmux, { hookSettingsPath: '/tmp/hook-settings.json' });
  await pm.startFreshSession('web', projectDir);

  const launched = tmux.calls.newSession[0];
  assert.match(
    launched.cmd,
    /^claude\.exe --session-id [0-9a-f-]+ --permission-mode bypassPermissions --settings "\/tmp\/hook-settings\.json"$/
  );

  fsSync.rmSync(projectDir, { recursive: true, force: true });
});
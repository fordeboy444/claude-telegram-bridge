import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ProjectManager } from '../src/projects/manager.js';

// Minimal tmux stub: records calls, reports no live sessions.
function makeStub() {
  const calls = { newSession: [], setOption: [], killed: [] };
  return {
    calls,
    tmuxPath: 'wsl -d Ubuntu tmux',
    hasSession: async (name) => calls.killed.includes(name) ? false : false,
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
  const pm = new ProjectManager('C:/projects', tmux, { hookSettingsPath: null });
  await pm.startFreshSession('web', 'C:/projects/web');

  const launched = tmux.calls.newSession[0];
  assert.ok(launched, 'a session was created');
  const match = launched.cmd.match(/^claude\.exe --session-id ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}) --permission-mode bypassPermissions$/);
  assert.ok(match, `expected claude.exe --session-id launch command, got: ${launched.cmd}`);
});

test('startFreshSession keeps bare claude when tmux is native (no wsl)', async () => {
  const tmux = makeStub();
  const pm = new ProjectManager('C:/projects', tmux, { hookSettingsPath: null });
  pm.cliExecutable = 'claude';
  await pm.startFreshSession('web', 'C:/projects/web');

  const launched = tmux.calls.newSession[0];
  const match = launched.cmd.match(/^claude --session-id /);
  assert.ok(match, `expected bare claude launch command, got: ${launched.cmd}`);
});

test('startFreshSession appends the quoted --settings flag on wsl launches too', async () => {
  const tmux = makeStub();
  const pm = new ProjectManager('C:/projects', tmux, { hookSettingsPath: '/tmp/hook-settings.json' });
  await pm.startFreshSession('web', 'C:/projects/web');

  const launched = tmux.calls.newSession[0];
  assert.match(
    launched.cmd,
    /^claude\.exe --session-id [0-9a-f-]+ --permission-mode bypassPermissions --settings "\/tmp\/hook-settings\.json"$/
  );
});
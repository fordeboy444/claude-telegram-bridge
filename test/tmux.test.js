import test from 'node:test';
import assert from 'node:assert/strict';
import { TmuxController } from '../src/tmux/controller.js';

test('TmuxController.hasSession returns true when session exists', async () => {
  const mockExec = (file, args, cb) => {
    assert.equal(file, 'tmux');
    assert.deepEqual(args, ['has-session', '-t', 'test-sess']);
    cb(null, '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const exists = await controller.hasSession('test-sess');
  assert.equal(exists, true);
});

test('TmuxController.hasSession returns false when session does not exist', async () => {
  const mockExec = (file, args, cb) => {
    cb(new Error('session not found'), '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const exists = await controller.hasSession('non-existent');
  assert.equal(exists, false);
});

test('TmuxController.listSessions filters by prefix', async () => {
  const mockExec = (file, args, cb) => {
    cb(null, 'claude-web\nclaude-backend\nrandom-session\n', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const sessions = await controller.listSessions('claude-');
  assert.deepEqual(sessions, ['claude-web', 'claude-backend']);
});

test('TmuxController.listSessions returns all when no prefix provided', async () => {
  const mockExec = (file, args, cb) => {
    cb(null, 'claude-web\nrandom-session\n', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const sessions = await controller.listSessions();
  assert.deepEqual(sessions, ['claude-web', 'random-session']);
});

test('TmuxController.listSessions handles error gracefully by returning empty array', async () => {
  const mockExec = (file, args, cb) => {
    cb(new Error('no server running'), '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const sessions = await controller.listSessions();
  assert.deepEqual(sessions, []);
});

test('TmuxController.newSession passes an argv array (no shell string)', async () => {
  let invoked = null;
  const mockExec = (file, args, cb) => {
    invoked = { file, args };
    cb(null, '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  await controller.newSession('my-sess', '/home/user/app', 'npm start');
  assert.deepEqual(invoked, {
    file: 'tmux',
    args: ['new-session', '-d', '-s', 'my-sess', '-c', '/home/user/app', 'npm start']
  });
});

test('TmuxController.killSession executes kill-session and ignores not found errors', async () => {
  let invoked = null;
  const mockExec = (file, args, cb) => {
    invoked = { file, args };
    cb(new Error('session not found'), '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  await assert.doesNotReject(async () => {
    await controller.killSession('test-sess');
  });
  assert.deepEqual(invoked, {
    file: 'tmux',
    args: ['kill-session', '-t', 'test-sess']
  });
});

test('TmuxController.sendKeys passes raw user text as one argv (no shell expansion)', async () => {
  const calls = [];
  const mockExec = (file, args, cb) => {
    calls.push({ file, args });
    cb(null, '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  // $() and backticks must arrive untouched: no shell ever parses them.
  await controller.sendKeys('test-sess', '$(reboot) `evil` "hello"', true);
  assert.deepEqual(calls, [
    {
      file: 'tmux',
      args: ['send-keys', '-t', 'test-sess', '-l', '$(reboot) `evil` "hello"']
    },
    {
      file: 'tmux',
      args: ['send-keys', '-t', 'test-sess', 'Enter']
    }
  ]);
});

test('TmuxController.sendKeys does not send Enter when pressEnter is false', async () => {
  const calls = [];
  const mockExec = (file, args, cb) => {
    calls.push(args);
    cb(null, '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  await controller.sendKeys('test-sess', 'just-text', false);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], ['send-keys', '-t', 'test-sess', '-l', 'just-text']);
});

test('TmuxController.sendKeys sends Enter as a second exec when pressEnter is true', async () => {
  const calls = [];
  const mockExec = (file, args, cb) => {
    calls.push(args);
    cb(null, '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  await controller.sendKeys('test-sess', 'just-text', true);
  assert.deepEqual(calls, [
    ['send-keys', '-t', 'test-sess', '-l', 'just-text'],
    ['send-keys', '-t', 'test-sess', 'Enter']
  ]);
});

test('TmuxController.capturePane executes capture-pane and returns stdout', async () => {
  const mockExec = (file, args, cb) => {
    assert.deepEqual(args, ['capture-pane', '-p', '-t', 'test-sess', '-S', '-50']);
    cb(null, 'pane output lines', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const out = await controller.capturePane('test-sess', -50);
  assert.equal(out, 'pane output lines');
});

test('TmuxController.capturePane returns empty string on session not found error', async () => {
  const mockExec = (file, args, cb) => {
    cb(new Error('session not found'), '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const out = await controller.capturePane('missing-sess');
  assert.equal(out, '');
});

test('TmuxController.setSessionOption passes key and value as argv', async () => {
  let invoked = null;
  const mockExec = (file, args, cb) => {
    invoked = { file, args };
    cb(null, '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  await controller.setSessionOption('test-sess', '@claude_session_id', 'uuid-1');
  assert.deepEqual(invoked, {
    file: 'tmux',
    args: ['set-option', '-t', 'test-sess', '@claude_session_id', 'uuid-1']
  });
});

test('TmuxController.getSessionOption returns trimmed option value', async () => {
  const mockExec = (file, args, cb) => {
    assert.deepEqual(args, ['show-options', '-v', '-t', 'test-sess', '@claude_session_id']);
    cb(null, 'uuid-1\n', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const value = await controller.getSessionOption('test-sess', '@claude_session_id');
  assert.equal(value, 'uuid-1');
});

test('TmuxController.getSessionOption returns null when option is unset', async () => {
  const mockExec = (file, args, cb) => {
    cb(new Error('unknown option: @claude_session_id'), '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const value = await controller.getSessionOption('test-sess', '@claude_session_id');
  assert.equal(value, null);
});

test('TmuxController multi-word tmuxPath splits into binary and prefix args', async () => {
  let invoked = null;
  const mockExec = (file, args, cb) => {
    invoked = { file, args };
    cb(null, '', '');
  };
  // Windows/WSL interop: TMUX_PATH="wsl -d Ubuntu tmux".
  const controller = new TmuxController('wsl -d Ubuntu tmux', mockExec);
  await controller.hasSession('my-sess');
  assert.deepEqual(invoked, {
    file: 'wsl',
    args: ['-d', 'Ubuntu', 'tmux', 'has-session', '-t', 'my-sess']
  });
});
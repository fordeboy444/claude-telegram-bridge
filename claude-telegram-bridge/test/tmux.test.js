import test from 'node:test';
import assert from 'node:assert/strict';
import { TmuxController } from '../src/tmux/controller.js';

test('TmuxController.hasSession returns true when session exists', async () => {
  const mockExec = (cmd, cb) => {
    assert.match(cmd, /has-session -t "test-sess"/);
    cb(null, '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const exists = await controller.hasSession('test-sess');
  assert.equal(exists, true);
});

test('TmuxController.hasSession returns false when session does not exist', async () => {
  const mockExec = (cmd, cb) => {
    cb(new Error('session not found'), '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const exists = await controller.hasSession('non-existent');
  assert.equal(exists, false);
});

test('TmuxController.listSessions filters by prefix', async () => {
  const mockExec = (cmd, cb) => {
    cb(null, 'claude-web\nclaude-backend\nrandom-session\n', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const sessions = await controller.listSessions('claude-');
  assert.deepEqual(sessions, ['claude-web', 'claude-backend']);
});

test('TmuxController.listSessions returns all when no prefix provided', async () => {
  const mockExec = (cmd, cb) => {
    cb(null, 'claude-web\nrandom-session\n', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const sessions = await controller.listSessions();
  assert.deepEqual(sessions, ['claude-web', 'random-session']);
});

test('TmuxController.listSessions handles error gracefully by returning empty array', async () => {
  const mockExec = (cmd, cb) => {
    cb(new Error('no server running'), '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const sessions = await controller.listSessions();
  assert.deepEqual(sessions, []);
});

test('TmuxController.newSession executes correct command', async () => {
  let executedCmd = '';
  const mockExec = (cmd, cb) => {
    executedCmd = cmd;
    cb(null, '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  await controller.newSession('my-sess', '/home/user/app', 'npm start');
  assert.equal(executedCmd, 'tmux new-session -d -s "my-sess" -c "/home/user/app" "npm start"');
});

test('TmuxController.killSession executes kill-session and ignores not found errors', async () => {
  let executedCmd = '';
  const mockExec = (cmd, cb) => {
    executedCmd = cmd;
    cb(new Error('session not found'), '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  await assert.doesNotReject(async () => {
    await controller.killSession('test-sess');
  });
  assert.equal(executedCmd, 'tmux kill-session -t "test-sess"');
});

test('TmuxController.sendKeys properly escapes input and sends Enter', async () => {
  let executedCmd = '';
  const mockExec = (cmd, cb) => {
    executedCmd = cmd;
    cb(null, '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  await controller.sendKeys('test-sess', 'echo "hello"', true);
  assert.ok(executedCmd.includes('send-keys -t "test-sess" -l "echo \\"hello\\""'));
  assert.ok(executedCmd.includes('send-keys -t "test-sess" Enter'));
});

test('TmuxController.sendKeys does not send Enter when pressEnter is false', async () => {
  let executedCmd = '';
  const mockExec = (cmd, cb) => {
    executedCmd = cmd;
    cb(null, '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  await controller.sendKeys('test-sess', 'just-text', false);
  assert.ok(executedCmd.includes('send-keys -t "test-sess" -l "just-text"'));
  assert.ok(!executedCmd.includes('Enter'));
});

test('TmuxController.capturePane executes capture-pane and returns stdout', async () => {
  const mockExec = (cmd, cb) => {
    assert.match(cmd, /capture-pane -p -t "test-sess" -S -50/);
    cb(null, 'pane output lines', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const out = await controller.capturePane('test-sess', -50);
  assert.equal(out, 'pane output lines');
});

test('TmuxController.capturePane returns empty string on session not found error', async () => {
  const mockExec = (cmd, cb) => {
    cb(new Error('session not found'), '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const out = await controller.capturePane('missing-sess');
  assert.equal(out, '');
});

test('TmuxController.setSessionOption executes set-option with key and value', async () => {
  let executedCmd = '';
  const mockExec = (cmd, cb) => {
    executedCmd = cmd;
    cb(null, '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  await controller.setSessionOption('test-sess', '@claude_session_id', 'uuid-1');
  assert.equal(executedCmd, 'tmux set-option -t "test-sess" @claude_session_id "uuid-1"');
});

test('TmuxController.getSessionOption returns trimmed option value', async () => {
  const mockExec = (cmd, cb) => {
    assert.match(cmd, /show-options -v -t "test-sess" @claude_session_id/);
    cb(null, 'uuid-1\n', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const value = await controller.getSessionOption('test-sess', '@claude_session_id');
  assert.equal(value, 'uuid-1');
});

test('TmuxController.getSessionOption returns null when option is unset', async () => {
  const mockExec = (cmd, cb) => {
    cb(new Error('unknown option: @claude_session_id'), '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const value = await controller.getSessionOption('test-sess', '@claude_session_id');
  assert.equal(value, null);
});

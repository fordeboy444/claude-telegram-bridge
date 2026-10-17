// Tests for the active-target refactor in src/index.js. The bot holds a target
// record (src/session/target.js) instead of a bare tmux session name, and every
// send goes through the transport-neutral IO layer.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBot } from '../src/index.js';
import { makeBotMock, makeTmuxMock, defaultTestConfig } from './helpers.js';
import { tmuxTarget, orcaTarget } from '../src/session/target.js';

const SESSION = 'claude-Main-Agent';
const PROJECT = '/home/orca/Projects/Main Agent';

// The reader is never started for real here: these tests drive the dispatch
// paths, not the transcript tailer.
class QuietReader {
  start() {}
  stop() {}
}

// A bot wired to a recording tmux controller, so a test can pin the exact
// arguments that reached tmux through the IO layer.
function makeHarness(overrides = {}) {
  const calls = { sendKeys: [], sendKeysWithDelay: [] };
  const bot = makeBotMock();
  const tmux = makeTmuxMock({
    hasSession: async () => true,
    listSessions: async () => [SESSION],
    sendKeys: async (...args) => { calls.sendKeys.push(args); },
    sendKeysWithDelay: async (...args) => { calls.sendKeysWithDelay.push(args); },
    ...overrides
  });
  const api = createBot(defaultTestConfig({ allowedUserIds: ['111'] }), {
    bot,
    tmux,
    sessionReaderClass: QuietReader
  });
  return { bot, tmux, api, calls };
}

test('switchActiveSession accepts a tmux target record', async () => {
  const { api } = makeHarness();

  await api.switchActiveSession(tmuxTarget(SESSION, PROJECT), '111', PROJECT);

  assert.equal(api.getActiveState().target.kind, 'tmux');
  assert.equal(api.getActiveState().target.sessionName, SESSION);
  // The legacy key stays for the callers that still read it.
  assert.equal(api.getActiveState().activeSessionName, SESSION);

  api.stop();
});

test('switchActiveSession still accepts a bare tmux session name', async () => {
  // The exported seam keeps the old string call shape: test/integration.test.js
  // and the startup re-attach both pass a name, not a target record.
  const { api } = makeHarness();

  await api.switchActiveSession(SESSION, '111', PROJECT);

  assert.equal(api.getActiveState().target.kind, 'tmux');
  assert.equal(api.getActiveState().target.sessionName, SESSION);

  api.stop();
});

test('an Orca target leaves the legacy activeSessionName key null', async () => {
  const { api } = makeHarness();
  const target = orcaTarget({
    handle: 'term_a',
    title: '✳ Casual greeting',
    projectPath: PROJECT,
    transcriptFile: null
  });

  await api.switchActiveSession(target, '111', PROJECT);

  assert.equal(api.getActiveState().target.kind, 'orca');
  assert.equal(api.getActiveState().activeSessionName, null);

  api.stop();
});

test('sending text routes through the IO layer', async () => {
  const { bot, api, calls } = makeHarness();
  await api.switchActiveSession(tmuxTarget(SESSION, PROJECT), '111', PROJECT);

  await bot.handlers.on.text({
    chat: { id: '111' },
    message: { text: 'hello' },
    reply: async () => {}
  });

  assert.deepEqual(calls.sendKeys, [[SESSION, 'Telegram user: hello', true]]);

  api.stop();
});

test('/interrupt routes through io.interrupt', async () => {
  const { bot, api, calls } = makeHarness();
  await api.switchActiveSession(tmuxTarget(SESSION, PROJECT), '111', PROJECT);

  await bot.handlers.commands.interrupt({ chat: { id: '111' }, reply: async () => {} });

  assert.deepEqual(calls.sendKeysWithDelay, [[SESSION, ['Escape'], 0]]);

  api.stop();
});

test('a command with no active target answers the not-connected message', async () => {
  const { bot, api, calls } = makeHarness();

  const replies = [];
  await bot.handlers.commands.interrupt({ reply: async (text) => { replies.push(text); } });

  assert.match(replies.join('\n'), /No active Claude session/);
  assert.deepEqual(calls.sendKeysWithDelay, []);

  api.stop();
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createBot } from '../src/index.js';

test('createBot initializes Telegraf instance with middleware, setMyCommands, and handlers', () => {
  let commandsSet = null;
  const mockBot = {
    use: () => {},
    on: () => {},
    action: () => {},
    command: () => {},
    telegram: {
      setMyCommands: async (cmds) => {
        commandsSet = cmds;
      }
    }
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111', '222'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  const { bot, switchActiveSession, getActiveState } = createBot(config, { bot: mockBot });
  assert.ok(bot);
  assert.equal(typeof switchActiveSession, 'function');
  assert.equal(typeof getActiveState, 'function');
  assert.equal(getActiveState().activeSessionName, null);
  assert.ok(Array.isArray(commandsSet));
  assert.equal(commandsSet.length, 4);
  assert.equal(commandsSet[0].command, 'projects');
});

test('answer_q callback query action injects option key/number into tmux via sendKeys', async () => {
  let actionHandler = null;
  let sentKeys = [];
  const mockBot = {
    use: () => {},
    on: () => {},
    command: () => {},
    action: (regex, handler) => {
      if (regex.toString().includes('answer_q')) {
        actionHandler = handler;
      }
    },
    telegram: {
      setMyCommands: async () => {}
    }
  };

  const mockTmux = {
    hasSession: async () => true,
    capturePane: async () => '',
    sendKeys: async (session, keys, enter) => {
      sentKeys.push({ session, keys, enter });
    }
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111', '222'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  const botInstance = createBot(config, { bot: mockBot, tmux: mockTmux });
  const { switchActiveSession } = botInstance;

  // Activate session
  switchActiveSession('claude-test', 12345);

  assert.ok(actionHandler, 'answer_q action handler registered');

  let answered = false;
  let repliedText = null;
  const mockCtx = {
    match: ['answer_q:2', '2'],
    answerCbQuery: async (msg) => { answered = msg; },
    reply: async (text) => { repliedText = text; }
  };

  await actionHandler(mockCtx);

  assert.equal(sentKeys.length, 1);
  assert.equal(sentKeys[0].session, 'claude-test');
  assert.equal(sentKeys[0].keys, '2');
  assert.equal(sentKeys[0].enter, true);
  assert.ok(answered);
  assert.equal(repliedText, 'Selected option 2');

  botInstance.stop();
});

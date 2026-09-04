import test from 'node:test';
import assert from 'node:assert/strict';
import { createBot } from '../src/index.js';

test('createBot initializes Telegraf instance with middleware and handlers', () => {
  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111', '222'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  const { bot, switchActiveSession, getActiveState } = createBot(config);
  assert.ok(bot);
  assert.equal(typeof switchActiveSession, 'function');
  assert.equal(typeof getActiveState, 'function');
  assert.equal(getActiveState().activeSessionName, null);
});

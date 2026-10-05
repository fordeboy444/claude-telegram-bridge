import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

test('loadConfig validates required variables and parses allowedUserIds', () => {
  const fakeEnv = {
    TELEGRAM_BOT_TOKEN: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
    ALLOWED_USER_IDS: '111222333, 444555666',
    PROJECTS_DIR: '/home/user/projects'
  };

  const config = loadConfig(fakeEnv);
  assert.equal(config.botToken, '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11');
  assert.deepEqual(config.allowedUserIds, ['111222333', '444555666']);
  assert.equal(config.projectsDir, '/home/user/projects');
  assert.equal(config.tmuxPath, 'tmux');
  assert.equal(config.pollIntervalMs, 1000);
});

test('loadConfig throws when TELEGRAM_BOT_TOKEN is missing', () => {
  assert.throws(() => loadConfig({ ALLOWED_USER_IDS: '123' }), /TELEGRAM_BOT_TOKEN is required/);
});

test('loadConfig throws when ALLOWED_USER_IDS is missing or empty', () => {
  assert.throws(
    () => loadConfig({ TELEGRAM_BOT_TOKEN: 'fake' }),
    /ALLOWED_USER_IDS is required/
  );
  assert.throws(
    () => loadConfig({ TELEGRAM_BOT_TOKEN: 'fake', ALLOWED_USER_IDS: '   ' }),
    /ALLOWED_USER_IDS is required/
  );
});

test('loadConfig throws when ALLOWED_USER_IDS has no valid IDs after trimming', () => {
  assert.throws(
    () => loadConfig({ TELEGRAM_BOT_TOKEN: 'fake', ALLOWED_USER_IDS: ', ,' }),
    /ALLOWED_USER_IDS must contain at least one user ID/
  );
});

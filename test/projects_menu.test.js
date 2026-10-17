// Tests for the project action card (src/projects/menu.js). The card gains one
// row per Orca agent tab, above the session buttons. The tab record is the one
// `listAgentTabs` produces: { handle, cleanTitle, status }, where status is
// 'working', 'idle' or null.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProjectActionView } from '../src/projects/menu.js';

const PROJECT = {
  name: 'Main Agent',
  path: '/home/orca/Projects/Main Agent',
  runningSessions: []
};

test('buildProjectActionView lists tab rows above the session buttons', () => {
  const view = buildProjectActionView(PROJECT, [
    { handle: 'term_a', cleanTitle: 'Casual greeting', status: 'idle' }
  ]);

  const rows = view.reply_markup.inline_keyboard;

  // The first row is the tab, and its label carries no Markdown mark.
  assert.deepEqual(rows[0], [
    { text: '⚪️ Casual greeting', callback_data: 'orca_tab:term_a' }
  ]);

  // The body labels the tab section, and only here.
  assert.ok(view.text.includes('⌨️ *Terminals:*'));

  // Row order: tab rows, then the session button, then the way back.
  assert.equal(rows.length, 3);
  assert.ok(rows[1][0].text.includes('Start Session'));
  assert.ok(rows[2][0].text.includes('Back to Projects'));
});

test('buildProjectActionView marks a working tab', () => {
  const view = buildProjectActionView(PROJECT, [
    { handle: 'term_b', cleanTitle: 'Fix the parser', status: 'working' }
  ]);

  assert.deepEqual(view.reply_markup.inline_keyboard[0], [
    { text: '🟢 Fix the parser', callback_data: 'orca_tab:term_b' }
  ]);
});

test('buildProjectActionView marks an unknown status', () => {
  const view = buildProjectActionView(PROJECT, [
    { handle: 'term_c', cleanTitle: 'Detached', status: null }
  ]);

  assert.deepEqual(view.reply_markup.inline_keyboard[0], [
    { text: '⚫️ Detached', callback_data: 'orca_tab:term_c' }
  ]);
});

test('the callback data fits the Telegram 64-byte cap', () => {
  // The longest handle Orca issues: "term_" plus a UUID. The skills menu needs
  // a short-hash map for the same limit; a handle fits whole.
  const handle = 'term_145459fc-3e39-48de-ae2f-26d84d609486';
  assert.ok(Buffer.byteLength('orca_tab:' + handle) <= 64);

  const view = buildProjectActionView(PROJECT, [
    { handle, cleanTitle: 'Long handle', status: 'idle' }
  ]);
  assert.equal(view.reply_markup.inline_keyboard[0][0].callback_data, 'orca_tab:' + handle);
});

test('buildProjectActionView with no tabs changes nothing', () => {
  assert.deepEqual(buildProjectActionView(PROJECT), buildProjectActionView(PROJECT, []));

  // No tab section, and no empty section header either.
  assert.ok(!buildProjectActionView(PROJECT).text.includes('⌨️ *Terminals:*'));
});

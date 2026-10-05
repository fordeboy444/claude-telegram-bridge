// claude-telegram-bridge/test/messenger.test.js
// sendWithFallback: markdown-first Telegram sending with plain-text fallback
// and a console warning when delivery fails entirely.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sendWithFallback } from '../src/utils/messenger.js';

function makeBot(sendImpl) {
  return { telegram: { sendMessage: sendImpl } };
}

test('sendWithFallback sends markdown-formatted message when it works', async () => {
  const calls = [];
  const bot = makeBot(async (chatId, text, extra) => {
    calls.push({ chatId, text, extra });
  });

  await sendWithFallback(bot, 42, '*hello*');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].chatId, 42);
  assert.equal(calls[0].extra.parse_mode, 'Markdown');
});

test('sendWithFallback retries as plain text when markdown fails', async () => {
  const calls = [];
  const bot = makeBot(async (chatId, text, extra) => {
    if (extra && extra.parse_mode) throw new Error('bad markdown');
    calls.push({ chatId, text });
  });

  await sendWithFallback(bot, 42, '*hello*', { reply_markup: { inline_keyboard: [] } });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].text, '*hello*');
});

test('sendWithFallback forwards extra options (inline keyboards) on success', async () => {
  const markup = { inline_keyboard: [[{ text: 'hi', callback_data: 'x' }]] };
  const calls = [];
  const bot = makeBot(async (chatId, text, extra) => {
    calls.push({ extra });
  });

  await sendWithFallback(bot, 42, 'hello', { reply_markup: markup });

  assert.equal(calls[0].extra.reply_markup, markup);
});

test('sendWithFallback warns instead of throwing when both attempts fail', async (t) => {
  const warn = t.mock.method(console, 'warn');
  const bot = makeBot(async () => {
    throw new Error('network down');
  });

  await sendWithFallback(bot, 42, 'hello');

  assert.equal(warn.mock.callCount(), 1);
  assert.match(String(warn.mock.calls[0].arguments.join(' ')), /Telegram send failed/);
  assert.match(String(warn.mock.calls[0].arguments.join(' ')), /network down/);
});
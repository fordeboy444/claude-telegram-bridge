import test from 'node:test';
import assert from 'node:assert/strict';
import { splitTelegramMessage } from '../src/utils/telegram_chunker.js';

test('splitTelegramMessage returns empty array for empty input', () => {
  assert.deepEqual(splitTelegramMessage(''), []);
  assert.deepEqual(splitTelegramMessage(null), []);
  assert.deepEqual(splitTelegramMessage(undefined), []);
});

test('splitTelegramMessage returns single chunk if below limit', () => {
  const short = 'Short output line';
  const chunks = splitTelegramMessage(short, 100);
  assert.deepEqual(chunks, ['Short output line']);
});

test('splitTelegramMessage splits text across line breaks when over limit', () => {
  const longText = 'Line A\nLine B\nLine C\nLine D';
  const chunks = splitTelegramMessage(longText, 14);
  assert.ok(chunks.length > 1);
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 14);
  }
  assert.equal(chunks.join('\n'), longText);
});

test('splitTelegramMessage handles single long line without newline', () => {
  const line = 'A'.repeat(50);
  const chunks = splitTelegramMessage(line, 20);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, 20);
  assert.equal(chunks[1].length, 20);
  assert.equal(chunks[2].length, 10);
});

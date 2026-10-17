import test from 'node:test';
import assert from 'node:assert/strict';
import { ORCA_KEY_BYTES, keyToBytes } from '../src/orca/keys.js';

test('keyToBytes maps every name buildAnswerKeys produces', () => {
  assert.ok(keyToBytes('Down'));
  assert.ok(keyToBytes('Space'));
  assert.ok(keyToBytes('Right'));
  assert.ok(keyToBytes('Enter'));
});

test('keyToBytes maps a single digit to itself', () => {
  assert.equal(keyToBytes('1'), '1');
  assert.equal(keyToBytes('9'), '9');
});

test('keyToBytes returns null for an unknown name', () => {
  assert.equal(keyToBytes('F13'), null);
});

test('the byte values match the spec table', () => {
  assert.equal(keyToBytes('Enter'), '\r');
  assert.equal(keyToBytes('Escape'), '\x1B');
  assert.equal(keyToBytes('Right'), '\x1B[C');
  assert.equal(keyToBytes('Down'), '\x1B[B');
  assert.equal(keyToBytes('Space'), ' ');
});

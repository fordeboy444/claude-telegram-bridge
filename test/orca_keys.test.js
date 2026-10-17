import test from 'node:test';
import assert from 'node:assert/strict';
import { keyToBytes } from '../src/orca/keys.js';

test('keyToBytes maps every name buildAnswerKeys produces', () => {
  assert.equal(keyToBytes('Down'), '\x1B[B');
  assert.equal(keyToBytes('Space'), ' ');
  assert.equal(keyToBytes('Right'), '\x1B[C');
  assert.equal(keyToBytes('Enter'), '\r');
  assert.equal(keyToBytes('Escape'), '\x1B');
});

test('keyToBytes maps a single digit to itself', () => {
  assert.equal(keyToBytes('1'), '1');
  assert.equal(keyToBytes('9'), '9');
});

test('keyToBytes returns null for an unknown name', () => {
  assert.equal(keyToBytes('F13'), null);
  assert.equal(keyToBytes('toString'), null);      // own-property guard
  assert.equal(keyToBytes('constructor'), null);   // own-property guard
  assert.equal(keyToBytes(1), null);               // type guard
  assert.equal(keyToBytes('0'), null);
  assert.equal(keyToBytes('10'), null);
  assert.equal(keyToBytes(''), null);
  assert.equal(keyToBytes(undefined), null);
});

test('the byte values match the spec table', () => {
  assert.equal(keyToBytes('Enter'), '\r');
  assert.equal(keyToBytes('Escape'), '\x1B');
  assert.equal(keyToBytes('Right'), '\x1B[C');
  assert.equal(keyToBytes('Down'), '\x1B[B');
  assert.equal(keyToBytes('Space'), ' ');
});

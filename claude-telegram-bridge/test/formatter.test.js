import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanAnsi, formatTerminalOutput, cleanTerminalOutput } from '../src/tmux/formatter.js';

test('cleanAnsi strips color and cursor control sequences', () => {
  const ansiText = '[31mError:[0m [1mSomething went wrong[22m\r\n';
  const clean = cleanAnsi(ansiText);
  assert.equal(clean, 'Error: Something went wrong\n');
});

test('cleanAnsi normalizes carriage returns and trailing whitespace', () => {
  const messy = 'Line 1\r\nLine 2  \r\n';
  assert.equal(cleanAnsi(messy), 'Line 1\nLine 2\n');
});

test('cleanAnsi handles empty and undefined input gracefully', () => {
  assert.equal(cleanAnsi(''), '');
  assert.equal(cleanAnsi(null), '');
  assert.equal(cleanAnsi(undefined), '');
});

test('formatTerminalOutput trims empty leading/trailing blank lines', () => {
  const output = '\n\n   Hello Claude   \n\n';
  assert.equal(formatTerminalOutput(output), 'Hello Claude');
});

test('cleanTerminalOutput strips terminal chrome, banners, boxes, and prompts', () => {
  const rawTerminal = `
  Claude Code v0.2.14
  ───────────────────────────────────────
  Some normal output line 1
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ? for help · Ctrl+C to exit · Ctrl+D to stop
  ❯ describe a task or ask a question...
  Normal response code block:
  \`\`\`js
  console.log("hello");
  \`\`\`
  `;
  const cleaned = cleanTerminalOutput(rawTerminal);
  assert.equal(cleaned.includes('Claude Code'), false);
  assert.equal(cleaned.includes('───────────────────────────────────────'), false);
  assert.equal(cleaned.includes('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'), false);
  assert.equal(cleaned.includes('? for help'), false);
  assert.equal(cleaned.includes('❯ describe a task'), false);
  assert.equal(cleaned.includes('Some normal output line 1'), true);
  assert.equal(cleaned.includes('console.log("hello");'), true);
});


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

test('cleanTerminalOutput strips model status lines and task list widgets', () => {
  const terminalWithWidgets = `
  GLM 5.3 Flash · ~\\Documents\\claude-code-projects\\Main Agent
  1 awaiting input · 1 working · 4 completed

  Needs input
  * claude telegram bridge       What would you like to work on next?       1h

  Working
  * Tell me a...                 Tell me a joke about a cow                 0s

  Completed
  • joke delivery test           Joke delivered.                            3s
  • inspect-analyze-video        CLAUDE.md updated with new workflow...     12m

  Why did the cow cross the road? To get to the udder side!
  `;
  const cleaned = cleanTerminalOutput(terminalWithWidgets);
  assert.equal(cleaned.includes('GLM 5.3 Flash'), false);
  assert.equal(cleaned.includes('1 awaiting input'), false);
  assert.equal(cleaned.includes('Needs input'), false);
  assert.equal(cleaned.includes('claude telegram bridge'), false);
  assert.equal(cleaned.includes('Completed'), false);
  assert.equal(cleaned.includes('joke delivery test'), false);
  assert.equal(cleaned.includes('Why did the cow cross the road?'), true);
});


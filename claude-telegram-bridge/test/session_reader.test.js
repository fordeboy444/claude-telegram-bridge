import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { getProjectSlug, ClaudeSessionReader } from '../src/tmux/session_reader.js';

test('getProjectSlug formats path into Claude project slug', () => {
  // Test Windows style path
  const winPath = 'C:\\Users\\taro8\\Projects\\my-project';
  const winSlug = getProjectSlug(winPath);
  assert.equal(winSlug, 'C---Users-taro8-Projects-my-project');

  // Test POSIX style path or absolute path
  const posixPath = path.win32 ? 'C:\\home\\user\\projects\\my-project' : '/home/user/projects/my-project';
  const posixSlug = getProjectSlug(posixPath);
  assert.equal(posixSlug, 'C---home-user-projects-my-project');
});

test('ClaudeSessionReader handles missing session files gracefully', async () => {
  const reader = new ClaudeSessionReader({ claudeHome: await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-')) });
  const events = await reader.readNewEvents('/nonexistent/project');
  assert.deepEqual(events, []);
});

test('ClaudeSessionReader extracts assistant text and AskUserQuestion calls', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-session-'));
  const projectPath = path.resolve(tmpDir, 'test-project');
  const slug = getProjectSlug(projectPath);

  const projectsDir = path.join(tmpDir, '.claude', 'projects', slug);
  await fs.mkdir(projectsDir, { recursive: true });

  const sessionFile = path.join(projectsDir, 'session-123.jsonl');

  const lines = [
    JSON.stringify({ type: 'user', message: { content: 'Hello' } }),
    JSON.stringify({
      type: 'assistant',
      message: {
        content: [
          { type: 'text', text: 'Here is the response.' },
          { type: 'tool_use', name: 'AskUserQuestion', input: { question: 'Choose option:', options: ['A', 'B'] } }
        ]
      }
    }),
    JSON.stringify({
      type: 'assistant',
      message: {
        content: [
          { type: 'text', text: 'Another text.' }
        ]
      }
    })
  ];

  await fs.writeFile(sessionFile, lines.join('\n') + '\n');

  const reader = new ClaudeSessionReader({ claudeHome: path.join(tmpDir, '.claude') });
  const events = await reader.readNewEvents(projectPath);

  assert.equal(events.length, 3);
  assert.equal(events[0].type, 'text');
  assert.equal(events[0].content, 'Here is the response.');

  assert.equal(events[1].type, 'question');
  assert.deepEqual(events[1].content, {
    question: 'Choose option:',
    options: ['A', 'B']
  });

  assert.equal(events[2].type, 'text');
  assert.equal(events[2].content, 'Another text.');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { getProjectSlug, ClaudeSessionReader } from '../src/tmux/session_reader.js';

test('getProjectSlug formats path into Claude project slug', () => {
  // Test Windows style path: drive colon -> '-', each separator -> '-'
  // e.g. C:\Users\taro8\... -> C--Users-taro8-... (two dashes after drive letter)
  const winPath = 'C:\\Users\\taro8\\Projects\\my-project';
  const winSlug = getProjectSlug(winPath);
  assert.equal(winSlug, 'C--Users-taro8-Projects-my-project');

  // Test POSIX style path or absolute path
  const posixPath = path.win32 ? 'C:\\home\\user\\projects\\my-project' : '/home/user/projects/my-project';
  const posixSlug = getProjectSlug(posixPath);
  assert.equal(posixSlug, 'C--home-user-projects-my-project');
});

test('getProjectSlug converts spaces to dashes to match Claude transcript dirs', async () => {
  // Real-world reproduction: project folder "Main Agent" is launched via tmux
  // with cwd "...\Main Agent". Claude CLI converts the space to a dash when it
  // writes its transcript dir (~/.claude/projects/C--...-Main-Agent), so the
  // reader's slug must match or no responses ever surface.
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-space-'));
  const projectPath = path.resolve(tmpDir, 'Main Agent');

  // Claude CLI's own slug encodes spaces as dashes
  const claudeSlug = getProjectSlug(projectPath);
  assert.ok(claudeSlug.endsWith('-Main-Agent'));

  const projectsDir = path.join(tmpDir, '.claude', 'projects', claudeSlug);
  await fs.mkdir(projectsDir, { recursive: true });
  const sessionFile = path.join(projectsDir, 'session-space.jsonl');
  await fs.writeFile(sessionFile, JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'text', text: 'Space slug response.' }] }
  }) + '\n');

  const reader = new ClaudeSessionReader({ claudeHome: path.join(tmpDir, '.claude') });
  const events = await reader.readNewEvents(projectPath);

  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'text');
  assert.equal(events[0].content, 'Space slug response.');
});

test('ClaudeSessionReader resolves slug directories case-insensitively', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-case-'));
  const projectPath = path.resolve(tmpDir, 'test-project-case');
  const slug = getProjectSlug(projectPath);

  // Claude may write the slug with a different drive-letter case than we compute
  const variantSlug = slug[0] === slug[0].toLowerCase() ? slug[0].toUpperCase() + slug.slice(1) : slug[0].toLowerCase() + slug.slice(1);
  const projectsDir = path.join(tmpDir, '.claude', 'projects', variantSlug);
  await fs.mkdir(projectsDir, { recursive: true });

  const sessionFile = path.join(projectsDir, 'session-case.jsonl');
  await fs.writeFile(sessionFile, JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'text', text: 'Case variant response.' }] }
  }) + '\n');

  const reader = new ClaudeSessionReader({ claudeHome: path.join(tmpDir, '.claude') });
  const events = await reader.readNewEvents(projectPath);

  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'text');
  assert.equal(events[0].content, 'Case variant response.');
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

  assert.equal(events.length, 4);
  assert.equal(events[0].type, 'user');
  assert.equal(events[0].content, 'Hello');

  assert.equal(events[1].type, 'text');
  assert.equal(events[1].content, 'Here is the response.');

  assert.equal(events[2].type, 'question');
  assert.deepEqual(events[2].content, {
    question: 'Choose option:',
    options: ['A', 'B']
  });

  assert.equal(events[3].type, 'text');
  assert.equal(events[3].content, 'Another text.');
});

test('ClaudeSessionReader.start polls and streams events continuously', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-start-'));
  const projectPath = path.resolve(tmpDir, 'test-project-stream');
  const slug = getProjectSlug(projectPath);

  const projectsDir = path.join(tmpDir, '.claude', 'projects', slug);
  await fs.mkdir(projectsDir, { recursive: true });

  const sessionFile = path.join(projectsDir, 'session-abc.jsonl');

  const reader = new ClaudeSessionReader({ claudeHome: path.join(tmpDir, '.claude') });
  const receivedEvents = [];

  reader.start(projectPath, (ev) => {
    receivedEvents.push(ev);
  }, 50);

  // Write new event after start
  await new Promise(r => setTimeout(r, 80));
  const newLines = [
    JSON.stringify({
      type: 'assistant',
      message: {
        content: [{ type: 'text', text: 'Streaming assistant line.' }]
      }
    })
  ];
  await fs.writeFile(sessionFile, newLines.join('\n') + '\n');

  // Wait for poll
  await new Promise(r => setTimeout(r, 150));
  reader.stop();

  assert.ok(receivedEvents.length >= 1);
  assert.equal(receivedEvents[0].type, 'text');
  assert.equal(receivedEvents[0].content, 'Streaming assistant line.');
});

test('ClaudeSessionReader follows the bound sessionId file, not the newest transcript', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-bound-'));
  const projectPath = path.resolve(tmpDir, 'test-project-bound');
  const slug = getProjectSlug(projectPath);
  const projectsDir = path.join(tmpDir, '.claude', 'projects', slug);
  await fs.mkdir(projectsDir, { recursive: true });

  const boundId = '11111111-2222-3333-4444-555555555555';
  const boundFile = path.join(projectsDir, `${boundId}.jsonl`);
  const otherFile = path.join(projectsDir, '99999999-9999-9999-9999-999999999999.jsonl');

  const line = (text) => JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'text', text }] }
  }) + '\n';

  await fs.writeFile(boundFile, line('Bound session reply.'));
  await fs.writeFile(otherFile, line('Other session reply.'));

  // Force the other file to be the newest by mtime
  const now = Date.now();
  await fs.utimes(otherFile, now / 1000 + 10, now / 1000 + 10);

  const reader = new ClaudeSessionReader({ claudeHome: path.join(tmpDir, '.claude'), sessionId: boundId });
  const events = await reader.readNewEvents(projectPath);

  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'text');
  assert.equal(events[0].content, 'Bound session reply.');
});

test('ClaudeSessionReader with a bound sessionId waits for the transcript file to appear', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-wait-'));
  const projectPath = path.resolve(tmpDir, 'test-project-wait');
  const slug = getProjectSlug(projectPath);
  const projectsDir = path.join(tmpDir, '.claude', 'projects', slug);
  await fs.mkdir(projectsDir, { recursive: true });

  const boundId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const boundFile = path.join(projectsDir, `${boundId}.jsonl`);

  const reader = new ClaudeSessionReader({ claudeHome: path.join(tmpDir, '.claude'), sessionId: boundId });

  // File does not exist yet: no events, no crash
  assert.deepEqual(await reader.readNewEvents(projectPath), []);

  // Claude creates the file on first write: the first turn must arrive in full
  await fs.writeFile(boundFile, [
    JSON.stringify({ type: 'user', message: { content: 'First prompt' } }),
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'First reply.' }] } })
  ].join('\n') + '\n');

  const events = await reader.readNewEvents(projectPath);
  assert.equal(events.length, 2);
  assert.equal(events[0].type, 'user');
  assert.equal(events[0].content, 'First prompt');
  assert.equal(events[1].type, 'text');
  assert.equal(events[1].content, 'First reply.');
});

test('ClaudeSessionReader emits result events at the end of each turn', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-result-'));
  const projectPath = path.resolve(tmpDir, 'test-project-result');
  const slug = getProjectSlug(projectPath);
  const projectsDir = path.join(tmpDir, '.claude', 'projects', slug);
  await fs.mkdir(projectsDir, { recursive: true });

  await fs.writeFile(path.join(projectsDir, 'session-result.jsonl'), [
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'Reply.' }] } }),
    JSON.stringify({ type: 'result', subtype: 'success' }),
    JSON.stringify({ type: 'result' })
  ].join('\n') + '\n');

  const reader = new ClaudeSessionReader({ claudeHome: path.join(tmpDir, '.claude') });
  const events = await reader.readNewEvents(projectPath);

  assert.equal(events.length, 3);
  assert.equal(events[1].type, 'result');
  assert.equal(events[1].subtype, 'success');
  assert.equal(events[2].type, 'result');
  assert.equal(events[2].subtype, null);
});

test('ClaudeSessionReader.start with a sessionId polls the bound file and ignores a newer transcript', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-poll-bound-'));
  const projectPath = path.resolve(tmpDir, 'test-project-poll');
  const slug = getProjectSlug(projectPath);
  const projectsDir = path.join(tmpDir, '.claude', 'projects', slug);
  await fs.mkdir(projectsDir, { recursive: true });

  const boundId = 'fedcba98-7654-3210-fedc-ba9876543210';
  const boundFile = path.join(projectsDir, `${boundId}.jsonl`);
  const otherFile = path.join(projectsDir, '01234567-89ab-cdef-0123-456789abcdef.jsonl');

  const reader = new ClaudeSessionReader({ claudeHome: path.join(tmpDir, '.claude') });
  const receivedEvents = [];

  reader.start(projectPath, (ev) => {
    receivedEvents.push(ev);
  }, 50, { sessionId: boundId });

  // After start: write both the bound file and a newer-mtime other transcript
  await new Promise(r => setTimeout(r, 80));
  const line = (text) => JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'text', text }] }
  }) + '\n';
  await fs.writeFile(boundFile, line('Bound polling reply.'));
  await fs.writeFile(otherFile, line('Other session noise.'));
  const now = Date.now();
  await fs.utimes(otherFile, now / 1000 + 10, now / 1000 + 10);

  // Wait for polls
  await new Promise(r => setTimeout(r, 150));
  reader.stop();

  assert.equal(receivedEvents.length, 1);
  assert.equal(receivedEvents[0].type, 'text');
  assert.equal(receivedEvents[0].content, 'Bound polling reply.');
});

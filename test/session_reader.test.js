import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { getProjectSlug, ClaudeSessionReader } from '../src/tmux/session_reader.js';

test('getProjectSlug formats Windows style paths into Claude project slugs', () => {
  // Windows style path: drive colon -> '-', each separator -> '-'
  // e.g. C:\Users\taro8\... -> C--Users-taro8-... (two dashes after drive letter)
  if (process.platform !== 'win32') return; // path.resolve maps the drive only on Windows
  assert.equal(
    getProjectSlug(path.win32.resolve('C:\\Users\\taro8\\Projects\\my-project')),
    'C--Users-taro8-Projects-my-project'
  );
});

test('getProjectSlug formats POSIX style paths into Claude project slugs', () => {
  // POSIX style path: no drive letter, leading separator -> '-'
  // e.g. /home/user/projects/my-project -> -home-user-projects-my-project
  if (process.platform === 'win32') return; // path.resolve anchors rootless paths to the cwd drive
  assert.equal(
    getProjectSlug(path.posix.resolve('/home/user/projects/my-project')),
    '-home-user-projects-my-project'
  );
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

test('ClaudeSessionReader re-binds to the new session id after /clear', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-hop-'));
  const projectPath = path.resolve(tmpDir, 'test-project-hop');
  const slug = getProjectSlug(projectPath);
  const projectsDir = path.join(tmpDir, '.claude', 'projects', slug);
  await fs.mkdir(projectsDir, { recursive: true });

  const oldId = '11111111-1111-1111-1111-111111111111';
  const newId = '22222222-2222-2222-2222-222222222222';
  const oldFile = path.join(projectsDir, `${oldId}.jsonl`);
  const newFile = path.join(projectsDir, `${newId}.jsonl`);

  const line = (text) => JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'text', text }] }
  }) + '\n';

  await fs.writeFile(oldFile, line('Before the hop.'));

  const reader = new ClaudeSessionReader({ claudeHome: path.join(tmpDir, '.claude'), sessionId: oldId });
  const received = [];
  let hopReady = false;
  reader.start(projectPath, (ev) => received.push(ev), 20, {
    getBoundSessionId: async () => (hopReady ? newId : oldId)
  });

  // The old binding streams first
  await new Promise(r => setTimeout(r, 120));
  await fs.appendFile(oldFile, line('Old session reply.'));
  await new Promise(r => setTimeout(r, 120));
  assert.ok(received.some(e => e.content === 'Old session reply.'), 'old binding streams');

  // /clear: the new transcript already has content, then the hook publishes the new id
  await fs.writeFile(newFile, line('Pre-hop leftover line.'));
  hopReady = true;

  // Re-bind runs on every 5th tick (100ms here). The pre-hop lines must be
  // adopted at the current file size, not replayed.
  await new Promise(r => setTimeout(r, 300));
  assert.equal(reader.sessionId, newId, 'reader re-bound to the new session id');
  assert.ok(!received.some(e => e.content === 'Pre-hop leftover line.'), 'no replay of pre-hop lines');

  // Streaming continues on the new file
  await fs.appendFile(newFile, line('Post-hop reply.'));
  await new Promise(r => setTimeout(r, 200));
  reader.stop();
  assert.ok(received.some(e => e.content === 'Post-hop reply.'), 'streaming resumed on the new transcript');
});

test('ClaudeSessionReader uses a pinned sessionFile and never re-resolves it', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-pin-'));
  const projectPath = path.resolve(tmpDir, 'test-project-pin');
  const slug = getProjectSlug(projectPath);
  const projectsDir = path.join(tmpDir, '.claude', 'projects', slug);
  await fs.mkdir(projectsDir, { recursive: true });

  const line = (text) => JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'text', text }] }
  }) + '\n';

  // The joined tab owns this transcript; it exists and is empty at join time.
  const pinnedFile = path.join(projectsDir, 'joined-tab.jsonl');
  await fs.writeFile(pinnedFile, '');

  const reader = new ClaudeSessionReader({ claudeHome: path.join(tmpDir, '.claude') });
  const received = [];
  reader.start(projectPath, (ev) => received.push(ev), 10, { sessionFile: pinnedFile });

  // Run at least 10 ticks, then a NEWER transcript appears in the same dir.
  await new Promise(r => setTimeout(r, 150));
  const otherFile = path.join(projectsDir, 'other-tab.jsonl');
  await fs.writeFile(otherFile, line('Other tab reply.'));
  const now = Date.now();
  await fs.utimes(otherFile, now / 1000 + 10, now / 1000 + 10);
  await new Promise(r => setTimeout(r, 150));

  await fs.appendFile(pinnedFile, line('Pinned tab reply.'));
  await new Promise(r => setTimeout(r, 150));
  reader.stop();

  assert.equal(reader.sessionFile, pinnedFile, 'the pin never drifts to the newer file');
  assert.ok(received.some(e => e.content === 'Pinned tab reply.'), 'the pinned file still streams');
  assert.ok(!received.some(e => e.content === 'Other tab reply.'), 'the newer transcript is not read');
});

test('ClaudeSessionReader keeps a null pin and never falls through to newest-file mode', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-pin-null-'));
  const projectPath = path.resolve(tmpDir, 'test-project-pin-null');
  const slug = getProjectSlug(projectPath);
  const projectsDir = path.join(tmpDir, '.claude', 'projects', slug);
  await fs.mkdir(projectsDir, { recursive: true });

  const line = (text) => JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'text', text }] }
  }) + '\n';

  const reader = new ClaudeSessionReader({ claudeHome: path.join(tmpDir, '.claude') });
  const received = [];
  let target = null; // the joined tab has not written its transcript yet
  reader.start(projectPath, (ev) => received.push(ev), 10, {
    sessionFile: null,
    getSessionFile: () => target
  });

  // Other tabs keep writing in the same project dir.
  const otherFile = path.join(projectsDir, 'other-tab.jsonl');
  await fs.writeFile(otherFile, line('Another tab reply.'));
  const now = Date.now();
  await fs.utimes(otherFile, now / 1000 + 10, now / 1000 + 10);
  await new Promise(r => setTimeout(r, 150));

  assert.equal(reader.sessionFile, null, 'a null pin stays null');
  assert.equal(received.length, 0, 'another tab transcript is never read');

  // The joined tab writes at last: the re-pin tick adopts it at current size.
  const joinedFile = path.join(projectsDir, 'joined-tab.jsonl');
  await fs.writeFile(joinedFile, line('Written before the re-pin.'));
  target = joinedFile;
  await new Promise(r => setTimeout(r, 200));
  assert.equal(reader.sessionFile, joinedFile, 'the pin is adopted once it appears');
  assert.ok(!received.some(e => e.content === 'Written before the re-pin.'), 'no replay of the adopted file');

  await fs.appendFile(joinedFile, line('Turn after the re-pin.'));
  await new Promise(r => setTimeout(r, 150));
  reader.stop();

  assert.ok(received.some(e => e.content === 'Turn after the re-pin.'), 'streaming follows the adopted pin');
});

test('ClaudeSessionReader seeks to the end of a pinned file and does not replay', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-pin-end-'));
  const projectPath = path.resolve(tmpDir, 'test-project-pin-end');
  const slug = getProjectSlug(projectPath);
  const projectsDir = path.join(tmpDir, '.claude', 'projects', slug);
  await fs.mkdir(projectsDir, { recursive: true });

  const line = (text) => JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'text', text }] }
  }) + '\n';

  const pinnedFile = path.join(projectsDir, 'joined-tab.jsonl');
  // History written before the join must never be replayed.
  await fs.writeFile(pinnedFile, line('Old turn 1.') + line('Old turn 2.') + line('Old turn 3.'));

  const reader = new ClaudeSessionReader({ claudeHome: path.join(tmpDir, '.claude') });
  const received = [];
  reader.start(projectPath, (ev) => received.push(ev), 10, { sessionFile: pinnedFile });

  // Three or more polls: still nothing.
  await new Promise(r => setTimeout(r, 120));
  assert.equal(received.length, 0, 'pre-existing records are not replayed');

  // New lines from the pinned file do arrive.
  await fs.appendFile(pinnedFile, line('New turn.'));
  await new Promise(r => setTimeout(r, 120));
  reader.stop();

  assert.equal(received.length, 1);
  assert.equal(received[0].content, 'New turn.');
});

test('ClaudeSessionReader re-pins to a new file and adopts it at its current size', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-repin-'));
  const projectPath = path.resolve(tmpDir, 'test-project-repin');
  const slug = getProjectSlug(projectPath);
  const projectsDir = path.join(tmpDir, '.claude', 'projects', slug);
  await fs.mkdir(projectsDir, { recursive: true });

  const line = (text) => JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'text', text }] }
  }) + '\n';

  const fileA = path.join(projectsDir, 'tab-a.jsonl');
  const fileB = path.join(projectsDir, 'tab-b.jsonl');
  await fs.writeFile(fileA, '');

  const reader = new ClaudeSessionReader({ claudeHome: path.join(tmpDir, '.claude') });
  const received = [];
  let target = fileA;
  reader.start(projectPath, (ev) => received.push(ev), 10, { getSessionFile: () => target });

  await new Promise(r => setTimeout(r, 80));
  assert.equal(reader.sessionFile, fileA, 'the callback pin is adopted');

  // The target record names another tab whose transcript already has content.
  await fs.writeFile(fileB, line('Tab B old turn 1.') + line('Tab B old turn 2.'));
  target = fileB;

  // The re-pin runs on every 5th tick (50ms here).
  await new Promise(r => setTimeout(r, 250));
  assert.equal(reader.sessionFile, fileB, 'the reader re-pinned to the new file');
  assert.ok(!received.some(e => e.content === 'Tab B old turn 1.'), 'no replay of tab B history');
  assert.ok(!received.some(e => e.content === 'Tab B old turn 2.'), 'no replay of tab B history');

  await fs.appendFile(fileB, line('Tab B new turn.'));
  await new Promise(r => setTimeout(r, 120));
  reader.stop();

  assert.ok(received.some(e => e.content === 'Tab B new turn.'), 'streaming follows the re-pin');
});

test('ClaudeSessionReader still works with no sessionFile at all', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-nopin-'));
  const projectPath = path.resolve(tmpDir, 'test-project-nopin');
  const slug = getProjectSlug(projectPath);
  const projectsDir = path.join(tmpDir, '.claude', 'projects', slug);
  await fs.mkdir(projectsDir, { recursive: true });

  const line = (text) => JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'text', text }] }
  }) + '\n';

  const firstFile = path.join(projectsDir, 'session-first.jsonl');
  await fs.writeFile(firstFile, line('First transcript turn.'));

  const reader = new ClaudeSessionReader({ claudeHome: path.join(tmpDir, '.claude') });
  const received = [];
  reader.start(projectPath, (ev) => received.push(ev), 10);

  // No pin: the newest transcript in the directory is still followed.
  await new Promise(r => setTimeout(r, 120));
  const newerFile = path.join(projectsDir, 'session-newest.jsonl');
  await fs.writeFile(newerFile, line('Newest transcript turn.'));
  const now = Date.now();
  await fs.utimes(newerFile, now / 1000 + 10, now / 1000 + 10);

  await new Promise(r => setTimeout(r, 150));
  reader.stop();

  assert.ok(received.some(e => e.content === 'Newest transcript turn.'), 'newest-file mode is unchanged');
});

test('ClaudeSessionReader keeps the current binding when getBoundSessionId fails', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-hopfail-'));
  const projectPath = path.resolve(tmpDir, 'test-project-hopfail');
  const slug = getProjectSlug(projectPath);
  const projectsDir = path.join(tmpDir, '.claude', 'projects', slug);
  await fs.mkdir(projectsDir, { recursive: true });

  const oldId = '33333333-3333-3333-3333-333333333333';
  const oldFile = path.join(projectsDir, `${oldId}.jsonl`);

  const line = (text) => JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'text', text }] }
  }) + '\n';
  await fs.writeFile(oldFile, line('Initial line.'));

  const reader = new ClaudeSessionReader({ claudeHome: path.join(tmpDir, '.claude'), sessionId: oldId });
  const received = [];
  reader.start(projectPath, (ev) => received.push(ev), 20, {
    getBoundSessionId: async () => { throw new Error('tmux went away'); }
  });

  // Several bind-check ticks fail; the binding must survive them
  await new Promise(r => setTimeout(r, 300));
  await fs.appendFile(oldFile, line('Still the old session.'));
  await new Promise(r => setTimeout(r, 120));
  reader.stop();

  assert.equal(reader.sessionId, oldId, 'binding unchanged after read failures');
  assert.ok(received.some(e => e.content === 'Still the old session.'));
});

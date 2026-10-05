import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  gatherSessionStatus,
  formatStatusMessage,
  formatCompactNumber,
  formatDuration,
  sanitizeLabel,
  RUNNING_WINDOW_MS
} from '../src/status_report.js';
import { getProjectSlug } from '../src/tmux/session_reader.js';

// Fixture builder: a project dir under a temp claudeHome with a main
// transcript and a subagents/ dir containing hand-written records.
// Returns paths plus a utimes helper so tests can set exact mtimes.
async function makeFixture({ sessionId = 'sess-111' } = {}) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'status-test-'));
  const projectPath = path.resolve(tmpDir, 'proj');
  const slug = getProjectSlug(projectPath);
  const projectDir = path.join(tmpDir, '.claude', 'projects', slug);
  const subagentsDir = path.join(projectDir, sessionId, 'subagents');
  await fs.mkdir(subagentsDir, { recursive: true });
  const transcriptPath = path.join(projectDir, `${sessionId}.jsonl`);
  return {
    tmpDir,
    projectPath,
    projectDir,
    subagentsDir,
    transcriptPath,
    sessionId,
    writeTranscript: (records) => fs.writeFile(transcriptPath, records.map(r => JSON.stringify(r)).join('\n') + '\n'),
    writeAgent: (id, records) => fs.writeFile(path.join(subagentsDir, `agent-${id}.jsonl`), records.map(r => JSON.stringify(r)).join('\n') + '\n'),
    writeMeta: (id, meta, { missing = false } = {}) => {
      if (missing) return fs.rm(path.join(subagentsDir, `agent-${id}.meta.json`), { force: true });
      return fs.writeFile(path.join(subagentsDir, `agent-${id}.meta.json`), JSON.stringify(meta));
    },
    setMtimes: async (mappings) => {
      const base = 1_700_000_000_000;
      for (const [absPath, offsetMs] of mappings) {
        const s = (base + offsetMs) / 1000;
        await fs.utimes(absPath, s, s);
      }
      return base;
    }
  };
}

test('gatherSessionStatus separates fresh running agents from stale finished ones', async () => {
  const fx = await makeFixture();
  await fx.writeTranscript([
    { type: 'user', timestamp: '2026-10-05T10:00:00Z' },
    { type: 'assistant', timestamp: '2026-10-05T10:02:00Z', message: { model: 'glm-5.3:cloud', usage: { input_tokens: 10, output_tokens: 5 } } }
  ]);

  // agent-a: fresh with usage; agent-b: fresh without meta; agent-stale: old mtime
  await fx.writeAgent('a', [
    { type: 'user', timestamp: '2026-10-05T11:00:00Z', isSidechain: true },
    { type: 'assistant', timestamp: '2026-10-05T11:02:00Z', isSidechain: true, message: { model: 'haiku', usage: { input_tokens: 45000, output_tokens: 3000, cache_read_input_tokens: 999999, cache_creation_input_tokens: 999999 } } },
    { type: 'assistant', timestamp: '2026-10-05T11:03:00Z', isSidechain: true, message: { model: 'haiku', usage: { input_tokens: 200, output_tokens: 100 } } }
  ]);
  await fx.writeMeta('a', { agentType: 'general-purpose', description: 'Fix failing tests' });
  await fx.writeAgent('b', [
    { type: 'assistant', timestamp: '2026-10-05T11:10:00Z', isSidechain: true, message: { model: 'gemma4:31b', usage: { input_tokens: 8000, output_tokens: 1200 } } }
  ]);
  await fx.writeAgent('stale', [
    { type: 'assistant', timestamp: '2026-10-05T09:00:00Z', isSidechain: true, message: { model: 'haiku', usage: { input_tokens: 500, output_tokens: 500 } } }
  ]);

  const now = 1_700_000_000_000;
  await fx.setMtimes([
    [fx.transcriptPath, -3 * 60_000],
    [path.join(fx.subagentsDir, 'agent-a.jsonl'), 20_000],
    [path.join(fx.subagentsDir, 'agent-b.jsonl'), 30_000],
    [path.join(fx.subagentsDir, 'agent-stale.jsonl'), -RUNNING_WINDOW_MS - 5000]
  ]);

  const status = await gatherSessionStatus({
    claudeHome: path.join(fx.tmpDir, '.claude'),
    projectPath: fx.projectPath,
    sessionId: fx.sessionId,
    now
  });

  assert.equal(status.transcriptFound, true);
  assert.deepEqual(status.running.map(a => a.agentId), ['a', 'b'], 'running sorted oldest start first, stale agent excluded');
  assert.equal(status.finishedCount, 1);
  assert.equal(status.totalCount, 3);

  const a = status.running[0];
  assert.equal(a.label, 'Fix failing tests');
  assert.equal(a.agentType, 'general-purpose');
  // Elapsed = now - first record timestamp (11:00 -> 10:00 is 3600s)
  assert.equal(a.startMs, Date.parse('2026-10-05T11:00:00Z'));
  assert.equal(a.lastMs, Date.parse('2026-10-05T11:03:00Z'));
  // input+output only; cache fields ignored
  assert.equal(a.inputTokens, 45200);
  assert.equal(a.outputTokens, 3100);
  assert.equal(a.model, 'haiku');

  const b = status.running[1];
  assert.equal(b.label, 'b', 'missing meta falls back to the file-name id');
  assert.equal(b.inputTokens, 8000);

  // Main transcript facts
  assert.equal(status.sessionStart, Date.parse('2026-10-05T10:00:00Z'));
  assert.equal(status.model, 'glm-5.3:cloud', 'model from the last assistant record');
  assert.equal(status.lastActivityMs, now - 3 * 60_000);
});

test('gatherSessionStatus label falls back to agentType then the file-name id', async () => {
  const fx = await makeFixture({ sessionId: 'sess-222' });
  const usageRecord = (ts) => ([
    { type: 'assistant', timestamp: ts, message: { model: 'm', usage: { input_tokens: 1, output_tokens: 1 } } }
  ]);

  // description present -> label is the description
  await fx.writeAgent('with-type', usageRecord('2026-10-05T11:00:00Z'));
  await fx.writeMeta('with-type', { agentType: 'fork', description: 'Has description' });
  // agentType only -> label is the agentType
  await fx.writeAgent('type-only', usageRecord('2026-10-05T11:01:00Z'));
  await fx.writeMeta('type-only', { agentType: 'explore' });
  // empty meta -> label is the file-name id
  await fx.writeAgent('blank', usageRecord('2026-10-05T11:02:00Z'));
  await fx.writeMeta('blank', {});
  // meta file missing entirely -> label is the file-name id
  await fx.writeAgent('no-meta', usageRecord('2026-10-05T11:03:00Z'));

  const now = 1_700_000_000_000;
  await fx.setMtimes([
    [path.join(fx.subagentsDir, 'agent-with-type.jsonl'), 1000],
    [path.join(fx.subagentsDir, 'agent-type-only.jsonl'), 1000],
    [path.join(fx.subagentsDir, 'agent-blank.jsonl'), 1000],
    [path.join(fx.subagentsDir, 'agent-no-meta.jsonl'), 1000]
  ]);

  const status = await gatherSessionStatus({
    claudeHome: path.join(fx.tmpDir, '.claude'),
    projectPath: fx.projectPath,
    sessionId: fx.sessionId,
    now
  });

  const byId = Object.fromEntries(status.running.map(a => [a.agentId, a]));
  assert.equal(byId['with-type'].label, 'Has description');
  assert.equal(byId['type-only'].label, 'explore', 'no description -> agentType');
  assert.equal(byId['blank'].label, 'blank', 'empty meta -> file-name id');
  assert.equal(byId['no-meta'].label, 'no-meta', 'missing meta -> file-name id');
});

test('gatherSessionStatus returns zero agents when the subagents dir is missing', async () => {
  const fx = await makeFixture({ sessionId: 'sess-333' });
  await fx.writeTranscript([{ type: 'user', timestamp: '2026-10-05T10:00:00Z' }]);
  await fs.rm(fx.subagentsDir, { recursive: true, force: true });

  const status = await gatherSessionStatus({
    claudeHome: path.join(fx.tmpDir, '.claude'),
    projectPath: fx.projectPath,
    sessionId: fx.sessionId,
    now: 1_700_000_000_000
  });

  assert.equal(status.transcriptFound, true);
  assert.equal(status.running.length, 0);
  assert.equal(status.finishedCount, 0);
  assert.equal(status.totalCount, 0);
});

test('gatherSessionStatus tolerates a missing transcript and the formatter still renders', async () => {
  const fx = await makeFixture({ sessionId: 'sess-444' });
  // No transcript written at all
  const status = await gatherSessionStatus({
    claudeHome: path.join(fx.tmpDir, '.claude'),
    projectPath: fx.projectPath,
    sessionId: fx.sessionId,
    now: 1_700_000_000_000
  });

  assert.equal(status.transcriptFound, false);
  assert.equal(status.sessionStart, null);
  assert.equal(status.model, null);
  assert.equal(status.lastActivityMs, null);

  const message = formatStatusMessage({ sessionName: 'claude-x', alive: true, status, now: 1_700_000_000_000 });
  assert.match(message, /Session Status/);
  assert.match(message, /claude-x/);
  assert.match(message, /Online/);
});

test('gatherSessionStatus falls back to the newest transcript when no session id is bound', async () => {
  const fx = await makeFixture();
  await fx.writeTranscript([{ type: 'user', timestamp: '2026-10-05T10:00:00Z' }]);
  await fs.rm(path.join(fx.projectDir, fx.sessionId), { recursive: true, force: true });

  const status = await gatherSessionStatus({
    claudeHome: path.join(fx.tmpDir, '.claude'),
    projectPath: fx.projectPath,
    sessionId: null,
    now: 1_700_000_000_000
  });

  assert.equal(status.transcriptFound, true, 'legacy fallback finds the newest jsonl');
  assert.equal(status.sessionStart, Date.parse('2026-10-05T10:00:00Z'));
});

test('formatStatusMessage lists running agents with uptime, model, and tokens', async () => {
  const now = 1_700_000_000_000;
  const status = {
    transcriptFound: true,
    sessionStart: now - 2 * 3600_000 - 14 * 60_000,
    model: 'glm-5.3:cloud',
    lastActivityMs: now - 3 * 60_000,
    running: [
      { agentId: 'a', label: 'Fix failing tests', agentType: 'general-purpose', startMs: now - 12 * 60_000, lastMs: now - 20_000, inputTokens: 45200, outputTokens: 3100, model: 'haiku' },
      { agentId: 'b', label: 'Search docs', agentType: 'fork', startMs: now - 2 * 60_000, lastMs: now - 5000, inputTokens: 8000, outputTokens: 1200, model: 'gemma4:31b' }
    ],
    finishedCount: 5,
    totalCount: 7
  };

  const message = formatStatusMessage({ sessionName: 'claude-myproject', alive: true, status, now });

  assert.match(message, /claude-myproject/);
  assert.match(message, /Online/);
  assert.match(message, /2h 14m/);
  assert.match(message, /glm-5\.3:cloud/);
  assert.match(message, /2 running · 5 finished/);
  assert.match(message, /12m.*in 45\.2k.*out 3\.1k.*haiku.*active 20s ago/s);
  assert.doesNotMatch(message, /…and/);
});

test('formatStatusMessage caps the agent list at ten and adds an and-N-more line', async () => {
  const now = 1_700_000_000_000;
  const running = [];
  for (let i = 0; i < 30; i++) {
    running.push({
      agentId: `agent${i}`,
      label: `Agent number ${i} with a fairly long descriptive label text`,
      agentType: 'general-purpose',
      startMs: now - (i + 1) * 60_000,
      lastMs: now - 1000,
      inputTokens: 10_000 + i,
      outputTokens: 1000,
      model: 'haiku'
    });
  }

  const message = formatStatusMessage({
    sessionName: 'claude-batch',
    alive: true,
    status: { transcriptFound: true, sessionStart: now - 3600_000, model: 'm1', lastActivityMs: now, running, finishedCount: 0, totalCount: 30 },
    now
  });

  assert.ok(message.length < 3800, `message must stay under 3800 chars, got ${message.length}`);
  assert.match(message, /…and 20 more/);
  assert.ok(!message.includes('`Agent'), 'labels must not carry backticks');
  assert.ok(!running.some(a => sanitizeLabel(a.label).includes('`')), 'sanitizer strips backticks');
});

test('formatStatusMessage handles a missing transcript and dead sessions', () => {
  const message = formatStatusMessage({
    sessionName: 'claude-x',
    alive: false,
    status: { transcriptFound: false, sessionStart: null, model: null, lastActivityMs: null, running: [], finishedCount: 0, totalCount: 0 }
  });
  assert.match(message, /Terminated/);
  assert.match(message, /Sub-agents:\* none/);
});

test('formatting helpers use compact numbers, durations, and sanitized labels', () => {
  assert.equal(formatCompactNumber(0), '0');
  assert.equal(formatCompactNumber(999), '999');
  assert.equal(formatCompactNumber(45200), '45.2k');
  assert.equal(formatCompactNumber(1_250_000), '1.3m'); // toFixed rounds 1.25 up
  assert.equal(formatDuration(45_000), '45s');
  assert.equal(formatDuration(12 * 60_000), '12m');
  assert.equal(formatDuration(2 * 3600_000 + 14 * 60_000), '2h 14m');
  assert.equal(sanitizeLabel('`code` and\nnewlines'), 'code and newlines');
  assert.equal(sanitizeLabel('x'.repeat(100)).length, 48);
  assert.ok(sanitizeLabel('y'.repeat(100)).endsWith('…'));
});
// Tests for the transport-neutral session IO layer. Every test drives a fake
// tmux controller and a fake Orca client, so no tmux runs and no socket opens.
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmuxTarget, orcaTarget, targetLabel, createSessionIo } from '../src/session/target.js';
import { makeTmuxMock } from './helpers.js';

// Recording Orca client. Every call is pushed to `calls`.
function makeOrcaMock(overrides = {}) {
  const calls = [];
  return {
    calls,
    list: async () => (overrides.terminals ?? [{ handle: 'term_a', connected: true }]),
    agentStatus: async (h) => (overrides.statuses?.[h] ?? { isRunningAgent: true, status: null }),
    readTail: async (h) => (overrides.tails?.[h] ?? ''),
    send: async (h, p) => {
      calls.push({ handle: h, ...p });
      return { handle: h, accepted: overrides.accepted ?? true, bytesWritten: p.text?.length ?? 0 };
    }
  };
}

// Recording tmux mock. `makeTmuxMock(overrides)` spreads `overrides` LAST
// (`test/helpers.js:143`), so the recording seam is an override, not a wrapper.
function makeRecordingTmux() {
  const calls = [];
  const tmux = makeTmuxMock({
    sendKeys: async (...args) => { calls.push(args); },
    sendKeysWithDelay: async (...args) => { calls.push(args); }
  });
  return { tmux, calls };
}

const SESSION = 'claude-Main-Agent';
const PROJECT = '/home/orca/Projects/Main Agent';
const TRANSCRIPT = '/home/orca/.claude/projects/-home-orca-Projects-Main-Agent/aaaa.jsonl';

const aTmuxTarget = () => tmuxTarget(SESSION, PROJECT);
const anOrcaTarget = () => orcaTarget({
  handle: 'term_a',
  title: '✳ Casual greeting',
  projectPath: PROJECT,
  transcriptFile: TRANSCRIPT
});

// ---------------------------------------------------------------------------
// sendText
// ---------------------------------------------------------------------------

test('sendText on a tmux target calls tmux.sendKeys with enter', async () => {
  const { tmux, calls } = makeRecordingTmux();
  const io = createSessionIo({ tmux, orca: makeOrcaMock() });

  const result = await io.sendText(aTmuxTarget(), 'hi');

  assert.deepEqual(calls, [[SESSION, 'hi', true]]);
  assert.deepEqual(result, { accepted: true, bytesWritten: 0 });
});

test('sendText on an Orca target calls terminal.send with enter', async () => {
  const orca = makeOrcaMock();
  const io = createSessionIo({ tmux: makeTmuxMock(), orca });

  const result = await io.sendText(anOrcaTarget(), 'hi');

  assert.deepEqual(orca.calls, [{ handle: 'term_a', text: 'hi', enter: true, interrupt: false }]);
  assert.deepEqual(result, { accepted: true, bytesWritten: 2 });
});

test('sendText on an Orca target passes pressEnter through as enter:false', async () => {
  const orca = makeOrcaMock();
  const io = createSessionIo({ tmux: makeTmuxMock(), orca });

  await io.sendText(anOrcaTarget(), 'hi', false);

  assert.deepEqual(orca.calls, [{ handle: 'term_a', text: 'hi', enter: false, interrupt: false }]);
});

// ---------------------------------------------------------------------------
// sendKeys
// ---------------------------------------------------------------------------

test('sendKeys on a tmux target does not touch Orca', async () => {
  const { tmux, calls } = makeRecordingTmux();
  const orca = makeOrcaMock();
  const io = createSessionIo({ tmux, orca });

  const result = await io.sendKeys(aTmuxTarget(), ['Down', 'Space', 'Right', 'Enter']);

  // tmux takes key NAMES, not bytes: the layer never maps a name here.
  assert.deepEqual(calls, [[SESSION, ['Down', 'Space', 'Right', 'Enter'], 300]]);
  // The controller reports no byte count, so the answer is the shared frozen
  // object; a caller must not be able to edit it for the next caller.
  assert.deepEqual(result, { accepted: true, bytesWritten: 0 });
  assert.deepEqual(orca.calls, []);
});

test('sendKeys on an Orca target sends ONE call per key with enter:false', async () => {
  const orca = makeOrcaMock();
  // No-op sleep: this test pins the call shapes, not the timing.
  const io = createSessionIo({ tmux: makeTmuxMock(), orca, sleep: async () => {} });

  const result = await io.sendKeys(anOrcaTarget(), ['Down', 'Space', 'Right', 'Enter']);

  assert.deepEqual(orca.calls, [
    { handle: 'term_a', text: '\x1B[B', enter: false, interrupt: false },
    { handle: 'term_a', text: ' ', enter: false, interrupt: false },
    { handle: 'term_a', text: '\x1B[C', enter: false, interrupt: false },
    { handle: 'term_a', text: '\r', enter: false, interrupt: false }
  ]);
  assert.deepEqual(result, { accepted: true, bytesWritten: 8 });
});

test('sendKeys waits delayMs between Orca keys', async () => {
  let now = 0;
  const sleeps = [];
  const sentAt = [];
  const orca = {
    list: async () => [],
    agentStatus: async () => ({ isRunningAgent: true, status: null }),
    send: async (h, p) => {
      sentAt.push(now);
      return { handle: h, accepted: true, bytesWritten: p.text?.length ?? 0 };
    }
  };
  const io = createSessionIo({
    tmux: makeTmuxMock(),
    orca,
    sleep: async (ms) => { sleeps.push(ms); now += ms; }
  });

  await io.sendKeys(anOrcaTarget(), ['Down', 'Space', 'Right', 'Enter']);

  // Four keys, so three gaps. A sleep after the last key would be wasted time.
  const gaps = sentAt.slice(1).map((t, i) => t - sentAt[i]);
  assert.deepEqual(gaps, [300, 300, 300]);
  assert.deepEqual(sleeps, [300, 300, 300]);
});

test('sendKeys honours a custom delayMs on an Orca target', async () => {
  const sleeps = [];
  const orca = makeOrcaMock();
  const io = createSessionIo({
    tmux: makeTmuxMock(),
    orca,
    sleep: async (ms) => { sleeps.push(ms); }
  });

  await io.sendKeys(anOrcaTarget(), ['Enter', 'Enter'], 50);

  assert.deepEqual(sleeps, [50]);
});

test('sendKeys returns accepted:false when any Orca key is refused and stops', async () => {
  const calls = [];
  const orca = {
    list: async () => [],
    agentStatus: async () => ({ isRunningAgent: true, status: null }),
    send: async (h, p) => {
      calls.push({ handle: h, ...p });
      return { handle: h, accepted: calls.length !== 2, bytesWritten: 1 };
    }
  };
  const io = createSessionIo({ tmux: makeTmuxMock(), orca, sleep: async () => {} });

  const result = await io.sendKeys(anOrcaTarget(), ['Down', 'Space', 'Right', 'Enter']);

  assert.equal(calls.length, 2, 'the third and fourth key must never be sent');
  assert.deepEqual(calls[1], { handle: 'term_a', text: ' ', enter: false, interrupt: false });
  // A half-typed key sequence is worthless, so the count is dropped.
  assert.deepEqual(result, { accepted: false, bytesWritten: 0 });
});

test('sendKeys refuses a key with no Orca byte instead of guessing one', async () => {
  const orca = makeOrcaMock();
  const io = createSessionIo({ tmux: makeTmuxMock(), orca, sleep: async () => {} });

  const result = await io.sendKeys(anOrcaTarget(), ['Down', 'PageUp']);

  assert.deepEqual(orca.calls, [
    { handle: 'term_a', text: '\x1B[B', enter: false, interrupt: false }
  ]);
  assert.deepEqual(result, { accepted: false, bytesWritten: 0 });
});

// ---------------------------------------------------------------------------
// readScreen
// ---------------------------------------------------------------------------

test('readScreen on a tmux target reads the last pane lines', async () => {
  const reads = [];
  const tmux = makeTmuxMock({
    capturePane: async (...args) => { reads.push(args); return '❯ pane text'; }
  });
  const io = createSessionIo({ tmux, orca: makeOrcaMock() });

  assert.equal(await io.readScreen(aTmuxTarget()), '❯ pane text');
  assert.deepEqual(reads, [[SESSION, -40]]);
});

test('readScreen on an Orca target reads the terminal tail', async () => {
  const orca = makeOrcaMock({ tails: { term_a: 'Enter to select · Esc to cancel' } });
  const io = createSessionIo({ tmux: makeTmuxMock(), orca });

  assert.equal(await io.readScreen(anOrcaTarget()), 'Enter to select · Esc to cancel');
});

// ---------------------------------------------------------------------------
// interrupt
// ---------------------------------------------------------------------------

test('interrupt on a tmux target presses Escape once', async () => {
  const { tmux, calls } = makeRecordingTmux();
  const io = createSessionIo({ tmux, orca: makeOrcaMock() });

  const result = await io.interrupt(aTmuxTarget());

  // delayMs 0: an interrupt must not wait.
  assert.deepEqual(calls, [[SESSION, ['Escape'], 0]]);
  assert.deepEqual(result, { accepted: true, bytesWritten: 0 });
});

test('interrupt on an Orca target uses interrupt:true, not a byte', async () => {
  const orca = makeOrcaMock();
  const io = createSessionIo({ tmux: makeTmuxMock(), orca });

  const result = await io.interrupt(anOrcaTarget());

  assert.deepEqual(orca.calls, [{ handle: 'term_a', text: '', enter: false, interrupt: true }]);
  assert.deepEqual(result, { accepted: true, bytesWritten: 0 });
});

// ---------------------------------------------------------------------------
// getBoundSessionId
// ---------------------------------------------------------------------------

test('getBoundSessionId reads the tmux session option and is null for Orca', async () => {
  const tmuxCalls = [];
  const tmux = makeTmuxMock({
    getSessionOption: async (name, key) => { tmuxCalls.push([name, key]); return 'sess-123'; }
  });
  const orcaCalls = { list: 0, agentStatus: 0, send: 0 };
  const orca = {
    list: async () => { orcaCalls.list++; return []; },
    agentStatus: async () => { orcaCalls.agentStatus++; return { isRunningAgent: true, status: null }; },
    send: async () => { orcaCalls.send++; return { handle: 'term_a', accepted: true, bytesWritten: 0 }; }
  };
  const io = createSessionIo({ tmux, orca });

  assert.equal(await io.getBoundSessionId(aTmuxTarget()), 'sess-123');
  assert.deepEqual(tmuxCalls, [[SESSION, '@claude_session_id']]);

  // An Orca tab has no tmux session option. The Orca client is never asked.
  assert.equal(await io.getBoundSessionId(anOrcaTarget()), null);
  assert.deepEqual(orcaCalls, { list: 0, agentStatus: 0, send: 0 });
});

// ---------------------------------------------------------------------------
// isAlive
// ---------------------------------------------------------------------------

test('isAlive is false for a tmux target with no session', async () => {
  const tmuxCalls = [];
  const tmux = makeTmuxMock({ hasSession: async (name) => { tmuxCalls.push(name); return false; } });
  const io = createSessionIo({ tmux, orca: makeOrcaMock() });

  assert.equal(await io.isAlive(aTmuxTarget()), false);
  assert.deepEqual(tmuxCalls, [SESSION]);
});

test('isAlive is true for a tmux target with a session', async () => {
  const io = createSessionIo({ tmux: makeTmuxMock({ hasSession: async () => true }), orca: makeOrcaMock() });

  assert.equal(await io.isAlive(aTmuxTarget()), true);
});

test('isAlive is false for an Orca target absent from terminal.list', async () => {
  const orca = makeOrcaMock({ terminals: [{ handle: 'term_other', connected: true }] });
  const io = createSessionIo({ tmux: makeTmuxMock(), orca });

  assert.equal(await io.isAlive(anOrcaTarget()), false);
});

test('isAlive is true for an Orca target in terminal.list', async () => {
  const orca = makeOrcaMock({ terminals: [{ handle: 'term_a', connected: true }] });
  const io = createSessionIo({ tmux: makeTmuxMock(), orca });

  assert.equal(await io.isAlive(anOrcaTarget()), true);
});

test('isAlive is false for an Orca target whose terminal is disconnected', async () => {
  // A tab that is present but disconnected cannot take input. listAgentTabs
  // already drops it, so the IO layer must agree.
  const orca = makeOrcaMock({ terminals: [{ handle: 'term_a', connected: false }] });
  const io = createSessionIo({ tmux: makeTmuxMock(), orca });

  assert.equal(await io.isAlive(anOrcaTarget()), false);
});

test('isAlive answers null when the Orca transport fails', async () => {
  // A busy or restarting socket is not a dead tab. Only a complete list that
  // does not hold the tab proves the tab is gone.
  const orca = {
    list: async () => { throw new Error('Orca is not running'); },
    agentStatus: async () => ({ isRunningAgent: false, status: null }),
    send: async () => ({ handle: 'term_a', accepted: true, bytesWritten: 0 })
  };
  const io = createSessionIo({ tmux: makeTmuxMock(), orca });

  assert.equal(await io.isAlive(anOrcaTarget()), null);
});

test('isAlive answers false when the tab is absent from a good list', async () => {
  const orca = {
    list: async () => [{ handle: 'term_other', connected: true }],
    agentStatus: async () => ({ isRunningAgent: false, status: null }),
    send: async () => ({ handle: 'term_a', accepted: true, bytesWritten: 0 })
  };
  const io = createSessionIo({ tmux: makeTmuxMock(), orca });

  assert.equal(await io.isAlive(anOrcaTarget()), false);
});

// ---------------------------------------------------------------------------
// status
// ---------------------------------------------------------------------------

test('status is null for a tmux target', async () => {
  // tmux has no cheap status probe; the reader's events drive the typing indicator
  const tmux = makeTmuxMock({
    capturePane: async () => { throw new Error('the screen must never be read'); }
  });
  const io = createSessionIo({ tmux, orca: makeOrcaMock() });

  assert.equal(await io.status(aTmuxTarget()), null);
});

test('status reads agentStatus for an Orca target', async () => {
  const orca = makeOrcaMock({ statuses: { term_a: { isRunningAgent: true, status: 'working' } } });
  const io = createSessionIo({ tmux: makeTmuxMock(), orca });

  assert.equal(await io.status(anOrcaTarget()), 'working');
});

test('status answers null when the Orca transport fails', async () => {
  // An unknown status is null. A transport failure must read the same way.
  const orca = {
    list: async () => [],
    agentStatus: async () => { throw new Error('Orca is not running'); },
    send: async () => ({ handle: 'term_a', accepted: true, bytesWritten: 0 })
  };
  const io = createSessionIo({ tmux: makeTmuxMock(), orca });

  assert.equal(await io.status(anOrcaTarget()), null);
});

// ---------------------------------------------------------------------------
// targetLabel
// ---------------------------------------------------------------------------

test('targetLabel returns the session name and the tab title', () => {
  assert.equal(targetLabel(aTmuxTarget()), SESSION);
  assert.equal(targetLabel(anOrcaTarget()), '✳ Casual greeting');
});

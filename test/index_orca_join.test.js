// Tests for joining a running Orca tab from /projects (src/index.js). The
// project card lists the project's agent tabs, and the orca_tab: action makes
// the tapped tab the active target with its own transcript pinned.
//
// The Orca client is a mock (D22) and the reader is a spy (D23). The real
// ClaudeSessionReader would tail the developer's own ~/.claude history, so
// every transcript assertion here would pass or fail by accident. claudeHome is
// a temp dir and the transcript is a real file on disk.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createBot } from '../src/index.js';
import { makeBotMock, defaultTestConfig, actionHandler } from './helpers.js';
import { projectDirFor } from '../src/orca/terminals.js';
import { OrcaRpcError } from '../src/orca/runtime_client.js';

const PROJECT_PATH = '/home/orca/Projects/Main Agent';
const REPO_ID = 'repo-main';
const CHAT_ID = '111';

// Records the options switchActiveSession hands to start(); does nothing else.
// stop() must not throw: every switch calls it on the outgoing reader.
const readers = [];
class ReaderSpy {
  constructor() {
    this.lastOptions = null;
    this.startedWith = null;
    readers.push(this);
  }
  start(projectPath, onEvent, pollIntervalMs, options) {
    this.startedWith = { projectPath, onEvent, pollIntervalMs };
    this.lastOptions = options;
  }
  stop() {}
}

// A raw Orca terminal record, as terminal.list answers it. listAgentTabs keeps
// it only when connected === true and agentStatus says isRunningAgent.
function tabRecord({
  handle,
  repoId = REPO_ID,
  worktreePath = PROJECT_PATH,
  title = '✳ Casual greeting'
}) {
  return {
    handle,
    connected: true,
    title,
    worktreeId: `${repoId}::${worktreePath}`,
    worktreePath
  };
}

// The Orca client seam (deps.orcaClient). `calls` records every terminal.send.
function makeOrcaMock({ records = [], statuses = {}, sendResult, listError = null }) {
  const calls = [];
  return {
    calls,
    listError,
    // Exposed so a test can change a tab's state between poll ticks.
    statuses,
    async list() {
      if (this.listError) throw this.listError;
      return records;
    },
    async agentStatus(handle) {
      return statuses[handle] ?? { isRunningAgent: true, status: 'idle' };
    },
    async send(handle, options) {
      calls.push({ handle, ...options });
      return sendResult ?? { accepted: true, bytesWritten: 12 };
    }
  };
}

async function makeHarness({
  records = [],
  statuses = {},
  sendResult,
  listError = null,
  writeTranscript = true,
  repoIds = [REPO_ID]
} = {}) {
  // defaultTestConfig() pins claudeHome to the real ~/.claude, so every test
  // must pass its own temp dir.
  const claudeHome = await fs.mkdtemp(path.join(os.tmpdir(), 'orca-join-'));
  const projectDir = projectDirFor(PROJECT_PATH, claudeHome);
  await fs.mkdir(projectDir, { recursive: true });

  let transcriptFile = null;
  if (writeTranscript) {
    transcriptFile = path.join(projectDir, 'sess-1.jsonl');
    // The first record's cwd is what resolveTranscript matches on.
    await fs.writeFile(transcriptFile, JSON.stringify({ cwd: PROJECT_PATH, type: 'user' }) + '\n');
  }

  const project = {
    name: 'Main Agent',
    displayName: 'Main Agent',
    path: PROJECT_PATH,
    repoIds,
    runningSessions: []
  };
  const projectManager = {
    listProjects: async () => [project],
    findProjectBySession: async () => project,
    startFreshSession: async () => 'claude-Main-Agent',
    killCurrentSession: async () => {},
    killProjectSessions: async () => {}
  };

  const sent = []; // raw bot.telegram.sendMessage arguments
  const outbox = []; // every user-visible message text, in order
  const edited = []; // every editMessageText call
  const replies = []; // texts answered with ctx.reply

  const bot = makeBotMock();
  bot.telegram.sendMessage = async (...args) => {
    sent.push(args);
    outbox.push(String(args[1] ?? ''));
    return {};
  };

  const ctx = {
    chat: { id: CHAT_ID },
    reply: async (text) => {
      const message = typeof text === 'string' ? text : '';
      replies.push(message);
      outbox.push(message);
      return {};
    },
    editMessageText: async (text, extra) => {
      edited.push({ text, ...extra });
      return {};
    },
    answerCbQuery: async () => {}
  };

  const orca = makeOrcaMock({ records, statuses, sendResult, listError });
  readers.length = 0;

  const api = createBot(defaultTestConfig({ claudeHome, allowedUserIds: [CHAT_ID] }), {
    bot,
    orcaClient: orca,
    projectManager,
    sessionReaderClass: ReaderSpy
  });

  return {
    api,
    bot,
    orca,
    ctx,
    project,
    claudeHome,
    transcriptFile,
    sent,
    outbox,
    edited,
    replies,
    lastReader: () => readers[readers.length - 1] ?? null
  };
}

// The mock bot records handlers without running the regexes, so the match
// array is supplied by hand, exactly as test/integration.test.js does.
async function dispatch(harness, substring, match) {
  const handler = actionHandler(harness.bot, substring);
  assert.ok(handler, `no handler is registered for ${substring}`);
  await handler({ ...harness.ctx, match });
}

async function sendText(harness, text) {
  await harness.bot.handlers.on.text({
    chat: { id: CHAT_ID },
    message: { text },
    reply: harness.ctx.reply
  });
}

test('project_select renders the tab rows for the project', async () => {
  const h = await makeHarness({ records: [tabRecord({ handle: 'term_a' })] });

  await dispatch(h, 'project_select:', ['project_select:Main Agent', 'Main Agent']);

  const keyboard = h.edited[0].reply_markup.inline_keyboard;
  assert.equal(keyboard[0][0].callback_data, 'orca_tab:term_a');

  h.api.stop();
});

test('listProjectTabs drops a tab whose repoId belongs to another project', async () => {
  const h = await makeHarness({ records: [tabRecord({ handle: 'term_b', repoId: 'bbb' })] });
  const project = { name: 'Main Agent', path: PROJECT_PATH, repoIds: ['aaa'] };

  assert.deepEqual(await h.api.listProjectTabs(project), []);

  h.api.stop();
});

test('listProjectTabs falls back to the path when repoIds is empty', async () => {
  const h = await makeHarness({ records: [tabRecord({ handle: 'term_a', repoId: 'aaa' })] });
  const project = { name: 'Main Agent', path: PROJECT_PATH, repoIds: [] };

  const tabs = await h.api.listProjectTabs(project);

  assert.deepEqual(tabs.map((tab) => tab.handle), ['term_a']);

  h.api.stop();
});

test('tapping a tab makes it the active target and sends no history', async () => {
  const h = await makeHarness({ records: [tabRecord({ handle: 'term_a' })] });

  await dispatch(h, 'orca_tab:', ['orca_tab:term_a', 'term_a']);

  const state = h.api.getActiveState();
  assert.equal(state.target.kind, 'orca');
  assert.equal(state.target.handle, 'term_a');
  assert.equal(state.target.transcriptFile, h.transcriptFile);
  // One message — the join confirmation. No history replay on join (G6).
  assert.equal(h.sent.length, 1);
  assert.match(h.sent[0][1], /Joined/);

  h.api.stop();
});

test('text sent after joining goes to the tab with enter:true', async () => {
  const h = await makeHarness({ records: [tabRecord({ handle: 'term_a' })] });
  await dispatch(h, 'orca_tab:', ['orca_tab:term_a', 'term_a']);

  await sendText(h, 'hello');

  assert.deepEqual(h.orca.calls, [
    { handle: 'term_a', text: 'Telegram user: hello', enter: true, interrupt: false }
  ]);

  h.api.stop();
});

test('joining starts the typing indicator when the tab is working', async () => {
  const h = await makeHarness({
    records: [tabRecord({ handle: 'term_a' })],
    statuses: { term_a: { isRunningAgent: true, status: 'working' } }
  });

  await dispatch(h, 'orca_tab:', ['orca_tab:term_a', 'term_a']);

  assert.equal(h.api.getActiveState().typingActive, true);

  h.api.stop();
});

// Wait until the condition holds, or give up and let the assertion fail with a
// real message. Same helper as test/session_reader.test.js.
async function waitFor(predicate, { timeoutMs = 2000, stepMs = 10 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return false;
}

test('typing stops when the tab goes idle with nothing left to report', async () => {
  const statuses = { term_a: { isRunningAgent: true, status: 'working' } };
  const h = await makeHarness({ records: [tabRecord({ handle: 'term_a' })], statuses });

  await dispatch(h, 'orca_tab:', ['orca_tab:term_a', 'term_a']);
  assert.equal(h.api.getActiveState().typingActive, true);

  // The turn ends with no text and no question. Nothing on the transcript
  // stops the indicator, so the tab's own idle state must. Two readings in a
  // row are required, so this takes two 4s ticks.
  h.orca.statuses.term_a = { isRunningAgent: true, status: 'idle' };

  assert.ok(
    await waitFor(() => h.api.getActiveState().typingActive === false, { timeoutMs: 15000 }),
    'typing must stop on a sustained idle report'
  );

  h.api.stop();
});

test('joining an idle tab starts no typing indicator', async () => {
  const h = await makeHarness({
    records: [tabRecord({ handle: 'term_a' })],
    statuses: { term_a: { isRunningAgent: true, status: 'idle' } }
  });

  await dispatch(h, 'orca_tab:', ['orca_tab:term_a', 'term_a']);

  assert.equal(h.api.getActiveState().typingActive, false);

  h.api.stop();
});

test('a project with two tabs renders one row per tab', async () => {
  // Task 7's tests never pass more than one tab, and with one tab a
  // single-row-for-everything layout is byte-identical to the right one. This
  // path also proves Task 7 and Task 9 agree on the tab list and its order.
  const h = await makeHarness({
    records: [
      tabRecord({ handle: 'term_one', title: '✳ First task' }),
      tabRecord({ handle: 'term_two', title: '✳ Second task' })
    ],
    statuses: {
      term_one: { isRunningAgent: true, status: 'working' },
      term_two: { isRunningAgent: true, status: 'idle' }
    }
  });

  await dispatch(h, 'project_select:', ['project_select:Main Agent', 'Main Agent']);

  const keyboard = h.edited[0].reply_markup.inline_keyboard;
  assert.equal(keyboard[0].length, 1);
  assert.equal(keyboard[1].length, 1);
  assert.equal(keyboard[0][0].text, '🟢 First task');
  assert.equal(keyboard[1][0].text, '⚪️ Second task');
  assert.equal(keyboard[0][0].callback_data, 'orca_tab:term_one');
  assert.equal(keyboard[1][0].callback_data, 'orca_tab:term_two');

  h.api.stop();
});

test('the reader is started on the pinned transcript file', async () => {
  const h = await makeHarness({ records: [tabRecord({ handle: 'term_a' })] });

  await dispatch(h, 'orca_tab:', ['orca_tab:term_a', 'term_a']);

  const reader = h.lastReader();
  assert.ok(reader, 'switchActiveSession started no reader');
  // The pin: without it the reader falls to newest-file mode and drifts to
  // another tab's transcript. The callback re-resolves it every 5th tick.
  assert.equal(reader.lastOptions.sessionFile, h.transcriptFile);
  assert.equal(typeof reader.lastOptions.getSessionFile, 'function');

  h.api.stop();
});

test('an Orca error answers a plain message and does not throw', async () => {
  const cases = [
    new OrcaRpcError('Orca is not running', { code: 'runtime_unavailable' }),
    // The Orca-restart case: the runtime json names a socket that will not connect.
    new OrcaRpcError('Cannot connect to the Orca socket', { code: 'socket_error' })
  ];

  for (const listError of cases) {
    const h = await makeHarness({ records: [tabRecord({ handle: 'term_a' })], listError });

    await dispatch(h, 'project_select:', ['project_select:Main Agent', 'Main Agent']);

    assert.match(h.outbox.join('\n'), /Orca is not running|not available/i);

    // /projects still renders; the tab section is simply empty.
    const view = h.edited[0];
    assert.equal(view.text.includes('Terminals:'), false);
    const keyboard = view.reply_markup.inline_keyboard;
    assert.ok(keyboard[0][0].text.includes('Start Session'));

    h.api.stop();
  }
});

test('a tab with no transcript still joins and confirms', async () => {
  const h = await makeHarness({
    records: [tabRecord({ handle: 'term_a' })],
    writeTranscript: false
  });

  await dispatch(h, 'orca_tab:', ['orca_tab:term_a', 'term_a']);

  assert.equal(h.api.getActiveState().target.transcriptFile, null);
  // The reader still starts, pinned to "no file yet", so the tab's first turn
  // is delivered once Claude writes it.
  assert.equal(h.lastReader().lastOptions.sessionFile, null);
  assert.equal(h.sent.length, 1);
  assert.match(h.sent[0][1], /Joined/);

  h.api.stop();
});

test('a refused send tells the user the tab did not accept the input', async () => {
  const h = await makeHarness({
    records: [tabRecord({ handle: 'term_a' })],
    sendResult: { accepted: false, bytesWritten: 0 }
  });
  await dispatch(h, 'orca_tab:', ['orca_tab:term_a', 'term_a']);
  h.replies.length = 0;
  h.outbox.length = 0;

  await sendText(h, 'hello');

  assert.match(h.outbox.join('\n'), /did not accept|refused/i);
  assert.equal(h.api.getActiveState().typingActive, false);

  h.api.stop();
});

test('a tab that closed before the tap is reported and the project re-renders', async () => {
  const h = await makeHarness({ records: [tabRecord({ handle: 'term_gone' })] });
  await dispatch(h, 'project_select:', ['project_select:Main Agent', 'Main Agent']);

  // The tab closes between the render and the tap.
  h.orca.list = async () => [];

  await dispatch(h, 'orca_tab:', ['orca_tab:term_gone', 'term_gone']);

  assert.match(h.outbox.join('\n'), /no longer open/);
  assert.equal(h.api.getActiveState().target, null);
  // The project card came back, with no tab row left in it.
  const keyboard = h.edited[h.edited.length - 1].reply_markup.inline_keyboard;
  assert.ok(keyboard[0][0].text.includes('Start Session'));

  h.api.stop();
});

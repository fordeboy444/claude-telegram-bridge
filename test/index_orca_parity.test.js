// Tests for full parity on a joined Orca tab (src/index.js): a question card,
// the five injection sites, /interrupt and /status all work through the IO
// layer, with no tmux screen read.
//
// An Orca tab has no tmux pane. The tmux mock records every capturePane call,
// so a test here can prove that the Orca path never reads a screen that does
// not exist for it. The Orca client is a mock for the same reason Task 9's
// file uses one: the real client needs a live Orca socket.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createBot } from '../src/index.js';
import { makeBotMock, makeTmuxMock, defaultTestConfig, actionHandler } from './helpers.js';
import { tmuxTarget, orcaTarget } from '../src/session/target.js';

const PROJECT_PATH = '/home/orca/Projects/Main Agent';
const SESSION = 'claude-Main-Agent';
const CHAT_ID = '111';
const HANDLE = 'term_a';
// The joined target carries the tab's cleanTitle, not its raw title. No test
// may read `target.title` for a label.
const TITLE = '✳ Casual greeting';
const IDLE = { isRunningAgent: true, status: 'idle' };
const WORKING = { isRunningAgent: true, status: 'working' };
const QUESTION = {
  question: 'Pick one:',
  options: [{ label: 'A' }, { label: 'B' }, { label: 'C' }]
};

// Records the callback the bot hands to start(); stop() must not throw.
class ReaderSpy {
  constructor(readers) {
    this.startedWith = null;
    readers.push(this);
  }
  start(projectPath, onEvent, pollIntervalMs, options) {
    this.startedWith = { projectPath, onEvent, pollIntervalMs, options };
  }
  stop() {}
}

// The Orca client seam (deps.orcaClient). `calls` records every terminal.send,
// `statusCalls` every agentStatus probe, `readCalls` every terminal.read: a
// test can then tell a tab status read from a screen read.
function makeOrcaMock({ statuses = {}, sendResult, tails = {} } = {}) {
  const calls = [];
  const statusCalls = [];
  const readCalls = [];
  return {
    calls,
    statusCalls,
    readCalls,
    async list() {
      return [{
        handle: HANDLE,
        connected: true,
        title: TITLE,
        worktreeId: `repo-main::${PROJECT_PATH}`,
        worktreePath: PROJECT_PATH
      }];
    },
    async agentStatus(handle) {
      statusCalls.push(handle);
      return statuses[handle] ?? IDLE;
    },
    async readTail(handle) {
      readCalls.push(handle);
      return tails[handle] ?? '';
    },
    async send(handle, options) {
      calls.push({ handle, ...options });
      return sendResult ?? { accepted: true, bytesWritten: 12 };
    }
  };
}

async function makeHarness({ statuses = {}, sendResult, tails = {} } = {}) {
  // defaultTestConfig() pins claudeHome to the real ~/.claude. A temp dir keeps
  // the /status gather and the skills scan off the developer's own machine.
  const claudeHome = await fs.mkdtemp(path.join(os.tmpdir(), 'orca-parity-'));
  const bot = makeBotMock();
  const captured = []; // every capturePane call: an Orca target must have none
  const tmux = makeTmuxMock({
    capturePane: async (...args) => {
      captured.push(args);
      return '❯ pane text';
    }
  });

  const sent = [];
  const outbox = [];
  const replies = [];
  const replyMarkups = [];
  const edited = [];
  const cbAnswers = [];
  bot.telegram.sendMessage = async (...args) => {
    sent.push(args);
    outbox.push(String(args[1] ?? ''));
    return {};
  };

  const ctx = {
    chat: { id: CHAT_ID },
    reply: async (text, extra) => {
      const message = typeof text === 'string' ? text : '';
      replies.push(message);
      replyMarkups.push(extra?.reply_markup ?? null);
      outbox.push(message);
      return {};
    },
    editMessageText: async (text, extra) => {
      edited.push({ text, ...extra });
      return {};
    },
    answerCbQuery: async (answer) => {
      cbAnswers.push(answer);
      return {};
    }
  };

  const orca = makeOrcaMock({ statuses, sendResult, tails });
  const readers = [];
  class Spy extends ReaderSpy {
    constructor() {
      super(readers);
    }
  }
  const api = createBot(defaultTestConfig({ claudeHome, allowedUserIds: [CHAT_ID] }), {
    bot,
    tmux,
    orcaClient: orca,
    sessionReaderClass: Spy
  });

  return {
    api,
    bot,
    tmux,
    orca,
    ctx,
    sent,
    outbox,
    replies,
    replyMarkups,
    edited,
    cbAnswers,
    captured,
    // Drive an event through the reader the bot started most recently.
    onEvent: (event) => readers.at(-1).startedWith.onEvent(event)
  };
}

// Join a running Orca tab as the active target, exactly as the orca_tab: tap
// does: an orca target record, the chat id and the worktree path.
async function joinOrcaTab(options = {}) {
  const h = await makeHarness(options);
  await h.api.switchActiveSession(
    orcaTarget({ handle: HANDLE, title: TITLE, projectPath: PROJECT_PATH, transcriptFile: null }),
    CHAT_ID,
    PROJECT_PATH
  );
  return h;
}

// The mock bot records handlers without running the regexes, so the match
// array is supplied by hand, exactly as test/integration.test.js does.
async function dispatch(h, substring, match) {
  const handler = actionHandler(h.bot, substring);
  assert.ok(handler, `no handler is registered for ${substring}`);
  await handler({ ...h.ctx, match });
}

// Drive one 'question' event through the reader the bot started.
function raiseQuestion(h) {
  return h.onEvent({ type: 'question', content: QUESTION });
}

// Tap the second option of a single-choice card: every question is answered,
// so the card submits at once.
function tapAnswer(h, option = 1) {
  return dispatch(h, 'qa:', [`qa:0:${option}`, '0', String(option)]);
}

// Open the first skill of the browser and run it. Returns the command the
// inspect card shows, so no test hard-codes which skill sits first.
async function runFirstSkill(h) {
  await h.api.refreshSkills();
  await h.bot.handlers.commands.skills({ ...h.ctx });

  const inspectHash = findCallback(h.replyMarkups.at(-1), 'skill_inspect:');
  await dispatch(h, 'skill_inspect:', [`skill_inspect:${inspectHash}`, inspectHash]);

  const view = h.edited.at(-1);
  const command = /`(\/[^`]+)`/.exec(view.text)?.[1];
  assert.ok(command, `the inspect card must show the command, got: ${view.text}`);

  const runHash = findCallback(view.reply_markup, 'skill_run_now:');
  await dispatch(h, 'skill_run_now:', [`skill_run_now:${runHash}`, runHash]);
  return command;
}

// The tail of the first callback_data that carries the given prefix.
function findCallback(markup, prefix) {
  for (const row of markup?.inline_keyboard ?? []) {
    for (const button of row) {
      if (typeof button.callback_data === 'string' && button.callback_data.startsWith(prefix)) {
        return button.callback_data.slice(button.callback_data.indexOf(':') + 1).split(':').at(-1);
      }
    }
  }
  throw new Error(`no ${prefix} button found`);
}

// Poll a condition to its deadline: the submit path is async and a test must
// not guess when it has reached a given step.
async function waitFor(predicate, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('the condition never became true');
}

test('answering a question on an Orca target sends the answer keys to the tab', async () => {
  const h = await joinOrcaTab({ statuses: { [HANDLE]: WORKING } });

  await raiseQuestion(h);
  await tapAnswer(h);

  // One key per call, bytes and not key names: digit 2 selects and advances,
  // then Enter submits the review screen.
  assert.deepEqual(
    h.orca.calls
      .filter((call) => call.enter === false && call.interrupt === false)
      .map((call) => call.text),
    ['2', '\r']
  );
  assert.deepEqual(h.orca.calls.at(-1), {
    handle: HANDLE,
    text: '\r',
    enter: false,
    interrupt: false
  });

  h.api.stop();
});

test('ensureModalSubmitted for an Orca target reads the tab, never the tmux pane', async () => {
  const h = await joinOrcaTab({
    tails: { [HANDLE]: "● User answered Claude's questions:\n  ⎿  · Pick one: → B" }
  });

  await raiseQuestion(h);
  await tapAnswer(h);

  assert.equal(h.captured.length, 0, 'capturePane was called for an Orca target');
  assert.ok(h.orca.readCalls.length >= 1, 'the tab screen must be read');
  assert.ok(h.orca.readCalls.every((c) => c === HANDLE));

  h.api.stop();
});

test('ensureModalSubmitted for an Orca target confirms on the screen after a fast turn', async () => {
  // A fast model returns to idle before the first 600 ms poll, so the status
  // never shows 'working'. The closed modal on the screen is the proof.
  const h = await joinOrcaTab({
    tails: { [HANDLE]: "● User answered Claude's questions:\n  ⎿  · Pick one: → B\n✻ Worked for 1s" }
  });

  await raiseQuestion(h);
  await tapAnswer(h);

  assert.match(h.replies.at(-1), /submitted/i);
  assert.ok(h.orca.statusCalls.length >= 1);

  h.api.stop();
});

test('ensureModalSubmitted for an Orca target returns true when the counter moved', async () => {
  // The tab stays idle: only a NEW question event can confirm that the old
  // modal closed.
  const h = await joinOrcaTab();
  await raiseQuestion(h);

  const submitting = tapAnswer(h);
  // The counter is read just before the keys go out, so the new question must
  // arrive after them: wait for the Enter key, then raise it.
  await waitFor(() => h.orca.calls.length >= 2);
  await raiseQuestion(h);
  await submitting;

  assert.match(h.replies.at(-1), /submitted/i);

  h.api.stop();
});

test('ensureModalSubmitted for an Orca target falls back to agentStatus working', async () => {
  const h = await joinOrcaTab({ statuses: { [HANDLE]: WORKING } });

  await raiseQuestion(h);
  await tapAnswer(h);

  assert.ok(h.orca.statusCalls.length >= 1);
  assert.ok(h.orca.statusCalls.every((c) => c === HANDLE));
  assert.match(h.replies.at(-1), /submitted/i);

  h.api.stop();
});

test('ensureModalSubmitted for an Orca target returns false when neither signal fires', async () => {
  const h = await joinOrcaTab(); // the tab reports idle and no new question arrives

  await raiseQuestion(h);
  await tapAnswer(h);

  assert.match(h.replies.at(-1), /Could not confirm the answer/i);
  assert.equal(h.captured.length, 0);

  h.api.stop();
});

test('a skill button injects its command into the Orca tab', async () => {
  const h = await joinOrcaTab();

  const command = await runFirstSkill(h);

  assert.deepEqual(h.orca.calls.at(-1), {
    handle: HANDLE,
    text: command,
    enter: true,
    interrupt: false
  });
  assert.match(h.replies.at(-1), /Injected/);

  h.api.stop();
});

test('a slash command from the text handler reaches the Orca tab', async () => {
  const h = await joinOrcaTab();
  await h.api.refreshSkills();

  await h.bot.handlers.on.text({
    chat: { id: CHAT_ID },
    message: { text: '/clear' },
    reply: h.ctx.reply
  });

  assert.deepEqual(h.orca.calls.at(-1), {
    handle: HANDLE,
    text: '/clear',
    enter: true,
    interrupt: false
  });
  assert.match(h.replies.at(-1), /Injected/);

  h.api.stop();
});

test('/interrupt on an Orca tab sends interrupt:true and clears the active question', async () => {
  const h = await joinOrcaTab();

  await raiseQuestion(h);
  await h.bot.handlers.commands.interrupt({ ...h.ctx });

  assert.deepEqual(h.orca.calls.at(-1), {
    handle: HANDLE,
    text: '',
    enter: false,
    interrupt: true
  });
  assert.ok(
    h.replies.at(-1).includes(TITLE),
    'the interrupt reply names the tab by its clean title'
  );

  // The card state is dropped, so a later tap expires.
  await tapAnswer(h);
  assert.equal(h.cbAnswers.at(-1), 'Question expired or not found');

  h.api.stop();
});

test('/interrupt on a tmux tab still presses Escape exactly once', async () => {
  const bot = makeBotMock();
  const delayed = [];
  const tmux = makeTmuxMock({
    sendKeysWithDelay: async (...args) => {
      delayed.push(args);
    }
  });
  const api = createBot(defaultTestConfig({ allowedUserIds: [CHAT_ID] }), {
    bot,
    tmux,
    orcaClient: makeOrcaMock(),
    sessionReaderClass: class {
      start() {}
      stop() {}
    }
  });
  await api.switchActiveSession(tmuxTarget(SESSION, PROJECT_PATH), CHAT_ID, PROJECT_PATH);

  await bot.handlers.commands.interrupt({ reply: async () => {} });

  assert.deepEqual(delayed, [[SESSION, ['Escape'], 0]], 'exactly one Escape, no delay');

  api.stop();
});

test('/status works for an Orca target without capturePane', async () => {
  const h = await joinOrcaTab();

  await h.bot.handlers.commands.status({ ...h.ctx });

  assert.equal(h.captured.length, 0, 'capturePane was called for an Orca target');
  assert.ok(
    h.replies.at(-1).includes(TITLE),
    `the status card names the tab by its clean title, got: ${h.replies.at(-1)}`
  );

  h.api.stop();
});

test('a refused skill injection tells the user the tab did not accept the input', async () => {
  const h = await joinOrcaTab({ sendResult: { accepted: false, bytesWritten: 0 } });

  await runFirstSkill(h);

  assert.doesNotMatch(h.replies.at(-1), /Injected/);
  assert.match(h.replies.at(-1), /did not accept|Nothing was sent/i);

  h.api.stop();
});

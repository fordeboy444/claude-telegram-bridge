import test from 'node:test';
import assert from 'node:assert/strict';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createBot } from '../src/index.js';
import { makeBotMock, makeTmuxMock, defaultTestConfig, actionHandler, makeSkill } from './helpers.js';
import { getProjectSlug } from '../src/tmux/session_reader.js';

test('createBot initializes Telegraf instance with middleware, setMyCommands, and handlers', async () => {
  let commandsSet = null;
  const commandScopes = [];
  const mockBot = makeBotMock();
  mockBot.telegram.setMyCommands = async (cmds, extra) => {
    if (!extra || !extra.scope || extra.scope.type === 'default') {
      commandsSet = cmds;
    }
    commandScopes.push(extra && extra.scope ? extra.scope.type : 'default');
  };

  const config = defaultTestConfig();

  const { bot, switchActiveSession, getActiveState } = createBot(config, { bot: mockBot });
  // Allow the fire-and-forget updateBotCommands() loop to finish both scopes
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(bot);
  assert.equal(typeof switchActiveSession, 'function');
  assert.equal(typeof getActiveState, 'function');
  assert.equal(getActiveState().activeSessionName, null);
  assert.ok(Array.isArray(commandsSet));
  assert.equal(commandsSet.length, 6);
  assert.equal(commandsSet[0].command, 'projects');
  assert.ok(commandsSet.some(c => c.command === 'interrupt'), 'interrupt in the command menu');
  // Menu must also be registered for private chats, or stale all_private_chats
  // scoped commands from other tools override the default scope menu.
  assert.ok(commandScopes.includes('all_private_chats'), 'commands registered for all_private_chats scope');
});

test('updateBotCommands logs a warning when Telegram command sync fails', async (t) => {
  const warn = t.mock.method(console, 'warn');
  const mockBot = makeBotMock();
  mockBot.telegram.setMyCommands = async () => {
    throw new Error('network down');
  };

  createBot(defaultTestConfig(), { bot: mockBot });
  await new Promise((resolve) => setImmediate(resolve));

  assert.ok(warn.mock.callCount() >= 1, 'expected a warning for failed command sync');
  assert.match(
    warn.mock.calls.map(c => c.arguments.join(' ')).join('\n'),
    /Telegram command sync failed/
  );
});

test('qa callback action answers a single-choice question with digit then Enter', async () => {
  const sentSequences = [];
  const mockBot = makeBotMock();

  const mockTmux = makeTmuxMock({
    sendKeysWithDelay: async (session, keys) => {
      sentSequences.push({ session, keys });
    }
  });

  let readerOnEvent = null;
  class MockReader {
    start(projectPath, onEvent) { readerOnEvent = onEvent; }
    stop() {}
  }

  const botInstance = createBot(defaultTestConfig(), {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });
  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');

  readerOnEvent({
    type: 'question',
    content: { question: 'Pick one:', options: [{ label: 'A' }, { label: 'B' }, { label: 'C' }] }
  });

  const qaHandler = actionHandler(mockBot, 'qa:');
  assert.ok(qaHandler, 'qa action handler registered');

  let cbAnswer = null;
  let replyText = null;
  const mockCtx = {
    match: ['qa:0:1', '0', '1'],
    chat: { id: 12345 },
    answerCbQuery: async (msg) => { cbAnswer = msg; },
    reply: async (text) => { replyText = text; }
  };

  await qaHandler(mockCtx);

  // Single-choice tap answers immediately: digit 2 selects and advances,
  // Enter submits on the review screen.
  assert.equal(sentSequences.length, 1);
  assert.equal(sentSequences[0].session, 'claude-test');
  assert.deepEqual(sentSequences[0].keys, ['2', 'Enter']);
  assert.ok(cbAnswer);
  assert.match(replyText, /submitted/i);

  botInstance.stop();
});

test('qa toggle and submit_q handle multiSelect question answers with key sequence', async () => {
  const sentSequences = [];
  let sentKeys = [];

  const mockBot = makeBotMock();

  const mockTmux = makeTmuxMock({
    sendKeys: async (session, keys, enter) => {
      sentKeys.push({ session, keys, enter });
    },
    sendKeysWithDelay: async (session, keys) => {
      sentSequences.push({ session, keys });
    }
  });

  class MockReader {
    start(projPath, onEvent) {
      this.onEvent = onEvent;
    }
    stop() {}
  }
  let mockReaderInstance = null;

  const botInstance = createBot(defaultTestConfig(), {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: function() {
      mockReaderInstance = new MockReader();
      return mockReaderInstance;
    }
  });

  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');

  const qaHandler = actionHandler(mockBot, 'qa:');
  const submitHandler = actionHandler(mockBot, 'submit_q');
  assert.ok(qaHandler, 'qa action registered');
  assert.ok(submitHandler, 'submit_q action registered');

  // Trigger question event with multiSelect
  let sentMessages = [];
  mockBot.telegram.sendMessage = async (chatId, text, extra) => {
    sentMessages.push({ chatId, text, extra });
  };

  mockReaderInstance.onEvent({
    type: 'question',
    content: {
      questions: [
        {
          question: 'Pick items',
          multiSelect: true,
          options: [{ label: 'Option 1' }, { label: 'Option 2' }, { label: 'Option 3' }]
        }
      ]
    }
  });

  // Toggle option 0 and option 2
  let editedMarkup = null;
  const mockToggleCtx1 = {
    match: ['qa:0:0', '0', '0'],
    editMessageText: async (text, extra) => { editedMarkup = extra.reply_markup; },
    answerCbQuery: async () => {}
  };
  await qaHandler(mockToggleCtx1);

  const mockToggleCtx2 = {
    match: ['qa:0:2', '0', '2'],
    editMessageText: async (text, extra) => { editedMarkup = extra.reply_markup; },
    answerCbQuery: async () => {}
  };
  await qaHandler(mockToggleCtx2);

  // Submit options 0 and 2
  let submitAnswered = false;
  let submitReply = null;
  const mockSubmitCtx = {
    chat: { id: 12345 },
    answerCbQuery: async (msg) => { submitAnswered = msg; },
    reply: async (text) => { submitReply = text; }
  };
  await submitHandler(mockSubmitCtx);

  assert.equal(sentSequences.length, 1, 'sendKeysWithDelay was called once');
  assert.equal(sentSequences[0].session, 'claude-test');
  // At index 0: Space. Then to index 2: Down, Down, Space. Right opens the
  // review screen, Enter submits it.
  assert.deepEqual(sentSequences[0].keys, ['Space', 'Down', 'Down', 'Space', 'Right', 'Enter']);
  assert.match(submitReply, /submitted/i);

  botInstance.stop();
});

test('text handler routes direct slash commands to active tmux session', async () => {
  const sentKeys = [];
  const mockBot = makeBotMock();

  const mockTmux = makeTmuxMock({
    capturePane: async () => '',
    sendKeys: async (session, keys, enter) => {
      sentKeys.push({ session, keys, enter });
    }
  });

  const botInstance = createBot(defaultTestConfig(), { bot: mockBot, tmux: mockTmux });
  const { switchActiveSession, refreshSkills } = botInstance;

  await refreshSkills();
  switchActiveSession('claude-test', 12345);

  const textHandler = mockBot.handlers.on.text;
  assert.ok(textHandler, 'text handler registered');

  let repliedText = null;
  const mockCtx = {
    message: { text: '/clear' },
    reply: async (text) => { repliedText = text; }
  };

  await textHandler(mockCtx);

  assert.equal(sentKeys.length, 1);
  assert.equal(sentKeys[0].session, 'claude-test');
  assert.equal(sentKeys[0].keys, '/clear');
  assert.equal(sentKeys[0].enter, true);
  assert.ok(repliedText.includes('Injected `/clear`'));

  botInstance.stop();
});

test('text handler auto-attaches to single running session when activeSessionName is null', async () => {
  const sentKeys = [];
  const chatActions = [];
  const mockBot = makeBotMock();
  mockBot.telegram.sendChatAction = async (chatId, action) => { chatActions.push({ chatId, action }); };

  const mockTmux = makeTmuxMock({
    listSessions: async () => ['claude-auto-project'],
    sendKeys: async (session, keys, enter) => {
      sentKeys.push({ session, keys, enter });
    }
  });

  const mockProjectManager = {
    findProjectBySession: async () => ({ name: 'auto-project', path: '/tmp/auto-project' })
  };

  const botInstance = createBot(defaultTestConfig(), {
    bot: mockBot,
    tmux: mockTmux,
    projectManager: mockProjectManager
  });

  const replies = [];
  const mockCtx = {
    chat: { id: 999 },
    message: { text: 'Hello from Telegram' },
    reply: async (text) => { replies.push(text); }
  };

  await mockBot.handlers.on.text(mockCtx);

  assert.equal(sentKeys.length, 1);
  assert.equal(sentKeys[0].session, 'claude-auto-project');
  assert.equal(sentKeys[0].keys, 'Telegram user: Hello from Telegram');
  assert.ok(replies.some(r => r.includes('Auto-connected to active session')));
  assert.ok(chatActions.some(a => a.action === 'typing'));

  botInstance.stop();
});

test('switchActiveSession binds the reader to the tmux session id option', async () => {
  const mockBot = makeBotMock();

  const optionCalls = [];
  const mockTmux = makeTmuxMock({
    getSessionOption: async (session, key) => {
      optionCalls.push({ session, key });
      return 'sid-uuid-1';
    }
  });

  const readers = [];
  class MockReader {
    constructor() {
      this.startCalls = [];
      readers.push(this);
    }
    start(projectPath, onEvent, pollIntervalMs, options) {
      this.startCalls.push({ projectPath, onEvent, pollIntervalMs, options });
    }
    stop() {}
  }

  const botInstance = createBot(defaultTestConfig({ allowedUserIds: ['111'] }), {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });

  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');

  assert.equal(optionCalls.length, 1);
  assert.equal(optionCalls[0].session, 'claude-test');
  assert.equal(optionCalls[0].key, '@claude_session_id');
  assert.equal(readers.length, 1);
  assert.equal(readers[0].startCalls.length, 1);
  assert.equal(readers[0].startCalls[0].options.sessionId, 'sid-uuid-1');

  botInstance.stop();
});

test('switchActiveSession falls back to newest-file reading when the session has no stored session id', async () => {
  const mockBot = makeBotMock();
  const mockTmux = makeTmuxMock({ getSessionOption: async () => null });

  const readers = [];
  class MockReader {
    constructor() {
      this.startCalls = [];
      readers.push(this);
    }
    start(projectPath, onEvent, pollIntervalMs, options) {
      this.startCalls.push({ projectPath, onEvent, pollIntervalMs, options });
    }
    stop() {}
  }

  const botInstance = createBot(defaultTestConfig({ allowedUserIds: ['111'] }), {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });

  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');

  assert.equal(readers.length, 1);
  assert.equal(readers[0].startCalls.length, 1);
  assert.equal(readers[0].startCalls[0].options.sessionId, null);

  botInstance.stop();
});

test('result events from the reader stop the typing indicator', async () => {
  const mockBot = makeBotMock();

  const mockTmux = makeTmuxMock();

  const sentMessages = [];
  mockBot.telegram.sendMessage = async (chatId, text) => { sentMessages.push({ chatId, text }); };

  let readerOnEvent = null;
  class MockReader {
    start(projectPath, onEvent) {
      readerOnEvent = onEvent;
    }
    stop() {}
  }

  const botInstance = createBot(defaultTestConfig({ allowedUserIds: ['111'] }), {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });

  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');
  assert.ok(readerOnEvent, 'reader started');

  const messagesBefore = sentMessages.length;

  // A user event starts typing
  await readerOnEvent({ type: 'user', content: 'CLI typed' });
  assert.equal(botInstance.getActiveState().typingActive, true);

  // The turn ends without a final text block: the result event must stop typing
  await readerOnEvent({ type: 'result', subtype: 'success' });
  assert.equal(botInstance.getActiveState().typingActive, false);

  // Result events must not be forwarded as chat text
  assert.equal(sentMessages.length, messagesBefore + 1); // only the CLI user echo

  botInstance.stop();
});

test('plain text is injected with the Telegram user prefix and echo-suppressed', async () => {
  const mockBot = makeBotMock();

  const sentKeys = [];
  const mockTmux = makeTmuxMock({
    sendKeys: async (session, keys, enter) => { sentKeys.push({ session, keys, enter }); }
  });

  const sentMessages = [];
  mockBot.telegram.sendMessage = async (chatId, text) => { sentMessages.push({ chatId, text }); };

  let readerOnEvent = null;
  class MockReader {
    start(projectPath, onEvent) {
      readerOnEvent = onEvent;
    }
    stop() {}
  }

  const botInstance = createBot(defaultTestConfig({ allowedUserIds: ['111'] }), {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });

  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');

  // Telegram text is injected with the prefix and starts typing
  await mockBot.handlers.on.text({ chat: { id: 12345 }, message: { text: 'Hello bot' }, reply: async () => {} });

  assert.equal(sentKeys.length, 1);
  assert.equal(sentKeys[0].keys, 'Telegram user: Hello bot');
  assert.equal(botInstance.getActiveState().typingActive, true);

  // The transcript echo of the injected prompt is suppressed
  const countAfterInject = sentMessages.length;
  await readerOnEvent({ type: 'user', content: 'Telegram user: Hello bot' });
  assert.equal(sentMessages.length, countAfterInject);

  // A locally typed prompt still echoes as CLI user
  await readerOnEvent({ type: 'user', content: 'locally typed' });
  assert.equal(sentMessages.length, countAfterInject + 1);
  assert.equal(sentMessages[sentMessages.length - 1].text, '👤 *CLI User:*\nlocally typed');

  botInstance.stop();
});

test('unmapped slash commands are injected without the Telegram user prefix', async () => {
  const mockBot = makeBotMock();

  const sentKeys = [];
  const mockTmux = makeTmuxMock({
    sendKeys: async (session, keys, enter) => { sentKeys.push({ session, keys, enter }); }
  });

  class MockReader {
    start() {}
    stop() {}
  }

  const botInstance = createBot(defaultTestConfig({ allowedUserIds: ['111'] }), {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });

  // No refreshSkills call: commandMapping stays empty, so /doctor is an unmapped passthrough
  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');

  await mockBot.handlers.on.text({ chat: { id: 12345 }, message: { text: '/doctor' }, reply: async () => {} });

  assert.equal(sentKeys.length, 1);
  assert.equal(sentKeys[0].keys, '/doctor');

  botInstance.stop();
});

test('proj_connect swaps the active session and leaves the old one running', async () => {
  const mockBot = makeBotMock();

  const killed = [];
  const mockTmux = makeTmuxMock({
    sendKeys: async () => {},
    killSession: async (name) => { killed.push(name); }
  });

  const mockProjectManager = {
    listProjects: async () => [
      { name: 'alpha', path: '/tmp/alpha', runningSessions: ['claude-alpha'] },
      { name: 'beta', path: '/tmp/beta', runningSessions: ['claude-beta'] }
    ],
    findProjectBySession: async () => null
  };

  const readers = [];
  class MockReader {
    constructor() { this.startCalls = []; this.stopCalls = 0; readers.push(this); }
    start(projectPath, onEvent, pollIntervalMs, options) { this.startCalls.push({ projectPath, options }); }
    stop() { this.stopCalls++; }
  }

  const botInstance = createBot(defaultTestConfig({ allowedUserIds: ['111'] }), {
    bot: mockBot,
    tmux: mockTmux,
    projectManager: mockProjectManager,
    sessionReaderClass: MockReader
  });

  // Currently connected to alpha
  await botInstance.switchActiveSession('claude-alpha', 111, '/tmp/alpha');
  assert.equal(readers.length, 1);

  const connectHandler = actionHandler(mockBot, 'proj_connect');
  assert.ok(connectHandler, 'proj_connect action handler registered');
  const replies = [];
  const mockCtx = {
    match: ['proj_connect:beta', 'beta'],
    chat: { id: 111 },
    answerCbQuery: async (msg) => { replies.push(`cb:${msg}`); },
    reply: async (text) => { replies.push(text); }
  };

  await connectHandler(mockCtx);

  // Old reader stopped, new reader started on beta's path, alpha never killed
  assert.equal(readers.length, 2);
  assert.equal(readers[0].stopCalls, 1);
  assert.equal(readers[1].startCalls[0].projectPath, '/tmp/beta');
  assert.equal(botInstance.getActiveState().activeSessionName, 'claude-beta');
  assert.deepEqual(killed, []);
  assert.ok(
    replies.some(r => r.includes('claude-beta') && r.includes('claude-alpha')),
    `expected old -> new note, got: ${replies.join(' | ')}`
  );

  botInstance.stop();
});

test('proj_connect answers Session not running when the session died before the tap', async () => {
  const mockBot = makeBotMock();
  const mockTmux = makeTmuxMock({ hasSession: async () => false });
  const mockProjectManager = {
    listProjects: async () => [{ name: 'beta', path: '/tmp/beta', runningSessions: ['claude-beta'] }]
  };

  const botInstance = createBot(defaultTestConfig({ allowedUserIds: ['111'] }), {
    bot: mockBot,
    tmux: mockTmux,
    projectManager: mockProjectManager
  });

  const connectHandler = actionHandler(mockBot, 'proj_connect');
  const cbAnswers = [];
  await connectHandler({
    match: ['proj_connect:beta', 'beta'],
    chat: { id: 111 },
    answerCbQuery: async (m) => cbAnswers.push(m),
    reply: async () => {}
  });

  assert.ok(cbAnswers.includes('Session not running'));
  assert.equal(botInstance.getActiveState().activeSessionName, null);

  botInstance.stop();
});

test('attachExistingSession attaches only when exactly one claude session runs', async () => {
  const mockBot = makeBotMock();

  const readers = [];
  class MockReader {
    constructor() { readers.push(this); }
    start() {}
    stop() {}
  }

  const mockProjectManager = {
    findProjectBySession: async () => ({ name: 'solo', path: '/tmp/solo' })
  };
  const config = defaultTestConfig({ allowedUserIds: ['111'] });

  const one = createBot(config, {
    bot: mockBot,
    tmux: makeTmuxMock({ listSessions: async () => ['claude-solo'] }),
    projectManager: mockProjectManager,
    sessionReaderClass: MockReader
  });
  assert.equal(await one.attachExistingSession(111), 'claude-solo');
  one.stop();

  const two = createBot(config, {
    bot: mockBot,
    tmux: makeTmuxMock({ listSessions: async () => ['claude-a', 'claude-b'] }),
    projectManager: mockProjectManager,
    sessionReaderClass: MockReader
  });
  assert.equal(await two.attachExistingSession(111), null);
  assert.equal(two.getActiveState().activeSessionName, null);
  two.stop();

  const zero = createBot(config, {
    bot: mockBot,
    tmux: makeTmuxMock({ listSessions: async () => [] }),
    projectManager: mockProjectManager,
    sessionReaderClass: MockReader
  });
  assert.equal(await zero.attachExistingSession(111), null);
  zero.stop();
});

test('incoming text to a dead session clears the connection and reports the ended session', async () => {
  const sentMessages = [];
  const mockBot = makeBotMock();
  mockBot.telegram.sendMessage = async (chatId, text) => { sentMessages.push({ chatId, text }); };

  const sentKeys = [];
  const mockTmux = makeTmuxMock({
    hasSession: async () => false, // the connected tmux session died
    sendKeys: async (session, keys, enter) => { sentKeys.push({ session, keys, enter }); }
  });

  const readers = [];
  class MockReader {
    constructor() { this.stopCalls = 0; readers.push(this); }
    start() {}
    stop() { this.stopCalls++; }
  }

  const botInstance = createBot(defaultTestConfig({ allowedUserIds: ['111'] }), {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });
  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');

  // notifySessionDeath sends the notice via bot.telegram.sendMessage
  // (sendWithFallback), not ctx.reply — both reach the same chat.
  await mockBot.handlers.on.text({ chat: { id: 12345 }, message: { text: 'hello' }, reply: async () => {} });

  assert.equal(sentKeys.length, 0, 'no injection into a dead session');
  assert.ok(
    sentMessages.some(m => m.text.includes('🔴 Session ended')),
    `expected ended-session notice, got: ${JSON.stringify(sentMessages)}`
  );
  assert.equal(botInstance.getActiveState().activeSessionName, null, 'connection cleared');
  assert.equal(readers[0].stopCalls, 1, 'reader stopped');

  botInstance.stop();
});

test('typing starts on qa answer, skill_run_now, and skill args completion', async () => {
  const mockBot = makeBotMock();

  const mockTmux = makeTmuxMock();

  let readerOnEvent = null;
  class MockReader {
    start(projectPath, onEvent) { readerOnEvent = onEvent; }
    stop() {}
  }

  const botInstance = createBot(defaultTestConfig({ allowedUserIds: ['111'] }), {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });
  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');

  // refreshSkills returns the cached list; built-in commands are always in it
  const skills = await botInstance.refreshSkills();
  assert.ok(skills.length > 0, 'expected at least one skill/command to be discovered');
  const skill = skills[0];
  const answerQ = actionHandler(mockBot, 'qa:');
  const skillRunNow = actionHandler(mockBot, 'skill_run_now');
  const skillRunArgs = actionHandler(mockBot, 'skill_run_args');

  // Arm the question card, then answer via the qa action (single-choice tap
  // submits immediately and must start typing).
  readerOnEvent({
    type: 'question',
    content: { question: 'Pick one:', options: [{ label: 'A' }, { label: 'B' }] }
  });
  await answerQ({
    match: ['qa:0:1', '0', '1'],
    chat: { id: 12345 },
    answerCbQuery: async () => {},
    reply: async () => {}
  });
  assert.equal(botInstance.getActiveState().typingActive, true, 'answer_q must start typing');
  await readerOnEvent({ type: 'result' }); // stop typing for the next case

  // skill_run_now path
  await skillRunNow({
    match: [`skill_run_now:${skill.hash}`, skill.hash],
    chat: { id: 12345 },
    answerCbQuery: async () => {},
    reply: async () => {}
  });
  assert.equal(botInstance.getActiveState().typingActive, true, 'skill_run_now must start typing');
  await readerOnEvent({ type: 'result' });

  // skill args completion path (skill_run_args arms it, the next text completes it)
  await skillRunArgs({
    match: [`skill_run_args:${skill.hash}`, skill.hash],
    chat: { id: 12345 },
    answerCbQuery: async () => {},
    reply: async () => {}
  });
  await mockBot.handlers.on.text({ chat: { id: 12345 }, message: { text: 'extra args' }, reply: async () => {} });
  assert.equal(botInstance.getActiveState().typingActive, true, 'args completion must start typing');

  botInstance.stop();
});

test('startTyping rebinds to a new chat id instead of staying silent', async () => {
  const chatActions = [];
  const mockBot = makeBotMock();
  mockBot.telegram.sendChatAction = async (chatId, action) => { chatActions.push({ chatId, action }); };

  const mockTmux = makeTmuxMock();

  class MockReader {
    start(projectPath, onEvent) { this.onEvent = onEvent; }
    stop() {}
  }
  let mockReader = null;

  const botInstance = createBot(defaultTestConfig({ allowedUserIds: ['111'] }), {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: function() {
      mockReader = new MockReader();
      return mockReader;
    }
  });
  await botInstance.switchActiveSession('claude-test', 111, '/tmp/proj');

  // Typing already active for chat 111 (text injection starts it)
  await mockBot.handlers.on.text({ chat: { id: 111 }, message: { text: 'hello' }, reply: async () => {} });
  assert.equal(botInstance.getActiveState().typingActive, true);

  // Arm a single-choice question card, then answer from a different chat:
  // the auto-submit must rebind the indicator to that chat.
  mockReader.onEvent({
    type: 'question',
    content: { question: 'Pick one:', options: [{ label: 'A' }, { label: 'B' }] }
  });
  const answerQ = actionHandler(mockBot, 'qa:');
  await answerQ({
    match: ['qa:0:1', '0', '1'],
    chat: { id: 222 },
    answerCbQuery: async () => {},
    reply: async () => {}
  });
  assert.equal(botInstance.getActiveState().typingActive, true, 'typing stays active for the new chat');
  assert.equal(chatActions[chatActions.length - 1].chatId, 222, 'typing indicator rebinds to the new chat id');

  botInstance.stop();
});

test('typing tick detects a dead session, stops typing, and notifies once', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });

  const chatActions = [];
  const sentMessages = [];
  const mockBot = makeBotMock();
  mockBot.telegram.sendChatAction = async (chatId, action) => { chatActions.push({ chatId, action }); };
  mockBot.telegram.sendMessage = async (chatId, text) => { sentMessages.push({ chatId, text }); };

  let alive = true;
  const mockTmux = makeTmuxMock({ hasSession: async () => alive });

  let readerOnEvent = null;
  class MockReader {
    start(projectPath, onEvent) { readerOnEvent = onEvent; }
    stop() {}
  }

  const botInstance = createBot(defaultTestConfig({ allowedUserIds: ['111'] }), {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });
  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');

  const flush = () => new Promise((resolve) => setImmediate(resolve));

  // Typing runs while the session is alive
  await readerOnEvent({ type: 'user', content: 'hi' });
  await flush();
  await flush();
  assert.equal(botInstance.getActiveState().typingActive, true);

  // The session dies; the next 4-second tick must notice
  alive = false;
  t.mock.timers.tick(4000);
  await flush();
  await flush();

  assert.equal(botInstance.getActiveState().typingActive, false, 'typing stops on session death');
  assert.equal(botInstance.getActiveState().activeSessionName, null, 'connection cleared');
  const notices = sentMessages.filter(m => m.text.includes('🔴 Session ended'));
  assert.equal(notices.length, 1, `exactly one death notice, got: ${JSON.stringify(sentMessages)}`);

  botInstance.stop();
  t.mock.timers.reset();
});

test('bridge startup generates the hook settings file next to the hook script', async () => {
  createBot(defaultTestConfig({ allowedUserIds: ['111'] }), { bot: makeBotMock() });

  const bridgeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const settingsPath = path.join(bridgeRoot, 'hooks', 'claude-bridge-settings.generated.json');
  assert.ok(fsSync.existsSync(settingsPath), 'generated settings file must exist at startup');
  const settings = JSON.parse(fsSync.readFileSync(settingsPath, 'utf8'));
  assert.equal(
    settings.hooks.SessionStart[0].hooks[0].command,
    path.join(bridgeRoot, 'hooks', 'claude-session-id-sync.sh')
  );
});

test('enriched /status prints uptime, model, and running sub-agents from the transcript', async () => {
  // Real transcript fixture under a temp claudeHome
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'status-int-'));
  const claudeHome = path.join(tmpDir, '.claude');
  const projectPath = path.resolve(tmpDir, 'proj');
  const projectDir = path.join(claudeHome, 'projects', getProjectSlug(projectPath));
  const boundId = 'sess-fixed-0001';
  const subagentsDir = path.join(projectDir, boundId, 'subagents');
  await fs.mkdir(subagentsDir, { recursive: true });

  const now = Date.now();
  const writeJ = (file, obj) => fs.writeFile(file, JSON.stringify(obj) + '\n');
  await writeJ(path.join(projectDir, `${boundId}.jsonl`), {
    type: 'user', timestamp: new Date(now - 25 * 60_000).toISOString()
  });
  await fs.appendFile(path.join(projectDir, `${boundId}.jsonl`),
    JSON.stringify({
      type: 'assistant', timestamp: new Date(now - 60_000).toISOString(),
      message: { model: 'glm-5.3:cloud' }
    }) + '\n');
  await writeJ(path.join(subagentsDir, 'agent-a1.jsonl'), {
    type: 'assistant', timestamp: new Date(now - 5 * 60_000).toISOString(),
    isSidechain: true,
    message: { model: 'haiku', usage: { input_tokens: 45000, output_tokens: 3000 } }
  });
  await writeJ(path.join(subagentsDir, 'agent-a1.meta.json'), {
    agentType: 'general-purpose', description: 'Fix failing tests'
  });
  const s = (now - 10_000) / 1000;
  await fs.utimes(path.join(projectDir, `${boundId}.jsonl`), s, s);
  await fs.utimes(path.join(subagentsDir, 'agent-a1.jsonl'), s, s);

  const mockBot = makeBotMock();
  const mockTmux = makeTmuxMock({
    hasSession: async () => true,
    getSessionOption: async (session, key) => (key === '@claude_session_id' ? boundId : null)
  });
  class MockReader {
    start() {}
    stop() {}
  }

  const botInstance = createBot(defaultTestConfig({ allowedUserIds: ['111'], projectsDir: tmpDir, claudeHome }), {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });
  await botInstance.switchActiveSession('claude-status-proj', 12345, projectPath);

  const statusHandler = mockBot.handlers.commands.status;
  assert.ok(statusHandler, 'status command handler registered');

  const replies = [];
  await statusHandler({ reply: async (text) => { replies.push(text); } });
  const reply = replies.join('\n');

  assert.match(reply, /`status-proj`/, 'session name shows the folder part only');
  assert.match(reply, /25m/, 'uptime from the first transcript record');
  assert.match(reply, /glm-5\.3:cloud/, 'current model present');
  assert.match(reply, /1 running · 0 finished/, 'running agent line present');
  assert.match(reply, /Fix failing tests/, 'sub-agent label present');

  botInstance.stop();
});

test('/interrupt sends exactly one Escape and stops typing', async () => {
  const escapeCalls = [];
  const mockBot = makeBotMock();

  const mockTmux = makeTmuxMock({
    sendKeys: async () => {},
    sendKeysWithDelay: async (session, keys, delayMs) => {
      escapeCalls.push({ session, keys, delayMs });
    }
  });

  class MockReader {
    start() {}
    stop() {}
  }

  const botInstance = createBot(defaultTestConfig({ allowedUserIds: ['111'] }), {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });
  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');

  // Inject text first so the typing indicator is active before the interrupt
  await mockBot.handlers.on.text({ chat: { id: 12345 }, message: { text: 'hello' }, reply: async () => {} });
  assert.equal(botInstance.getActiveState().typingActive, true, 'typing active before interrupt');

  const interruptHandler = mockBot.handlers.commands.interrupt;
  assert.ok(interruptHandler, 'interrupt command handler registered');

  const replies = [];
  await interruptHandler({ reply: async (text) => { replies.push(text); } });

  assert.equal(escapeCalls.length, 1, 'exactly one key send');
  assert.equal(escapeCalls[0].session, 'claude-test');
  assert.deepEqual(escapeCalls[0].keys, ['Escape']);
  assert.equal(escapeCalls[0].delayMs, 0);
  assert.match(replies.join('\n'), /Interrupt/, 'confirmation reply sent');
  assert.equal(botInstance.getActiveState().typingActive, false, 'typing stopped');

  botInstance.stop();
});

test('/interrupt warns when no session is connected and sends nothing', async () => {
  const escapeCalls = [];
  const mockBot = makeBotMock();

  const mockTmux = makeTmuxMock({
    sendKeysWithDelay: async (session, keys, delayMs) => {
      escapeCalls.push({ session, keys, delayMs });
    }
  });

  const botInstance = createBot(defaultTestConfig(), { bot: mockBot, tmux: mockTmux });

  const interruptHandler = mockBot.handlers.commands.interrupt;
  assert.ok(interruptHandler, 'interrupt command handler registered');

  const replies = [];
  await interruptHandler({ reply: async (text) => { replies.push(text); } });

  assert.ok(replies.some(r => r.includes('No active Claude session')), 'warning reply sent');
  assert.equal(escapeCalls.length, 0, 'no keys sent');
  assert.equal(botInstance.getActiveState().activeSessionName, null);

  botInstance.stop();
});

test('/skills lists project skills from the real worktree path, not the name-derived dir', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'skills-int-'));
  // Orca worktree path: deliberately NOT <projectsDir>/<session-name>
  const tmpProjectDir = await fs.mkdtemp(path.join(tmp, 'worktree-'));
  await makeSkill(path.join(tmpProjectDir, '.claude', 'skills'), 'wt-skill', 'worktree-skill');

  const mockBot = makeBotMock();
  const botInstance = createBot(defaultTestConfig({ allowedUserIds: ['111'] }), {
    bot: mockBot,
    tmux: makeTmuxMock(),
    sessionReaderClass: class { start() {} stop() {} }
  });

  await botInstance.switchActiveSession('claude-test', 12345, tmpProjectDir);
  const skills = await botInstance.refreshSkills();

  assert.ok(
    skills.some(s => s.id === 'skill:worktree-skill' && s.source === 'project'),
    `expected the worktree project skill in the list, got: ${skills.map(s => s.name).join(', ')}`
  );
  assert.equal(botInstance.getActiveState().activeProjectPath, tmpProjectDir);

  botInstance.stop();
  await fs.rm(tmp, { recursive: true, force: true });
});

test('/interrupt clears the question card so later taps expire', async () => {
  const mockBot = makeBotMock();
  const mockTmux = makeTmuxMock();

  let readerOnEvent = null;
  class MockReader {
    start(projectPath, onEvent) { readerOnEvent = onEvent; }
    stop() {}
  }

  const botInstance = createBot(defaultTestConfig({ allowedUserIds: ['111'] }), {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });
  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');

  readerOnEvent({
    type: 'question',
    content: { question: 'Pick one:', options: [{ label: 'A' }, { label: 'B' }] }
  });

  const interruptHandler = mockBot.handlers.commands.interrupt;
  await interruptHandler({ reply: async () => {} });

  const qaHandler = actionHandler(mockBot, 'qa:');
  let cbAnswer = null;
  await qaHandler({
    match: ['qa:0:1', '0', '1'],
    chat: { id: 12345 },
    answerCbQuery: async (msg) => { cbAnswer = msg; },
    reply: async () => {}
  });

  assert.equal(cbAnswer, 'Question expired or not found', 'cleared question card rejects taps');

  botInstance.stop();
});

test('typed /effort with no args opens the effort picker instead of injecting', async () => {
  const sentKeys = [];
  const replies = [];
  const mockBot = makeBotMock();

  const mockTmux = makeTmuxMock({
    sendKeys: async (session, keys, enter) => {
      sentKeys.push({ session, keys, enter });
    }
  });

  const botInstance = createBot(defaultTestConfig(), { bot: mockBot, tmux: mockTmux });
  const { switchActiveSession, refreshSkills } = botInstance;

  await refreshSkills();
  await switchActiveSession('claude-test', 12345);

  const textHandler = mockBot.handlers.on.text;
  assert.ok(textHandler, 'text handler registered');

  // Bare /effort: no injection, picker reply instead.
  await textHandler({
    chat: { id: 12345 },
    message: { text: '/effort' },
    reply: async (text, opts) => { replies.push({ text, opts }); }
  });

  assert.equal(sentKeys.length, 0, 'bare /effort must not inject into tmux');
  assert.equal(replies.length, 1);
  assert.ok(replies[0].opts?.reply_markup?.inline_keyboard, 'picker reply carries an inline keyboard');
  const buttons = replies[0].opts.reply_markup.inline_keyboard.flat();
  const choiceButtons = buttons.filter(b => b.callback_data?.startsWith('skill_choice:'));
  assert.equal(choiceButtons.length, 5);
  // Faster-to-smarter button order, one button per level.
  assert.deepEqual(choiceButtons.map(b => b.text), ['low', 'medium', 'high', 'xhigh', 'max']);

  // /effort high keeps injecting directly — args bypass the picker.
  await textHandler({
    chat: { id: 12345 },
    message: { text: '/effort high' },
    reply: async (text, opts) => { replies.push({ text, opts }); }
  });

  assert.equal(sentKeys.length, 1);
  assert.equal(sentKeys[0].session, 'claude-test');
  assert.equal(sentKeys[0].keys, '/effort high');
  assert.equal(sentKeys[0].enter, true);

  botInstance.stop();
});
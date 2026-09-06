import test from 'node:test';
import assert from 'node:assert/strict';
import { createBot } from '../src/index.js';

test('createBot initializes Telegraf instance with middleware, setMyCommands, and handlers', async () => {
  let commandsSet = null;
  const commandScopes = [];
  const mockBot = {
    use: () => {},
    on: () => {},
    action: () => {},
    command: () => {},
    telegram: {
      setMyCommands: async (cmds, extra) => {
        if (!extra || !extra.scope || extra.scope.type === 'default') {
          commandsSet = cmds;
        }
        commandScopes.push(extra && extra.scope ? extra.scope.type : 'default');
      }
    }
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111', '222'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  const { bot, switchActiveSession, getActiveState } = createBot(config, { bot: mockBot });
  // Allow the fire-and-forget updateBotCommands() loop to finish both scopes
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(bot);
  assert.equal(typeof switchActiveSession, 'function');
  assert.equal(typeof getActiveState, 'function');
  assert.equal(getActiveState().activeSessionName, null);
  assert.ok(Array.isArray(commandsSet));
  assert.equal(commandsSet.length, 5);
  assert.equal(commandsSet[0].command, 'projects');
  // Menu must also be registered for private chats, or stale all_private_chats
  // scoped commands from other tools override the default scope menu.
  assert.ok(commandScopes.includes('all_private_chats'), 'commands registered for all_private_chats scope');
});

test('updateBotCommands logs a warning when Telegram command sync fails', async (t) => {
  const warn = t.mock.method(console, 'warn');
  const mockBot = {
    use: () => {},
    on: () => {},
    action: () => {},
    command: () => {},
    telegram: {
      setMyCommands: async () => {
        throw new Error('network down');
      }
    }
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  createBot(config, { bot: mockBot });
  await new Promise((resolve) => setImmediate(resolve));

  assert.ok(warn.mock.callCount() >= 1, 'expected a warning for failed command sync');
  assert.match(
    warn.mock.calls.map(c => c.arguments.join(' ')).join('\n'),
    /Telegram command sync failed/
  );
});

test('answer_q callback query action injects option key/number into tmux via sendKeys', async () => {
  let actionHandler = null;
  let sentKeys = [];
  const mockBot = {
    use: () => {},
    on: () => {},
    command: () => {},
    action: (regex, handler) => {
      if (regex.toString().includes('answer_q')) {
        actionHandler = handler;
      }
    },
    telegram: {
      setMyCommands: async () => {}
    }
  };

  const mockTmux = {
    hasSession: async () => true,
    capturePane: async () => '',
    sendKeys: async (session, keys, enter) => {
      sentKeys.push({ session, keys, enter });
    }
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111', '222'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  const botInstance = createBot(config, { bot: mockBot, tmux: mockTmux });
  const { switchActiveSession } = botInstance;

  // Activate session
  switchActiveSession('claude-test', 12345);

  assert.ok(actionHandler, 'answer_q action handler registered');

  let answered = false;
  let repliedText = null;
  const mockCtx = {
    match: ['answer_q:2', '2'],
    answerCbQuery: async (msg) => { answered = msg; },
    reply: async (text) => { repliedText = text; }
  };

  await actionHandler(mockCtx);

  assert.equal(sentKeys.length, 1);
  assert.equal(sentKeys[0].session, 'claude-test');
  assert.equal(sentKeys[0].keys, '2');
  assert.equal(sentKeys[0].enter, true);
  assert.ok(answered);
  assert.equal(repliedText, 'Selected option 2');

  botInstance.stop();
});

test('text handler routes direct slash commands to active tmux session', async () => {
  let textHandler = null;
  let sentKeys = [];
  const mockBot = {
    use: () => {},
    on: (evt, handler) => {
      if (evt === 'text') {
        textHandler = handler;
      }
    },
    command: () => {},
    action: () => {},
    telegram: {
      setMyCommands: async () => {}
    }
  };

  const mockTmux = {
    hasSession: async () => true,
    capturePane: async () => '',
    sendKeys: async (session, keys, enter) => {
      sentKeys.push({ session, keys, enter });
    }
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111', '222'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  const botInstance = createBot(config, { bot: mockBot, tmux: mockTmux });
  const { switchActiveSession, refreshSkills } = botInstance;

  await refreshSkills();
  switchActiveSession('claude-test', 12345);

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
  let textHandler = null;
  let sentKeys = [];
  let chatActions = [];
  const mockBot = {
    use: () => {},
    on: (evt, handler) => {
      if (evt === 'text') textHandler = handler;
    },
    command: () => {},
    action: () => {},
    telegram: {
      setMyCommands: async () => {},
      sendChatAction: async (chatId, action) => {
        chatActions.push({ chatId, action });
      }
    }
  };

  const mockTmux = {
    listSessions: async (prefix) => ['claude-auto-project'],
    hasSession: async () => true,
    sendKeys: async (session, keys, enter) => {
      sentKeys.push({ session, keys, enter });
    }
  };

  const mockProjectManager = {
    findProjectBySession: async () => ({ name: 'auto-project', path: '/tmp/auto-project' })
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  const botInstance = createBot(config, {
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

  await textHandler(mockCtx);

  assert.equal(sentKeys.length, 1);
  assert.equal(sentKeys[0].session, 'claude-auto-project');
  assert.equal(sentKeys[0].keys, 'Telegram user: Hello from Telegram');
  assert.ok(replies.some(r => r.includes('Auto-connected to active session')));
  assert.ok(chatActions.some(a => a.action === 'typing'));

  botInstance.stop();
});

test('switchActiveSession binds the reader to the tmux session id option', async () => {
  const mockBot = {
    use: () => {},
    on: () => {},
    command: () => {},
    action: () => {},
    telegram: { setMyCommands: async () => {} }
  };

  const optionCalls = [];
  const mockTmux = {
    getSessionOption: async (session, key) => {
      optionCalls.push({ session, key });
      return 'sid-uuid-1';
    }
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

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

  const botInstance = createBot(config, {
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
  const mockBot = {
    use: () => {},
    on: () => {},
    command: () => {},
    action: () => {},
    telegram: { setMyCommands: async () => {} }
  };

  const mockTmux = {
    getSessionOption: async () => null
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

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

  const botInstance = createBot(config, {
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
  const mockBot = {
    use: () => {},
    on: () => {},
    command: () => {},
    action: () => {},
    telegram: {
      setMyCommands: async () => {},
      sendChatAction: async () => {},
      sendMessage: async () => {}
    }
  };

  const mockTmux = {
    getSessionOption: async () => null
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  const sentMessages = [];
  mockBot.telegram.sendMessage = async (chatId, text) => { sentMessages.push({ chatId, text }); };

  let readerOnEvent = null;
  class MockReader {
    start(projectPath, onEvent) {
      readerOnEvent = onEvent;
    }
    stop() {}
  }

  const botInstance = createBot(config, {
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
  let textHandler = null;
  const mockBot = {
    use: () => {},
    on: (evt, handler) => {
      if (evt === 'text') textHandler = handler;
    },
    command: () => {},
    action: () => {},
    telegram: {
      setMyCommands: async () => {},
      sendChatAction: async () => {},
      sendMessage: async () => {}
    }
  };

  const sentKeys = [];
  const mockTmux = {
    getSessionOption: async () => null,
    sendKeys: async (session, keys, enter) => { sentKeys.push({ session, keys, enter }); }
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  const sentMessages = [];
  mockBot.telegram.sendMessage = async (chatId, text) => { sentMessages.push({ chatId, text }); };

  let readerOnEvent = null;
  class MockReader {
    start(projectPath, onEvent) {
      readerOnEvent = onEvent;
    }
    stop() {}
  }

  const botInstance = createBot(config, {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });

  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');

  // Telegram text is injected with the prefix and starts typing
  await textHandler({ chat: { id: 12345 }, message: { text: 'Hello bot' }, reply: async () => {} });

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
  let textHandler = null;
  const mockBot = {
    use: () => {},
    on: (evt, handler) => {
      if (evt === 'text') textHandler = handler;
    },
    command: () => {},
    action: () => {},
    telegram: {
      setMyCommands: async () => {},
      sendChatAction: async () => {}
    }
  };

  const sentKeys = [];
  const mockTmux = {
    getSessionOption: async () => null,
    sendKeys: async (session, keys, enter) => { sentKeys.push({ session, keys, enter }); }
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  class MockReader {
    start() {}
    stop() {}
  }

  const botInstance = createBot(config, {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });

  // No refreshSkills call: commandMapping stays empty, so /doctor is an unmapped passthrough
  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');

  await textHandler({ chat: { id: 12345 }, message: { text: '/doctor' }, reply: async () => {} });

  assert.equal(sentKeys.length, 1);
  assert.equal(sentKeys[0].keys, '/doctor');

  botInstance.stop();
});

test('proj_connect swaps the active session and leaves the old one running', async () => {
  let connectHandler = null;
  const mockBot = {
    use: () => {},
    on: () => {},
    command: () => {},
    action: (regex, handler) => {
      if (regex.toString().includes('proj_connect')) connectHandler = handler;
    },
    telegram: { setMyCommands: async () => {} }
  };

  const killed = [];
  const mockTmux = {
    hasSession: async () => true,
    getSessionOption: async () => null,
    sendKeys: async () => {},
    killSession: async (name) => { killed.push(name); }
  };

  const mockProjectManager = {
    listProjects: async () => [
      { name: 'alpha', path: '/tmp/alpha', runningSessions: ['claude-alpha'] },
      { name: 'beta', path: '/tmp/beta', runningSessions: ['claude-beta'] }
    ],
    findProjectBySession: async () => null
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  const readers = [];
  class MockReader {
    constructor() { this.startCalls = []; this.stopCalls = 0; readers.push(this); }
    start(projectPath, onEvent, pollIntervalMs, options) { this.startCalls.push({ projectPath, options }); }
    stop() { this.stopCalls++; }
  }

  const botInstance = createBot(config, {
    bot: mockBot,
    tmux: mockTmux,
    projectManager: mockProjectManager,
    sessionReaderClass: MockReader
  });

  // Currently connected to alpha
  await botInstance.switchActiveSession('claude-alpha', 111, '/tmp/alpha');
  assert.equal(readers.length, 1);

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
  let connectHandler = null;
  const mockBot = {
    use: () => {},
    on: () => {},
    command: () => {},
    action: (regex, handler) => {
      if (regex.toString().includes('proj_connect')) connectHandler = handler;
    },
    telegram: { setMyCommands: async () => {} }
  };

  const mockTmux = { hasSession: async () => false };
  const mockProjectManager = {
    listProjects: async () => [{ name: 'beta', path: '/tmp/beta', runningSessions: ['claude-beta'] }]
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  const botInstance = createBot(config, {
    bot: mockBot,
    tmux: mockTmux,
    projectManager: mockProjectManager
  });

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

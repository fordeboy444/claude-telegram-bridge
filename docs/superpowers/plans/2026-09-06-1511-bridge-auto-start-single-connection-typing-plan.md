# Bridge Auto-Start, Single-Connection Swap, and Typing Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start the bridge daemon automatically with Claude Code, let `/projects` swap the active connection to any running session, and make the typing indicator start on every injection and never stick.

**Architecture:** Minimal extension of existing files (spec approach A). Two bash hook scripts own the daemon lifecycle through a single-owner PID file. `src/index.js` gains one new Telegram action handler, one session-death notifier, and typing hardening. `src/projects/menu.js` gains a Connect button. No new runtime modules.

**Tech Stack:** Node.js 24 (ES Modules), Telegraf 4, Node native test runner (`npm test` → `node --test test/*.test.js`; `t.mock.timers` available), bash hook scripts, tmux through `wsl tmux` on Windows.

**Spec:** `docs/superpowers/specs/2026-09-06-1501-bridge-auto-start-single-connection-typing-design.md`

**Date + time:** 2026-09-06 15:11

## Global Constraints

- Approach A from the spec: extend existing files. The only new files are the two hook scripts.
- tmux sessions never stop with the daemon. Only the bridge connection rebinds.
- Typing resend interval stays 4000 ms (Telegram typing status lasts ~5 s; clients clear it when a bot message arrives — core.telegram.org/bots/api#sendchataction).
- Exact strings from the spec:
  - Death message: `🔴 Session ended. Use /projects.`
  - Dead-tap callback answer: `Session not running`
  - Swap reply: `🔌 Connected to <new> (was <old>)`
- ⚠️ Spec discrepancy: the spec's Files table names `claude-telegram-bridge/test/projects_menu.test.js`. That file does not exist. Menu tests live at the end of `claude-telegram-bridge/test/project_manager.test.js`. This plan targets the real file.
- No changes to `claude-code-telegram-main/` or `antigravity-telegram-suite-main/`. No ConnectionManager extraction. `src/tmux/monitor.js` and `test/monitor.test.js` stay untouched.
- `.claude/settings.local.json` is TRACKED (it already sits in git history) and contains an auth token. Edit it in place, but never stage or commit the edit — task commits use explicit paths only.
- Test commands (run from `claude-telegram-bridge/`): full suite `npm test`; single file `node --test test/integration.test.js`.
- Commit to the current branch `feat/claude-telegram-bridge`.

## File Structure

| Action | Path | Responsibility |
|---|---|---|
| Create | `.claude/hooks/telegram-bridge-start.sh` | SessionStart: start daemon when absent, write PID file |
| Create | `.claude/hooks/telegram-bridge-stop.sh` | SessionEnd: kill the PID-owned daemon, delete PID file |
| Modify | `.claude/settings.local.json` | Register both hooks with absolute paths |
| Modify | `claude-telegram-bridge/src/index.js` | proj_connect action, attach rule, liveness, typing hardening, dead-code removal |
| Modify | `claude-telegram-bridge/src/projects/menu.js` | Connect button for running projects |
| Modify | `claude-telegram-bridge/test/project_manager.test.js` | Connect button test |
| Modify | `claude-telegram-bridge/test/integration.test.js` | Swap, liveness, and typing tests |
| Delete | `.claude/skills/telegram-bridge-connect/` | Replaced by auto-start |
| Delete | `.claude/skills/telegram-bridge-disconnect/` | Replaced by the SessionEnd hook |
| Modify | `.claude/skills/telegram-bridge-setup/SKILL.md` and `scripts/setup.sh` | Closing line: bridge starts automatically |
| Update | `.claude/memory/bridge-daemon-lifecycle-management.md`, `.claude/memory/bridge-session-binding.md`, `.claude/memory/MEMORY.md` | Memory shows current state (no stale skill mentions) |

---

### Task 1: Connect Button in the Project Action View

**Files:**
- Modify: `claude-telegram-bridge/src/projects/menu.js:41-51`
- Test: `claude-telegram-bridge/test/project_manager.test.js` (test `buildProjectActionView renders appropriate buttons based on running status`, currently at the end of the file)

**Interfaces:**
- Consumes: nothing new.
- Produces: for a running project, the view contains a button `{ text: '🟢 Connect', callback_data: `proj_connect:${project.name}` }`. Task 2 handles this callback data.

- [ ] **Step 1: Write the failing test**

In `claude-telegram-bridge/test/project_manager.test.js`, replace the whole test `buildProjectActionView renders appropriate buttons based on running status` with:

```js
test('buildProjectActionView renders appropriate buttons based on running status', () => {
  const idleProj = { name: 'mobile-app', path: '/projects/mobile-app', runningSessions: [] };
  const idleView = buildProjectActionView(idleProj);
  assert.ok(idleView.text.includes('mobile-app'));
  assert.ok(idleView.text.includes('No active current session'));
  const idleButtons = idleView.reply_markup.inline_keyboard.flat();
  assert.ok(idleButtons.some(b => b.text.includes('Start Session')));
  assert.ok(!idleButtons.some(b => b.text.includes('Kill Current Session')));
  assert.ok(!idleButtons.some(b => b.text.includes('Connect')), 'idle project must not offer Connect');

  const runningProj = { name: 'web-backend', path: '/projects/web-backend', runningSessions: ['claude-web-backend'] };
  const runningView = buildProjectActionView(runningProj);
  assert.ok(runningView.text.includes('Active (Session: claude-web-backend)'));
  const runningButtons = runningView.reply_markup.inline_keyboard.flat();
  assert.ok(runningButtons.some(b => b.text.includes('Kill Current Session')));
  const connectButton = runningButtons.find(b => b.text.includes('Connect'));
  assert.ok(connectButton, 'running project must offer Connect');
  assert.equal(connectButton.callback_data, 'proj_connect:web-backend');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd claude-telegram-bridge && node --test test/project_manager.test.js`
Expected: FAIL — `running project must offer Connect` / `connectButton` is undefined.

- [ ] **Step 3: Write the minimal implementation**

In `claude-telegram-bridge/src/projects/menu.js`, replace the `if (isRunning) { ... } else { ... }` block inside `buildProjectActionView` with:

```js
  if (isRunning) {
    keyboard.push([
      { text: '🟢 Connect', callback_data: `proj_connect:${project.name}` }
    ]);
    keyboard.push([
      { text: '🛑 Kill Current Session', callback_data: `proj_kill:${project.name}` }
    ]);
  } else {
    keyboard.push([
      { text: '🚀 Start Session', callback_data: `proj_start:${project.name}` }
    ]);
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd claude-telegram-bridge && node --test test/project_manager.test.js`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Run the full suite**

Run: `cd claude-telegram-bridge && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add claude-telegram-bridge/src/projects/menu.js claude-telegram-bridge/test/project_manager.test.js
git commit -m "feat(bridge): add Connect button for running projects in project action view"
```

---

### Task 2: `proj_connect` Action Handler

**Files:**
- Modify: `claude-telegram-bridge/src/index.js` (insert a new `bot.action(/proj_connect:(.+)/, ...)` between the `proj_start` action and the `proj_kill` action)
- Test: `claude-telegram-bridge/test/integration.test.js` (append two tests)

**Interfaces:**
- Consumes: callback data `proj_connect:<name>` from Task 1; existing `switchActiveSession(sessionName, chatId, projectPath)`.
- Produces: handler rebinds the active session and replies `🔌 Connected to <new> (was <old>)`; dead-tap answers the callback with `Session not running`.

- [ ] **Step 1: Write the failing tests**

Append to `claude-telegram-bridge/test/integration.test.js`:

```js
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd claude-telegram-bridge && node --test test/integration.test.js`
Expected: FAIL — `connectHandler` is null (`proj_connect action handler registered` assertion fails).

- [ ] **Step 3: Write the minimal implementation**

In `claude-telegram-bridge/src/index.js`, insert between the `proj_start` action block and the `proj_kill` action block:

```js
  bot.action(/proj_connect:(.+)/, async (ctx) => {
    const projectName = ctx.match[1];
    const projects = await projectManager.listProjects();
    const proj = projects.find(p => p.name === projectName || p.displayName === projectName);
    if (!proj) return ctx.answerCbQuery('Project not found');

    // The button only renders for running projects; re-check liveness for the
    // gap between menu render and tap.
    const sessionName = proj.runningSessions && proj.runningSessions[0];
    if (!sessionName || !(await tmux.hasSession(sessionName))) {
      return ctx.answerCbQuery('Session not running');
    }

    const previous = activeSessionName;
    await switchActiveSession(sessionName, ctx.chat.id, proj.path);
    await ctx.answerCbQuery(`Connected to ${sessionName}`);
    await ctx.reply(
      `🔌 Connected to ${sessionName}${previous && previous !== sessionName ? ` (was ${previous})` : ''}`
    );
  });
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd claude-telegram-bridge && node --test test/integration.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `cd claude-telegram-bridge && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add claude-telegram-bridge/src/index.js claude-telegram-bridge/test/integration.test.js
git commit -m "feat(bridge): swap active session to a running project via proj_connect"
```

---

### Task 3: `attachExistingSession` Binds Exactly One Session

**Files:**
- Modify: `claude-telegram-bridge/src/index.js` (`attachExistingSession` in the returned object, near the bottom)
- Test: `claude-telegram-bridge/test/integration.test.js` (append one test)

**Interfaces:**
- Consumes: existing `switchActiveSession`, `tmux.listSessions('claude-')`.
- Produces: `attachExistingSession(chatId)` returns the session name only when exactly one `claude-*` session runs; returns `null` for zero or several.

- [ ] **Step 1: Write the failing test**

Append to `claude-telegram-bridge/test/integration.test.js`:

```js
test('attachExistingSession attaches only when exactly one claude session runs', async () => {
  const mockBot = {
    use: () => {},
    on: () => {},
    command: () => {},
    action: () => {},
    telegram: { setMyCommands: async () => {} }
  };

  const readers = [];
  class MockReader {
    constructor() { readers.push(this); }
    start() {}
    stop() {}
  }

  const makeTmux = (sessions) => ({
    listSessions: async () => sessions,
    getSessionOption: async () => null
  });
  const mockProjectManager = {
    findProjectBySession: async () => ({ name: 'solo', path: '/tmp/solo' })
  };
  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  // Exactly one session: attaches
  const one = createBot(config, {
    bot: mockBot,
    tmux: makeTmux(['claude-solo']),
    projectManager: mockProjectManager,
    sessionReaderClass: MockReader
  });
  assert.equal(await one.attachExistingSession(111), 'claude-solo');
  one.stop();

  // Two sessions: attaches none, the user picks via /projects
  const two = createBot(config, {
    bot: mockBot,
    tmux: makeTmux(['claude-a', 'claude-b']),
    projectManager: mockProjectManager,
    sessionReaderClass: MockReader
  });
  assert.equal(await two.attachExistingSession(111), null);
  assert.equal(two.getActiveState().activeSessionName, null);
  two.stop();

  // Zero sessions: null
  const zero = createBot(config, {
    bot: mockBot,
    tmux: makeTmux([]),
    projectManager: mockProjectManager,
    sessionReaderClass: MockReader
  });
  assert.equal(await zero.attachExistingSession(111), null);
  zero.stop();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd claude-telegram-bridge && node --test test/integration.test.js`
Expected: FAIL — the two-session case returns `'claude-a'` instead of `null`.

- [ ] **Step 3: Write the minimal implementation**

In `claude-telegram-bridge/src/index.js`, replace the body of `attachExistingSession`:

```js
    async attachExistingSession(chatId) {
      const sessions = await tmux.listSessions('claude-');
      // Attach only when exactly one session runs. With several sessions the
      // user picks via /projects; blind picks stream the wrong project.
      if (sessions.length !== 1) return null;
      const sessionName = sessions[0];
      const project = await projectManager.findProjectBySession(sessionName);
      await switchActiveSession(sessionName, chatId, project?.path);
      return sessionName;
    },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd claude-telegram-bridge && node --test test/integration.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `cd claude-telegram-bridge && npm test`
Expected: PASS. (The daemon auto-attach at the bottom of `src/index.js` keeps calling `attachExistingSession`; with more than one session it now returns null and logs nothing — intended.)

- [ ] **Step 6: Commit**

```bash
git add claude-telegram-bridge/src/index.js claude-telegram-bridge/test/integration.test.js
git commit -m "fix(bridge): attachExistingSession binds only one running session"
```

---

### Task 4: Text-Path Liveness Check and Session-Death Notifier

**Files:**
- Modify: `claude-telegram-bridge/src/index.js` (new helpers after `stopTyping`; three call sites in the text handler)
- Test: `claude-telegram-bridge/test/integration.test.js` (append one test)

**Interfaces:**
- Consumes: existing `switchActiveSession(null, null, null)` clears the connection and stops typing + reader.
- Produces: internal helpers `notifySessionDeath(chatId)` and `ensureSessionAlive(ctx)` — Task 6 reuses `notifySessionDeath`. Death message: `🔴 Session ended. Use /projects.`

- [ ] **Step 1: Write the failing test**

Append to `claude-telegram-bridge/test/integration.test.js`:

```js
test('incoming text to a dead session clears the connection and reports the ended session', async () => {
  let textHandler = null;
  const sentMessages = [];
  const mockBot = {
    use: () => {},
    on: (evt, handler) => { if (evt === 'text') textHandler = handler; },
    command: () => {},
    action: () => {},
    telegram: {
      setMyCommands: async () => {},
      sendChatAction: async () => {},
      sendMessage: async (chatId, text) => { sentMessages.push({ chatId, text }); }
    }
  };

  const sentKeys = [];
  const mockTmux = {
    hasSession: async () => false, // the connected tmux session died
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

  const readers = [];
  class MockReader {
    constructor() { this.stopCalls = 0; readers.push(this); }
    start() {}
    stop() { this.stopCalls++; }
  }

  const botInstance = createBot(config, {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });
  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');

  // notifySessionDeath sends the notice via bot.telegram.sendMessage
  // (sendWithFallback), not ctx.reply — both reach the same chat.
  await textHandler({ chat: { id: 12345 }, message: { text: 'hello' }, reply: async () => {} });

  assert.equal(sentKeys.length, 0, 'no injection into a dead session');
  assert.ok(
    sentMessages.some(m => m.text.includes('🔴 Session ended')),
    `expected ended-session notice, got: ${JSON.stringify(sentMessages)}`
  );
  assert.equal(botInstance.getActiveState().activeSessionName, null, 'connection cleared');
  assert.equal(readers[0].stopCalls, 1, 'reader stopped');

  botInstance.stop();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd claude-telegram-bridge && node --test test/integration.test.js`
Expected: FAIL — keys were sent into the dead session and no `🔴 Session ended` notice exists.

- [ ] **Step 3: Write the minimal implementation**

In `claude-telegram-bridge/src/index.js`, add these helpers directly after `stopTyping()`:

```js
  // A dead tmux session must never receive injections or keep the typing
  // indicator alive. One path clears the connection and reports the death.
  async function notifySessionDeath(chatId) {
    if (!activeSessionName) return; // already cleared: no double notification
    switchActiveSession(null, null, null); // stops typing + reader, clears connection
    if (chatId) {
      await sendWithFallback(bot, chatId, '🔴 Session ended. Use /projects.');
    }
  }

  async function ensureSessionAlive(ctx) {
    if (!activeSessionName) return true;
    let alive = true;
    try {
      alive = await tmux.hasSession(activeSessionName);
    } catch {
      alive = true; // cannot check: let the sendKeys path surface real errors
    }
    if (alive) return true;
    await notifySessionDeath(ctx.chat.id);
    return false;
  }
```

Then add the guard at the three injection sites inside the `bot.on('text', ...)` handler:

a) `pendingArgsSkill` completion — replace:

```js
      if (!activeSessionName) {
        return ctx.reply('⚠️ No active Claude session. Use /projects to start one.');
      }
      await tmux.sendKeys(activeSessionName, fullCommand, true);
```

with:

```js
      if (!activeSessionName) {
        return ctx.reply('⚠️ No active Claude session. Use /projects to start one.');
      }
      if (!(await ensureSessionAlive(ctx))) return;
      await tmux.sendKeys(activeSessionName, fullCommand, true);
```

b) Mapped slash command — replace:

```js
        if (!activeSessionName) {
          return ctx.reply('⚠️ No active Claude session. Use /projects to start one first.');
        }
        const fullCmd = args ? `${matchedSkill.command} ${args}` : matchedSkill.command;
        await tmux.sendKeys(activeSessionName, fullCmd, true);
```

with:

```js
        if (!activeSessionName) {
          return ctx.reply('⚠️ No active Claude session. Use /projects to start one first.');
        }
        if (!(await ensureSessionAlive(ctx))) return;
        const fullCmd = args ? `${matchedSkill.command} ${args}` : matchedSkill.command;
        await tmux.sendKeys(activeSessionName, fullCmd, true);
```

c) Conversational text — replace:

```js
    const injectText = text.startsWith('/') ? text : `Telegram user: ${text}`;
    lastInjectedPrompt = injectText;
```

with:

```js
    if (!(await ensureSessionAlive(ctx))) return;
    const injectText = text.startsWith('/') ? text : `Telegram user: ${text}`;
    lastInjectedPrompt = injectText;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd claude-telegram-bridge && node --test test/integration.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `cd claude-telegram-bridge && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add claude-telegram-bridge/src/index.js claude-telegram-bridge/test/integration.test.js
git commit -m "feat(bridge): report dead sessions on incoming text and clear connection"
```

---

### Task 5: Typing on Every Injection Point + Chat Rebind

**Files:**
- Modify: `claude-telegram-bridge/src/index.js` (`startTyping`/`stopTyping`, `answer_q` action, `skill_run_now` action, `pendingArgsSkill` completion)
- Test: `claude-telegram-bridge/test/integration.test.js` (append two tests)

**Interfaces:**
- Consumes: `ensureSessionAlive` from Task 4 (the args-completion path already calls it).
- Produces: `startTyping(chatId)` rebinds when `chatId` changes. Typing starts on: text forward (already), `answer_q`, `skill_run_now`, `pendingArgsSkill` completion. State var `typingChatId` — Task 6 keeps it.

- [ ] **Step 1: Write the failing tests**

Append to `claude-telegram-bridge/test/integration.test.js`:

```js
test('typing starts on answer_q, skill_run_now, and skill args completion', async () => {
  const handlers = {};
  const mockBot = {
    use: () => {},
    on: (evt, handler) => { if (evt === 'text') handlers.text = handler; },
    command: () => {},
    action: (regex, handler) => {
      const key = regex.toString();
      if (key.includes('answer_q')) handlers.answerQ = handler;
      if (key.includes('skill_run_now')) handlers.skillRunNow = handler;
      if (key.includes('skill_run_args')) handlers.skillRunArgs = handler;
    },
    telegram: { setMyCommands: async () => {}, sendChatAction: async () => {} }
  };

  const mockTmux = {
    hasSession: async () => true,
    getSessionOption: async () => null,
    sendKeys: async () => {}
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  let readerOnEvent = null;
  class MockReader {
    start(projectPath, onEvent) { readerOnEvent = onEvent; }
    stop() {}
  }

  const botInstance = createBot(config, {
    bot: mockBot,
    tmux: mockTmux,
    sessionReaderClass: MockReader
  });
  await botInstance.switchActiveSession('claude-test', 12345, '/tmp/proj');

  // refreshSkills returns the cached list; built-in commands are always in it
  const skills = await botInstance.refreshSkills();
  assert.ok(skills.length > 0, 'expected at least one skill/command to be discovered');
  const skill = skills[0];

  // answer_q path
  await handlers.answerQ({
    match: ['answer_q:2', '2'],
    chat: { id: 12345 },
    answerCbQuery: async () => {},
    reply: async () => {}
  });
  assert.equal(botInstance.getActiveState().typingActive, true, 'answer_q must start typing');
  await readerOnEvent({ type: 'result' }); // stop typing for the next case

  // skill_run_now path
  await handlers.skillRunNow({
    match: [`skill_run_now:${skill.id}`, skill.id],
    chat: { id: 12345 },
    answerCbQuery: async () => {},
    reply: async () => {}
  });
  assert.equal(botInstance.getActiveState().typingActive, true, 'skill_run_now must start typing');
  await readerOnEvent({ type: 'result' });

  // skill args completion path (skill_run_args arms it, the next text completes it)
  await handlers.skillRunArgs({
    match: [`skill_run_args:${skill.id}`, skill.id],
    chat: { id: 12345 },
    answerCbQuery: async () => {},
    reply: async () => {}
  });
  await handlers.text({ chat: { id: 12345 }, message: { text: 'extra args' }, reply: async () => {} });
  assert.equal(botInstance.getActiveState().typingActive, true, 'args completion must start typing');

  botInstance.stop();
});

test('startTyping rebinds to a new chat id instead of staying silent', async () => {
  const handlers = {};
  const chatActions = [];
  const mockBot = {
    use: () => {},
    on: (evt, handler) => { if (evt === 'text') handlers.text = handler; },
    command: () => {},
    action: (regex, handler) => {
      if (regex.toString().includes('answer_q')) handlers.answerQ = handler;
    },
    telegram: {
      setMyCommands: async () => {},
      sendChatAction: async (chatId, action) => { chatActions.push({ chatId, action }); }
    }
  };

  const mockTmux = {
    hasSession: async () => true,
    getSessionOption: async () => null,
    sendKeys: async () => {}
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
  await botInstance.switchActiveSession('claude-test', 111, '/tmp/proj');

  // Typing already active for chat 111 (text injection starts it)
  await handlers.text({ chat: { id: 111 }, message: { text: 'hello' }, reply: async () => {} });
  assert.equal(botInstance.getActiveState().typingActive, true);

  // An answer from a different chat must rebind the indicator to that chat
  await handlers.answerQ({
    match: ['answer_q:1', '1'],
    chat: { id: 222 },
    answerCbQuery: async () => {},
    reply: async () => {}
  });
  assert.equal(botInstance.getActiveState().typingActive, true, 'typing stays active for the new chat');
  assert.equal(chatActions[chatActions.length - 1].chatId, 222, 'typing indicator rebinds to the new chat id');

  botInstance.stop();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd claude-telegram-bridge && node --test test/integration.test.js`
Expected: FAIL — `answer_q must start typing` (typing never starts on that path); the rebind case fails on `chatActions[...].chatId` still being `111`.

- [ ] **Step 3: Write the minimal implementation**

In `claude-telegram-bridge/src/index.js`:

a) Add the state var next to `typingTimer`:

```js
  let typingTimer = null;
  let typingChatId = null;
```

b) Replace `startTyping` and `stopTyping`:

```js
  function startTyping(chatId) {
    if (!chatId) return;
    // A new chat id rebinds the indicator; the same chat keeps its rhythm.
    if (typingTimer) {
      if (typingChatId === chatId) return;
      clearInterval(typingTimer);
    }
    typingChatId = chatId;
    const sendTyping = () => {
      bot.telegram.sendChatAction(chatId, 'typing').catch(() => {});
    };
    sendTyping();
    typingTimer = setInterval(sendTyping, 4000);
    if (typingTimer.unref) typingTimer.unref();
  }

  function stopTyping() {
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }
    typingChatId = null;
  }
```

c) In the `answer_q` action, add typing before the injection:

```js
  bot.action(/answer_q:(\d+)/, async (ctx) => {
    const optionNumber = ctx.match[1];
    if (activeSessionName) {
      startTyping(ctx.chat?.id);
      await tmux.sendKeys(activeSessionName, optionNumber, true);
      await ctx.answerCbQuery(`Selected option ${optionNumber}`);
      await ctx.reply(`Selected option ${optionNumber}`);
    } else {
      await ctx.answerCbQuery('No active session');
    }
  });
```

d) In the `skill_run_now` action, add typing after the no-session guard:

```js
    if (!activeSessionName) {
      return ctx.reply('⚠️ No active Claude session. Use /projects to start one first.');
    }

    startTyping(ctx.chat?.id);
    await tmux.sendKeys(activeSessionName, skill.command, true);
    await ctx.answerCbQuery(`Running ${skill.name}...`);
    await ctx.reply(`⚡ Injected \`${skill.command}\` into \`${activeSessionName}\``, { parse_mode: 'Markdown' });
```

e) In the `pendingArgsSkill` completion path (Task 4 added the liveness guard), add typing before the injection:

```js
      if (!(await ensureSessionAlive(ctx))) return;
      startTyping(ctx.chat.id);
      await tmux.sendKeys(activeSessionName, fullCommand, true);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd claude-telegram-bridge && node --test test/integration.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `cd claude-telegram-bridge && npm test`
Expected: PASS. (The pre-existing `answer_q` test's mock ctx has no `chat`; `ctx.chat?.id` is `undefined` and `startTyping` no-ops — that test still passes.)

- [ ] **Step 6: Commit**

```bash
git add claude-telegram-bridge/src/index.js claude-telegram-bridge/test/integration.test.js
git commit -m "feat(bridge): typing indicator on every injection point with chat rebind"
```

---

### Task 6: Liveness Check Inside the Typing Tick

**Files:**
- Modify: `claude-telegram-bridge/src/index.js` (`startTyping` — the `sendTyping` closure becomes async)
- Test: `claude-telegram-bridge/test/integration.test.js` (append one test)

**Interfaces:**
- Consumes: `notifySessionDeath(chatId)` from Task 4; `typingTimer`/`typingChatId` state from Task 5.
- Produces: every 4-second typing resend also checks `tmux.hasSession(activeSessionName)`. On death: typing stops, the reader stops, the connection clears, and `🔴 Session ended. Use /projects.` is sent once.

- [ ] **Step 1: Write the failing test**

Append to `claude-telegram-bridge/test/integration.test.js`:

```js
test('typing tick detects a dead session, stops typing, and notifies once', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });

  const chatActions = [];
  const sentMessages = [];
  const mockBot = {
    use: () => {},
    on: () => {},
    command: () => {},
    action: () => {},
    telegram: {
      setMyCommands: async () => {},
      sendChatAction: async (chatId, action) => { chatActions.push({ chatId, action }); },
      sendMessage: async (chatId, text) => { sentMessages.push({ chatId, text }); }
    }
  };

  let alive = true;
  const mockTmux = {
    hasSession: async () => alive,
    getSessionOption: async () => null
  };

  const config = {
    botToken: '123456:TEST_TOKEN',
    allowedUserIds: ['111'],
    projectsDir: process.cwd(),
    tmuxPath: 'tmux',
    pollIntervalMs: 1000
  };

  let readerOnEvent = null;
  class MockReader {
    start(projectPath, onEvent) { readerOnEvent = onEvent; }
    stop() {}
  }

  const botInstance = createBot(config, {
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
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd claude-telegram-bridge && node --test test/integration.test.js`
Expected: FAIL — after `tick(4000)` the typing state stays `true` and no death notice exists.

- [ ] **Step 3: Write the minimal implementation**

In `claude-telegram-bridge/src/index.js`, replace the `sendTyping` closure inside `startTyping` (keep the rebind logic from Task 5):

```js
  function startTyping(chatId) {
    if (!chatId) return;
    // A new chat id rebinds the indicator; the same chat keeps its rhythm.
    if (typingTimer) {
      if (typingChatId === chatId) return;
      clearInterval(typingTimer);
    }
    typingChatId = chatId;
    // Every 4-second resend also checks that the connected tmux session is
    // still alive: a dead session must not leave the indicator stuck.
    const sendTyping = async () => {
      if (activeSessionName) {
        let alive = true;
        try {
          alive = await tmux.hasSession(activeSessionName);
        } catch {
          alive = true; // cannot check: keep typing until a hard failure
        }
        if (!alive) {
          await notifySessionDeath(chatId);
          return;
        }
      }
      bot.telegram.sendChatAction(chatId, 'typing').catch(() => {});
    };
    sendTyping();
    typingTimer = setInterval(sendTyping, 4000);
    if (typingTimer.unref) typingTimer.unref();
  }
```

Note: the `try/catch` around `hasSession` is required because several existing tests inject a `mockTmux` without a `hasSession` method; a raw call would throw an unhandled rejection inside the interval.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd claude-telegram-bridge && node --test test/integration.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `cd claude-telegram-bridge && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add claude-telegram-bridge/src/index.js claude-telegram-bridge/test/integration.test.js
git commit -m "feat(bridge): typing tick detects dead sessions within one interval"
```

---

### Task 7: Remove Dead Monitor Code from `index.js`

**Files:**
- Modify: `claude-telegram-bridge/src/index.js` (five removals, no behavior change)

**Interfaces:**
- Consumes: nothing.
- Produces: `src/index.js` no longer imports `TmuxMonitor` or `cleanTerminalOutput`, and no longer holds `activeMonitor` state. `src/tmux/monitor.js` and `test/monitor.test.js` stay untouched (documented fallback output path).

- [ ] **Step 1: Run the full suite before the change**

Run: `cd claude-telegram-bridge && npm test`
Expected: PASS (green baseline).

- [ ] **Step 2: Remove the dead code**

In `claude-telegram-bridge/src/index.js`, delete exactly these five pieces:

a) The import line:

```js
import { TmuxMonitor } from './tmux/monitor.js';
```

b) The import line:

```js
import { cleanTerminalOutput } from './tmux/formatter.js';
```

c) The state declaration:

```js
  let activeMonitor = null;
```

d) Inside `switchActiveSession`, the block:

```js
    if (activeMonitor) {
      activeMonitor.stop();
      activeMonitor = null;
    }
```

e) Inside the returned `stop()` method, the block:

```js
      if (activeMonitor) {
        activeMonitor.stop();
        activeMonitor = null;
      }
```

- [ ] **Step 3: Verify zero references remain**

Run: `grep -n "TmuxMonitor\|activeMonitor\|cleanTerminalOutput" claude-telegram-bridge/src/index.js`
Expected: no output.

- [ ] **Step 4: Run the full suite**

Run: `cd claude-telegram-bridge && npm test`
Expected: PASS (deletion only; no behavior change).

- [ ] **Step 5: Commit**

```bash
git add claude-telegram-bridge/src/index.js
git commit -m "refactor(bridge): remove dead monitor state and imports from index.js"
```

---

### Task 8: SessionStart / SessionEnd Hook Scripts

**Files:**
- Create: `.claude/hooks/telegram-bridge-start.sh`
- Create: `.claude/hooks/telegram-bridge-stop.sh`

**Interfaces:**
- Consumes: the daemon detection pattern from the removed `connect.sh` (PowerShell `Get-CimInstance Win32_Process`); `.env` presence as the first-time guard.
- Produces: `.claude/telegram-bridge.pid` (single-owner PID file). Task 9 registers both scripts in `.claude/settings.local.json`.

Known ceiling (spec, ponytail): single-owner PID file. With two concurrent Claude Code sessions, the second session's exit kills the first session's daemon. Upgrade path: a refcount file if concurrent sessions become routine.

- [ ] **Step 1: Create `.claude/hooks/telegram-bridge-start.sh`**

```bash
#!/bin/bash
# SessionStart hook: the bridge daemon starts with Claude Code.
# Single-owner PID file records which session started it (ponytail ceiling:
# with two concurrent Claude Code sessions, the first session's exit stops
# the daemon; upgrade to a refcount file if concurrent sessions get routine).

# The hook inherits the Claude Code environment; without this the marker
# leaks down the wsl -> tmux -> claude chain and disables transcript saving.
unset CLAUDE_CODE_CHILD_SESSION

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BRIDGE_DIR="$WORKSPACE_DIR/claude-telegram-bridge"
PID_FILE="$WORKSPACE_DIR/.claude/telegram-bridge.pid"

# First-time workspaces have no .env yet: stay silent, the setup skill
# handles configuration.
if [ ! -f "$BRIDGE_DIR/.env" ]; then
  exit 0
fi

# Is a bridge daemon already running? (same check the removed connect.sh used)
IS_RUNNING=0
if command -v powershell.exe >/dev/null 2>&1; then
  DAEMON_COUNT="$(powershell.exe -NoProfile -Command 'Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and ($_.CommandLine -like "*src/index.js*" -or $_.CommandLine -like "*claude-telegram-bridge*") } | Measure-Object | Select-Object -ExpandProperty Count' 2>/dev/null || echo "0")"
  if [ "${DAEMON_COUNT//[!0-9]/}" -gt 0 ] 2>/dev/null; then
    IS_RUNNING=1
  fi
else
  if pgrep -f "node.*(src/index\.js|claude-telegram-bridge)" >/dev/null 2>&1; then
    IS_RUNNING=1
  fi
fi

# Another session owns the running daemon: leave the PID file untouched.
if [ "$IS_RUNNING" -eq 1 ]; then
  exit 0
fi

# Start the daemon hidden and record the new process id.
if command -v powershell.exe >/dev/null 2>&1; then
  WIN_BRIDGE_DIR="$(cygpath -w "$BRIDGE_DIR" 2>/dev/null || echo "$BRIDGE_DIR")"
  PID="$(powershell.exe -NoProfile -Command "\$p = Start-Process -FilePath 'node.exe' -ArgumentList 'src/index.js' -WorkingDirectory '$WIN_BRIDGE_DIR' -WindowStyle Hidden -PassThru; Write-Output \$p.Id" 2>/dev/null | tr -d '\r\n')"
  if [ -n "$PID" ]; then
    echo "$PID" > "$PID_FILE"
  fi
else
  ( cd "$BRIDGE_DIR" && nohup node src/index.js >/dev/null 2>&1 & echo $! > "$PID_FILE" )
fi
exit 0
```

- [ ] **Step 2: Create `.claude/hooks/telegram-bridge-stop.sh`**

```bash
#!/bin/bash
# SessionEnd hook: stop the daemon THIS session started (single-owner PID file).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/../telegram-bridge.pid"

# No PID file: this session did not start the daemon; another session owns it.
if [ ! -f "$PID_FILE" ]; then
  exit 0
fi

PID="$(tr -d ' \r\n' < "$PID_FILE")"
if [ -n "$PID" ]; then
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "Stop-Process -Id $PID -Force -ErrorAction SilentlyContinue" 2>/dev/null || true
  else
    kill "$PID" 2>/dev/null || true
  fi
fi
rm -f "$PID_FILE"
exit 0
```

- [ ] **Step 3: Syntax-check both scripts**

Run: `bash -n .claude/hooks/telegram-bridge-start.sh && bash -n .claude/hooks/telegram-bridge-stop.sh && echo SYNTAX_OK`
Expected: `SYNTAX_OK`.

- [ ] **Step 4: Verify `stop.sh` with a sacrificial process (never touches the real daemon)**

```bash
sleep 300 &
SACRIFICIAL_PID=$!
echo $SACRIFICIAL_PID > .claude/telegram-bridge.pid
bash .claude/hooks/telegram-bridge-stop.sh
kill -0 $SACRIFICIAL_PID 2>/dev/null && echo "FAIL: process still alive" || echo "OK: process stopped"
[ -f .claude/telegram-bridge.pid ] && echo "FAIL: PID file still exists" || echo "OK: PID file deleted"
bash .claude/hooks/telegram-bridge-stop.sh && echo "OK: second run exits 0"
```

Expected: `OK: process stopped`, `OK: PID file deleted`, `OK: second run exits 0`.

- [ ] **Step 5: Verify `start.sh` idempotence and daemon start**

First check whether a daemon already runs:

```bash
powershell.exe -NoProfile -Command 'Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and ($_.CommandLine -like "*src/index.js*" -or $_.CommandLine -like "*claude-telegram-bridge*") } | Measure-Object | Select-Object -ExpandProperty Count'
```

- If the count is ≥ 1 (daemon running, possibly the user's live bridge): run `bash .claude/hooks/telegram-bridge-start.sh; echo "exit=$?"`. Expected: `exit=0` and `.claude/telegram-bridge.pid` was NOT created or modified (`ls .claude/telegram-bridge.pid 2>/dev/null` shows the pre-existing state). Do NOT test the kill path against this daemon.
- If the count is 0: run `bash .claude/hooks/telegram-bridge-start.sh`, then assert `test -f .claude/telegram-bridge.pid && echo "OK: PID file written"`, and the count command again shows ≥ 1. Run `start.sh` a second time: `exit=0` and the PID file content is unchanged (`cat .claude/telegram-bridge.pid` before and after). Leave the daemon running — auto-start is the desired end state.

- [ ] **Step 6: Commit**

```bash
git add .claude/hooks/telegram-bridge-start.sh .claude/hooks/telegram-bridge-stop.sh
git commit -m "feat(bridge): add SessionStart/SessionEnd hooks for daemon lifecycle"
```

---

### Task 9: Register the Hooks in `settings.local.json`

**Files:**
- Modify: `.claude/settings.local.json` (append to `SessionStart`; add a new `SessionEnd` key)

**Interfaces:**
- Consumes: script paths from Task 8. Registration style copies the existing `/c/Users/taro8/.claude/hooks/notify-on-stop.sh` entry (absolute POSIX path).
- Produces: hooks active from the next Claude Code session start.

⚠️ `.claude/settings.local.json` is tracked in git and contains an auth token. Edit it in place; do not stage or commit it (all task commits use explicit paths).

- [ ] **Step 1: Append the start hook to `SessionStart`**

In `.claude/settings.local.json`, inside the `"SessionStart": [ ... ]` array, after the second entry's closing `}` (the one with the long `EncodedCommand`), append a third entry:

```json
      {
        "hooks": [
          {
            "type": "command",
            "command": "/c/Users/taro8/Documents/claude-code-projects/claude-code-telegram/.claude/hooks/telegram-bridge-start.sh",
            "timeout": 30
          }
        ]
      }
```

- [ ] **Step 2: Add the `SessionEnd` key**

After the closing `]` of the `SessionStart` array, add:

```json
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/c/Users/taro8/Documents/claude-code-projects/claude-code-telegram/.claude/hooks/telegram-bridge-stop.sh",
            "timeout": 15
          }
        ]
      }
    ],
```

- [ ] **Step 3: Validate the JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('.claude/settings.local.json','utf8')); console.log('valid')"`
Expected: `valid`.

- [ ] **Step 4: Keep the edit out of git**

Run: `git status --short .claude/settings.local.json`
Expected: the file shows ` M` (modified, unstaged). Leave it unstaged. Never run `git add` on it.

---

### Task 10: Delete the Connect/Disconnect Skills; Update the Setup Skill

**Files:**
- Delete: `.claude/skills/telegram-bridge-connect/` (whole directory)
- Delete: `.claude/skills/telegram-bridge-disconnect/` (whole directory)
- Modify: `.claude/skills/telegram-bridge-setup/SKILL.md:52`
- Modify: `.claude/skills/telegram-bridge-setup/scripts/setup.sh:80`

**Interfaces:**
- Consumes: nothing.
- Produces: no skill references `telegram-bridge-connect` or `telegram-bridge-disconnect`.

- [ ] **Step 1: Confirm the skill directories are untracked, then delete them**

```bash
git ls-files .claude/skills/telegram-bridge-connect .claude/skills/telegram-bridge-disconnect
```

Expected: no output (untracked — git status shows `?? .claude/skills/telegram-bridge-connect/`). If files ARE tracked, use `git rm -r` instead of `rm -rf`.

```bash
rm -rf .claude/skills/telegram-bridge-connect .claude/skills/telegram-bridge-disconnect
ls .claude/skills/
```

Expected: `telegram-bridge-setup` is the only `telegram-bridge-*` directory left.

- [ ] **Step 2: Update the setup skill's closing line**

In `.claude/skills/telegram-bridge-setup/SKILL.md`, replace:

```markdown
2. Connect to the bridge using the `/telegram-bridge-connect` skill.
```

with:

```markdown
2. The bridge starts automatically with Claude Code.
```

- [ ] **Step 3: Update the setup script's closing line**

In `.claude/skills/telegram-bridge-setup/scripts/setup.sh`, replace:

```bash
echo "Use /telegram-bridge-connect to start the bridge."
```

with:

```bash
echo "The bridge starts automatically with Claude Code."
```

- [ ] **Step 4: Scan for stale references**

Run: `grep -rn "telegram-bridge-connect\|telegram-bridge-disconnect" --include="*.md" --include="*.sh" --include="*.js" .claude CLAUDE.md 2>/dev/null`

Expected: no matches under `.claude/skills/`, `.claude/hooks/`, or `CLAUDE.md`. (Historical files under `docs/superpowers/` and old memory notes may match; memory is updated in Task 11 and historical plan/spec documents stay as history.)

- [ ] **Step 5: Commit (only if anything tracked changed)**

The skill directories are untracked, so usually nothing enters git. If `git status` shows tracked deletions, commit them:

```bash
git add -A .claude/skills/
git commit -m "feat(bridge): remove connect/disconnect skills, superseded by auto-start hooks"
```

---

### Task 11: Full Suite, Memory Update, and Manual Acceptance

**Files:**
- Modify: `.claude/memory/bridge-daemon-lifecycle-management.md`
- Modify: `.claude/memory/bridge-session-binding.md`
- Modify: `.claude/memory/MEMORY.md`

**Interfaces:**
- Consumes: all previous tasks.
- Produces: green suite, memory that shows the current state, and a manual acceptance checklist for the user.

- [ ] **Step 1: Run the full test suite**

Run: `cd claude-telegram-bridge && npm test`
Expected: PASS, zero failures.

- [ ] **Step 2: Update `.claude/memory/bridge-daemon-lifecycle-management.md`**

Replace the file body (keep the frontmatter `name` and `type: project`; update `description`) so it reads:

```markdown
---
name: bridge-daemon-lifecycle-management
description: Bridge daemon auto-starts with Claude Code (SessionStart hook) and stops on its owner session's exit (SessionEnd hook, single-owner PID file)
metadata: 
  node_type: memory
  type: project
  originSessionId: b0ea1827-09f1-413c-bff4-c5c3f5b675d8
  modified: 2026-09-06T15:11:00.000Z
---

Since 2026-09-06 the daemon lifecycle is hook-driven; the `telegram-bridge-connect` and `telegram-bridge-disconnect` skills are deleted.

- `.claude/hooks/telegram-bridge-start.sh` (SessionStart): unsets `CLAUDE_CODE_CHILD_SESSION`, checks for a running daemon with PowerShell `Get-CimInstance Win32_Process`, starts `node src/index.js` hidden when absent, and writes the PID to `.claude/telegram-bridge.pid`. A running daemon is left alone.
- `.claude/hooks/telegram-bridge-stop.sh` (SessionEnd): kills the PID in the file and deletes it. No PID file means this session does not own the daemon — exit 0.
- tmux sessions do NOT stop with the daemon. They keep their state in WSL; the next daemon start re-attaches when exactly one `claude-*` session runs.
- Known ceiling: single-owner PID file. Two concurrent Claude Code sessions — the second session's exit kills the first session's daemon. Upgrade path: a refcount file.
- Link: [[claude-cli-transcript-slug-encodes-spaces]], [[wsl-interop-inherits-windows-env]], [[bridge-session-binding]]
```

- [ ] **Step 3: Update `.claude/memory/bridge-session-binding.md`**

Append to the "How to apply" list:

```markdown
- Since 2026-09-06 `/projects` shows a 🟢 Connect button for running projects: `proj_connect` rebinds the reader to that session and the old tmux session keeps running. The daemon attaches on start only when exactly one `claude-*` session runs.
- Dead sessions: incoming text replies `🔴 Session ended. Use /projects.` and clears the connection; the 4-second typing tick also detects death and sends the same notice once. Typing starts on every injection (text, answer_q, skill_run_now, skill args) and rebinds when the chat id changes.
```

- [ ] **Step 4: Update `.claude/memory/MEMORY.md`**

Replace the two index lines so they read:

```markdown
- [Bridge daemon lifecycle management](bridge-daemon-lifecycle-management.md) — daemon auto-starts via SessionStart hook and stops via SessionEnd hook (PID file); tmux sessions survive daemon stops
- [Bridge session binding](bridge-session-binding.md) — reader follows the tmux session's @claude_session_id transcript; /projects Connect swaps connections; dead sessions self-report; typing on all injection paths
```

- [ ] **Step 5: No commit for memory**

`.claude/memory/` is untracked. Verify: `git status --short .claude/memory/` shows only `??` entries. Nothing to commit.

- [ ] **Step 6: Manual acceptance (hand this checklist to the user)**

The executor cannot perform these — they need a phone and a fresh Claude Code start. Report them as pending user verification:

1. Start Claude Code. The daemon starts without any command.
2. In Telegram: `/projects` → project → Connect (or Start Session).
3. Send `hey`. The CLI pane shows `Telegram user: hey`. Both the CLI and Telegram show the reply.
4. While Claude works, the typing indicator shows. It stops at the first reply block.
5. Connect to a second project. The first session stays alive. Swap back — context is intact.
6. While Claude works (typing indicator active), kill the session from another pane. Within ~4 seconds Telegram shows `🔴 Session ended`. If Claude was idle instead, the next text message reports the ended session.
7. Start Claude Code twice → one daemon. Exit a session → the daemon it started is gone. A second session's exit does not stop a daemon it does not own.

---

## Self-Review (performed during plan writing)

- **Spec coverage:** Requirement 1 (skill removal) → Task 10. Requirement 2 (auto start/stop) → Tasks 8-9. Requirement 3 (`/projects` connect) → Tasks 1-2. Requirement 4 (typing all paths, never sticks) → Tasks 4-6. Requirement 5 (input/output flow) → existing behavior, verified in acceptance steps 3-4. Requirement 6 (single-connection swap) → Tasks 1-3. Spec sections 1-6 all map to tasks. No gaps.
- **Placeholder scan:** every step contains full code or exact commands. No TBD/TODO.
- **Type consistency:** `notifySessionDeath`/`ensureSessionAlive` defined in Task 4, consumed in Task 6 with identical signatures. `typingChatId` introduced in Task 5, kept in Task 6. `proj_connect:<name>` callback data identical in Task 1 (producer) and Task 2 (consumer).
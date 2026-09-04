# Claude Code Telegram Remote Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight Node.js daemon that connects a Telegram bot to live Claude Code CLI sessions running in `tmux` on a host/VPS, providing bi-directional terminal mirroring, paginated skills browsing, project session lifecycle management, and user whitelist authorization.

**Architecture:** Node.js ES modules application using `telegraf` for Telegram bot integration and native `child_process` commands for `tmux` control. A background polling loop captures tmux pane terminal changes, strips ANSI artifacts, debounces and batches output, and streams updates back to Telegram. User messages are injected directly into the tmux session via `tmux send-keys`.

**Tech Stack:** Node.js (>= 18.0.0, ES Modules), Telegraf (^4.16.3), dotenv, gray-matter, Node native `node:test` & `assert`, `child_process`.

**Spec:** `docs/superpowers/specs/2026-09-04-1445-claude-telegram-bridge-design.md`

## Global Constraints

- Runtime: Node.js (v18+) with native ES Modules (`"type": "module"`).
- Root project directory: `claude-telegram-bridge/` inside workspace root.
- Dependencies: `telegraf` (^4.16.3), `dotenv` (^16.4.5), `gray-matter` (^4.0.3).
- Security: Whitelist-only access via `ALLOWED_USER_IDS` (comma-separated Telegram IDs). Unauthorized requests must be dropped silently.
- Output formatting: Terminal outputs must strip ANSI escape codes, debounce to 1.5–2s intervals, and chunk long text cleanly under 4096 characters.
- Non-technical user friendly presentation: Clear emojis, concise summaries, and clean button layouts.

---

## 🗺️ Component & File Structure Overview

```
claude-telegram-bridge/
├── package.json
├── .env.example
├── test/
│   ├── auth.test.js
│   ├── formatter.test.js
│   ├── chunker.test.js
│   ├── tmux.test.js
│   ├── skills_scanner.test.js
│   ├── project_manager.test.js
│   └── monitor.test.js
└── src/
    ├── config.js
    ├── auth.js
    ├── utils/
    │   └── telegram_chunker.js
    ├── tmux/
    │   ├── formatter.js
    │   ├── controller.js
    │   └── monitor.js
    ├── skills/
    │   ├── scanner.js
    │   └── menu.js
    ├── projects/
    │   ├── manager.js
    │   └── menu.js
    └── index.js
```

---

### Task 1: Project Initialization & Configuration Validation

**Files:**
- Create: `claude-telegram-bridge/package.json`
- Create: `claude-telegram-bridge/.env.example`
- Create: `claude-telegram-bridge/src/config.js`
- Test: `claude-telegram-bridge/test/config.test.js`

**Interfaces:**
- Produces: `config` object:
  ```javascript
  export function loadConfig(env = process.env): {
    botToken: string,
    allowedUserIds: string[],
    projectsDir: string,
    tmuxPath: string,
    pollIntervalMs: number
  }
  ```

- [ ] **Step 1: Write the failing test for configuration loading**

```javascript
// claude-telegram-bridge/test/config.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

test('loadConfig validates required variables and parses allowedUserIds', () => {
  const fakeEnv = {
    TELEGRAM_BOT_TOKEN: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
    ALLOWED_USER_IDS: '111222333, 444555666',
    PROJECTS_DIR: '/home/user/projects'
  };

  const config = loadConfig(fakeEnv);
  assert.equal(config.botToken, '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11');
  assert.deepEqual(config.allowedUserIds, ['111222333', '444555666']);
  assert.equal(config.projectsDir, '/home/user/projects');
  assert.equal(config.tmuxPath, 'tmux');
  assert.equal(config.pollIntervalMs, 1000);
});

test('loadConfig throws when TELEGRAM_BOT_TOKEN is missing', () => {
  assert.throws(() => loadConfig({ ALLOWED_USER_IDS: '123' }), /TELEGRAM_BOT_TOKEN is required/);
});

test('loadConfig throws when ALLOWED_USER_IDS is missing or empty', () => {
  assert.throws(
    () => loadConfig({ TELEGRAM_BOT_TOKEN: 'fake' }),
    /ALLOWED_USER_IDS is required/
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test claude-telegram-bridge/test/config.test.js`
Expected: FAIL (Cannot find module '../src/config.js')

- [ ] **Step 3: Create package.json and minimal implementation**

```json
// claude-telegram-bridge/package.json
{
  "name": "claude-telegram-bridge",
  "version": "1.0.0",
  "type": "module",
  "description": "Telegram remote bridge daemon for Claude Code in tmux",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "test": "node --test test/*.test.js"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "gray-matter": "^4.0.3",
    "telegraf": "^4.16.3"
  }
}
```

```env
# claude-telegram-bridge/.env.example
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
ALLOWED_USER_IDS=123456789,987654321
PROJECTS_DIR=/home/user/projects
TMUX_PATH=tmux
POLL_INTERVAL_MS=1000
```

```javascript
// claude-telegram-bridge/src/config.js
import dotenv from 'dotenv';
dotenv.config();

export function loadConfig(env = process.env) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  if (!botToken || !botToken.trim()) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }

  const rawUsers = env.ALLOWED_USER_IDS;
  if (!rawUsers || !rawUsers.trim()) {
    throw new Error('ALLOWED_USER_IDS is required');
  }

  const allowedUserIds = rawUsers
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  if (allowedUserIds.length === 0) {
    throw new Error('ALLOWED_USER_IDS must contain at least one user ID');
  }

  return {
    botToken,
    allowedUserIds,
    projectsDir: env.PROJECTS_DIR || process.cwd(),
    tmuxPath: env.TMUX_PATH || 'tmux',
    pollIntervalMs: Number(env.POLL_INTERVAL_MS) || 1000
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test claude-telegram-bridge/test/config.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add claude-telegram-bridge/
git commit -m "feat(bridge): add package setup and config validation"
```

---

### Task 2: Whitelist Authorization Middleware

**Files:**
- Create: `claude-telegram-bridge/src/auth.js`
- Test: `claude-telegram-bridge/test/auth.test.js`

**Interfaces:**
- Produces:
  ```javascript
  export function createAuthMiddleware(allowedUserIds: string[]): (ctx: object, next: () => Promise<void>) => Promise<void>
  ```

- [ ] **Step 1: Write the failing test for authorization middleware**

```javascript
// claude-telegram-bridge/test/auth.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthMiddleware } from '../src/auth.js';

test('createAuthMiddleware allows whitelisted users and calls next()', async () => {
  const allowed = ['12345', '67890'];
  const middleware = createAuthMiddleware(allowed);

  let nextCalled = false;
  const next = async () => { nextCalled = true; };
  const ctx = { from: { id: 12345 } };

  await middleware(ctx, next);
  assert.equal(nextCalled, true);
});

test('createAuthMiddleware drops non-whitelisted users without calling next()', async () => {
  const allowed = ['12345', '67890'];
  const middleware = createAuthMiddleware(allowed);

  let nextCalled = false;
  const next = async () => { nextCalled = true; };
  const ctx = { from: { id: 99999 } };

  await middleware(ctx, next);
  assert.equal(nextCalled, false);
});

test('createAuthMiddleware handles missing ctx.from gracefully', async () => {
  const allowed = ['12345'];
  const middleware = createAuthMiddleware(allowed);

  let nextCalled = false;
  const next = async () => { nextCalled = true; };
  const ctx = {};

  await middleware(ctx, next);
  assert.equal(nextCalled, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test claude-telegram-bridge/test/auth.test.js`
Expected: FAIL (Cannot find module '../src/auth.js')

- [ ] **Step 3: Implement createAuthMiddleware**

```javascript
// claude-telegram-bridge/src/auth.js
export function createAuthMiddleware(allowedUserIds) {
  const idSet = new Set(allowedUserIds.map(String));

  return async function authMiddleware(ctx, next) {
    const userId = ctx.from?.id;
    if (userId !== undefined && idSet.has(String(userId))) {
      return next();
    }
    // Silently ignore unauthorized requests to prevent enumeration attacks
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test claude-telegram-bridge/test/auth.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add claude-telegram-bridge/src/auth.js claude-telegram-bridge/test/auth.test.js
git commit -m "feat(bridge): implement whitelist authorization middleware"
```

---

### Task 3: Terminal Output Cleanser & Telegram Message Chunker

**Files:**
- Create: `claude-telegram-bridge/src/tmux/formatter.js`
- Create: `claude-telegram-bridge/src/utils/telegram_chunker.js`
- Test: `claude-telegram-bridge/test/formatter.test.js`
- Test: `claude-telegram-bridge/test/chunker.test.js`

**Interfaces:**
- Produces:
  ```javascript
  // src/tmux/formatter.js
  export function cleanAnsi(text: string): string
  export function formatTerminalOutput(rawText: string): string

  // src/utils/telegram_chunker.js
  export function splitTelegramMessage(text: string, maxLength?: number): string[]
  ```

- [ ] **Step 1: Write failing tests for ANSI cleaning and chunking**

```javascript
// claude-telegram-bridge/test/formatter.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanAnsi, formatTerminalOutput } from '../src/tmux/formatter.js';

test('cleanAnsi strips color and cursor control sequences', () => {
  const ansiText = '[31mError:[0m [1mSomething went wrong[22m\r\n';
  const clean = cleanAnsi(ansiText);
  assert.equal(clean, 'Error: Something went wrong\n');
});

test('cleanAnsi normalizes carriage returns and trailing whitespace', () => {
  const messy = 'Line 1\r\nLine 2  \r\n';
  assert.equal(cleanAnsi(messy), 'Line 1\nLine 2\n');
});

test('formatTerminalOutput trims empty leading/trailing blank lines', () => {
  const output = '\n\n   Hello Claude   \n\n';
  assert.equal(formatTerminalOutput(output), 'Hello Claude');
});
```

```javascript
// claude-telegram-bridge/test/chunker.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { splitTelegramMessage } from '../src/utils/telegram_chunker.js';

test('splitTelegramMessage returns single chunk if below limit', () => {
  const short = 'Short output line';
  const chunks = splitTelegramMessage(short, 100);
  assert.deepEqual(chunks, ['Short output line']);
});

test('splitTelegramMessage splits text across line breaks when over limit', () => {
  const longText = 'Line A\nLine B\nLine C\nLine D';
  const chunks = splitTelegramMessage(longText, 14);
  assert.ok(chunks.length > 1);
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 14);
  }
  assert.equal(chunks.join('\n'), longText);
});

test('splitTelegramMessage handles single long line without newline', () => {
  const line = 'A'.repeat(50);
  const chunks = splitTelegramMessage(line, 20);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, 20);
  assert.equal(chunks[1].length, 20);
  assert.equal(chunks[2].length, 10);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test claude-telegram-bridge/test/formatter.test.js claude-telegram-bridge/test/chunker.test.js`
Expected: FAIL

- [ ] **Step 3: Implement formatter and chunker**

```javascript
// claude-telegram-bridge/src/tmux/formatter.js
const ANSI_REGEX = new RegExp(
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
  'g'
);

export function cleanAnsi(text) {
  if (!text) return '';
  return text
    .replace(ANSI_REGEX, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');
}

export function formatTerminalOutput(rawText) {
  const cleaned = cleanAnsi(rawText);
  return cleaned.trim();
}
```

```javascript
// claude-telegram-bridge/src/utils/telegram_chunker.js
export function splitTelegramMessage(text, maxLength = 4000) {
  if (!text) return [];
  if (text.length <= maxLength) return [text];

  const chunks = [];
  const lines = text.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    if (line.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      for (let i = 0; i < line.length; i += maxLength) {
        chunks.push(line.slice(i, i + maxLength));
      }
      continue;
    }

    const testChunk = currentChunk ? `${currentChunk}\n${line}` : line;
    if (testChunk.length <= maxLength) {
      currentChunk = testChunk;
    } else {
      chunks.push(currentChunk);
      currentChunk = line;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test claude-telegram-bridge/test/formatter.test.js claude-telegram-bridge/test/chunker.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add claude-telegram-bridge/src/tmux/formatter.js claude-telegram-bridge/src/utils/telegram_chunker.js claude-telegram-bridge/test/
git commit -m "feat(bridge): implement ansi cleaning and telegram chunking"
```

---

### Task 4: Tmux Controller & Process Orchestration

**Files:**
- Create: `claude-telegram-bridge/src/tmux/controller.js`
- Test: `claude-telegram-bridge/test/tmux.test.js`

**Interfaces:**
- Produces:
  ```javascript
  export class TmuxController {
    constructor(tmuxPath = 'tmux', execFn = child_process.exec)
    hasSession(sessionName: string): Promise<boolean>
    listSessions(prefix?: string): Promise<string[]>
    newSession(sessionName: string, cwd: string, command?: string): Promise<void>
    killSession(sessionName: string): Promise<void>
    sendKeys(sessionName: string, keys: string, pressEnter?: boolean): Promise<void>
    capturePane(sessionName: string, startLine?: number): Promise<string>
  }
  ```

- [ ] **Step 1: Write the failing unit tests mocking `child_process.exec`**

```javascript
// claude-telegram-bridge/test/tmux.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { TmuxController } from '../src/tmux/controller.js';

test('TmuxController.hasSession returns true when session exists', async () => {
  const mockExec = (cmd, cb) => {
    assert.match(cmd, /has-session -t test-sess/);
    cb(null, '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const exists = await controller.hasSession('test-sess');
  assert.equal(exists, true);
});

test('TmuxController.hasSession returns false when session does not exist', async () => {
  const mockExec = (cmd, cb) => {
    cb(new Error('session not found'), '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const exists = await controller.hasSession('non-existent');
  assert.equal(exists, false);
});

test('TmuxController.sendKeys properly escapes input', async () => {
  let executedCmd = '';
  const mockExec = (cmd, cb) => {
    executedCmd = cmd;
    cb(null, '', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  await controller.sendKeys('test-sess', 'echo "hello"', true);
  assert.ok(executedCmd.includes('send-keys -t test-sess -l'));
  assert.ok(executedCmd.includes('Enter'));
});

test('TmuxController.listSessions filters by prefix', async () => {
  const mockExec = (cmd, cb) => {
    cb(null, 'claude-web\nclaude-backend\nrandom-session\n', '');
  };
  const controller = new TmuxController('tmux', mockExec);
  const sessions = await controller.listSessions('claude-');
  assert.deepEqual(sessions, ['claude-web', 'claude-backend']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test claude-telegram-bridge/test/tmux.test.js`
Expected: FAIL

- [ ] **Step 3: Implement TmuxController**

```javascript
// claude-telegram-bridge/src/tmux/controller.js
import { exec as defaultExec } from 'node:child_process';
import { promisify } from 'node:util';

export class TmuxController {
  constructor(tmuxPath = 'tmux', execFn = defaultExec) {
    this.tmuxPath = tmuxPath;
    this.execAsync = promisify(execFn);
  }

  async hasSession(sessionName) {
    try {
      await this.execAsync(`${this.tmuxPath} has-session -t "${sessionName}"`);
      return true;
    } catch {
      return false;
    }
  }

  async listSessions(prefix = '') {
    try {
      const { stdout } = await this.execAsync(`${this.tmuxPath} list-sessions -F "#{session_name}"`);
      const all = stdout.split('\n').map(s => s.trim()).filter(Boolean);
      return prefix ? all.filter(s => s.startsWith(prefix)) : all;
    } catch {
      return [];
    }
  }

  async newSession(sessionName, cwd, command = 'claude') {
    const safeSession = sessionName.replace(/"/g, '\\"');
    const safeCwd = cwd.replace(/"/g, '\\"');
    const cmd = `${this.tmuxPath} new-session -d -s "${safeSession}" -c "${safeCwd}" "${command}"`;
    await this.execAsync(cmd);
  }

  async killSession(sessionName) {
    try {
      await this.execAsync(`${this.tmuxPath} kill-session -t "${sessionName}"`);
    } catch (err) {
      if (!err.message?.includes('no server running') && !err.message?.includes('session not found')) {
        throw err;
      }
    }
  }

  async sendKeys(sessionName, text, pressEnter = true) {
    // Send text literally (-l) so special characters aren't interpreted as tmux key bindings
    const escaped = text.replace(/"/g, '\\"');
    let cmd = `${this.tmuxPath} send-keys -t "${sessionName}" -l "${escaped}"`;
    if (pressEnter) {
      cmd += ` && ${this.tmuxPath} send-keys -t "${sessionName}" Enter`;
    }
    await this.execAsync(cmd);
  }

  async capturePane(sessionName, startLine = -100) {
    try {
      const { stdout } = await this.execAsync(
        `${this.tmuxPath} capture-pane -p -t "${sessionName}" -S ${startLine}`
      );
      return stdout;
    } catch (err) {
      if (err.message?.includes('session not found')) {
        return '';
      }
      throw err;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test claude-telegram-bridge/test/tmux.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add claude-telegram-bridge/src/tmux/controller.js claude-telegram-bridge/test/tmux.test.js
git commit -m "feat(bridge): implement TmuxController for session lifecycle and keys"
```

---

### Task 5: Tmux Output Monitor & Smart Diff Engine

**Files:**
- Create: `claude-telegram-bridge/src/tmux/monitor.js`
- Test: `claude-telegram-bridge/test/monitor.test.js`

**Interfaces:**
- Produces:
  ```javascript
  export class TmuxMonitor {
    constructor(tmuxController: TmuxController, sessionName: string, pollIntervalMs?: number)
    start(onOutput: (newText: string) => void): void
    stop(): void
    computeDiff(previousLines: string[], currentLines: string[]): { newLines: string[], updatedBaseline: string[] }
  }
  ```

- [ ] **Step 1: Write unit tests for diff computation and polling**

```javascript
// claude-telegram-bridge/test/monitor.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { TmuxMonitor } from '../src/tmux/monitor.js';

test('computeDiff extracts only appended lines when terminal expands', () => {
  const monitor = new TmuxMonitor(null, 'test-sess');
  const baseline = ['Line 1', 'Line 2'];
  const current = ['Line 1', 'Line 2', 'Line 3', 'Line 4'];

  const { newLines, updatedBaseline } = monitor.computeDiff(baseline, current);
  assert.deepEqual(newLines, ['Line 3', 'Line 4']);
  assert.deepEqual(updatedBaseline, current);
});

test('computeDiff handles line updates at bottom (progress / spinner)', () => {
  const monitor = new TmuxMonitor(null, 'test-sess');
  const baseline = ['Done step 1', 'Processing: 10%'];
  const current = ['Done step 1', 'Processing: 50%'];

  const { newLines } = monitor.computeDiff(baseline, current);
  assert.deepEqual(newLines, ['Processing: 50%']);
});

test('computeDiff handles scrolled off lines without duplicating entire pane', () => {
  const monitor = new TmuxMonitor(null, 'test-sess');
  const baseline = ['Old line 1', 'Old line 2', 'Common line 3'];
  const current = ['Common line 3', 'Fresh line 4'];

  const { newLines } = monitor.computeDiff(baseline, current);
  assert.deepEqual(newLines, ['Fresh line 4']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test claude-telegram-bridge/test/monitor.test.js`
Expected: FAIL

- [ ] **Step 3: Implement TmuxMonitor**

```javascript
// claude-telegram-bridge/src/tmux/monitor.js
import { cleanAnsi } from './formatter.js';

export class TmuxMonitor {
  constructor(tmuxController, sessionName, pollIntervalMs = 1000) {
    this.controller = tmuxController;
    this.sessionName = sessionName;
    this.pollIntervalMs = pollIntervalMs;
    this.lastLines = [];
    this.timer = null;
    this.isPolling = false;
  }

  computeDiff(previousLines, currentLines) {
    if (previousLines.length === 0) {
      return { newLines: currentLines, updatedBaseline: currentLines };
    }

    // Find the latest matching overlap between previousLines and currentLines
    let overlapIndex = -1;
    for (let i = 0; i < currentLines.length; i++) {
      let matches = true;
      for (let j = 0; j + i < currentLines.length && j < previousLines.length; j++) {
        if (currentLines[i + j] !== previousLines[j]) {
          matches = false;
          break;
        }
      }
      if (matches && i > 0) {
        overlapIndex = i;
        break;
      }
    }

    // Direct suffix match check (most common in terminal output)
    const prevText = previousLines.join('\n');
    const currText = currentLines.join('\n');

    if (currText.startsWith(prevText)) {
      const added = currText.slice(prevText.length).trim();
      const newLines = added ? added.split('\n') : [];
      return { newLines, updatedBaseline: currentLines };
    }

    // Line replacement at end (spinner or status updates)
    if (
      previousLines.length === currentLines.length &&
      previousLines.slice(0, -1).join('\n') === currentLines.slice(0, -1).join('\n')
    ) {
      const lastLine = currentLines[currentLines.length - 1];
      return { newLines: [lastLine], updatedBaseline: currentLines };
    }

    // Fallback: look for newly appended items
    let diffStart = 0;
    while (
      diffStart < previousLines.length &&
      diffStart < currentLines.length &&
      previousLines[diffStart] === currentLines[diffStart]
    ) {
      diffStart++;
    }

    const newLines = currentLines.slice(diffStart);
    return { newLines, updatedBaseline: currentLines };
  }

  start(onOutput) {
    if (this.timer) return;
    this.timer = setInterval(async () => {
      if (this.isPolling) return;
      this.isPolling = true;
      try {
        const raw = await this.controller.capturePane(this.sessionName, -100);
        if (!raw) return;

        const cleaned = cleanAnsi(raw);
        const lines = cleaned.split('\n');

        const { newLines, updatedBaseline } = this.computeDiff(this.lastLines, lines);
        this.lastLines = updatedBaseline;

        const outputText = newLines.join('\n').trim();
        if (outputText) {
          onOutput(outputText);
        }
      } catch (err) {
        // Suppress expected session close errors
      } finally {
        this.isPolling = false;
      }
    }, this.pollIntervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test claude-telegram-bridge/test/monitor.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add claude-telegram-bridge/src/tmux/monitor.js claude-telegram-bridge/test/monitor.test.js
git commit -m "feat(bridge): implement TmuxMonitor with smart diffing and polling"
```

---

### Task 6: Skills Scanner & Interactive Paginated Menu

**Files:**
- Create: `claude-telegram-bridge/src/skills/scanner.js`
- Create: `claude-telegram-bridge/src/skills/menu.js`
- Test: `claude-telegram-bridge/test/skills_scanner.test.js`
- Test: `claude-telegram-bridge/test/skills_menu.test.js`

**Interfaces:**
- Produces:
  ```javascript
  // src/skills/scanner.js
  export async function scanSkills(directories: string[]): Promise<Array<{ id: string, name: string, description: string, command: string }>>
  export function getBuiltInCommands(): Array<{ id: string, name: string, description: string, command: string }>

  // src/skills/menu.js
  export function buildSkillsKeyboard(skills: Array<any>, page: number, pageSize?: number): { text: string, reply_markup: object }
  export function buildSkillInspectView(skill: object): { text: string, reply_markup: object }
  ```

- [ ] **Step 1: Write failing tests for scanner and menu builder**

```javascript
// claude-telegram-bridge/test/skills_scanner.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { scanSkills, getBuiltInCommands } from '../src/skills/scanner.js';

test('getBuiltInCommands returns core Claude commands', () => {
  const builtins = getBuiltInCommands();
  assert.ok(builtins.some(c => c.command === '/clear'));
  assert.ok(builtins.some(c => c.command === '/compact'));
  assert.ok(builtins.some(c => c.command === '/help'));
});

test('scanSkills reads yaml frontmatter from SKILL.md files', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skills-test-'));
  const skillFolder = path.join(tmpDir, 'test-skill');
  await fs.mkdir(skillFolder, { recursive: true });
  await fs.writeFile(
    path.join(skillFolder, 'SKILL.md'),
    `---\nname: my-skill\ndescription: A useful skill\n---\nBody here`
  );

  const skills = await scanSkills([tmpDir]);
  assert.equal(skills.length, 1);
  assert.equal(skills[0].name, 'my-skill');
  assert.equal(skills[0].description, 'A useful skill');
  assert.equal(skills[0].command, '/my-skill');

  await fs.rm(tmpDir, { recursive: true, force: true });
});
```

```javascript
// claude-telegram-bridge/test/skills_menu.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSkillsKeyboard, buildSkillInspectView } from '../src/skills/menu.js';

test('buildSkillsKeyboard paginates 6 items per page with navigation buttons', () => {
  const dummySkills = Array.from({ length: 15 }, (_, i) => ({
    id: `skill-${i}`,
    name: `Skill ${i}`,
    command: `/skill${i}`
  }));

  const page1 = buildSkillsKeyboard(dummySkills, 0, 6);
  assert.ok(page1.text.includes('Skills Browser'));
  // 6 skill buttons arranged in 3 rows (2 per row) + 1 nav row = 4 rows
  assert.equal(page1.reply_markup.inline_keyboard.length, 4);

  const navRow = page1.reply_markup.inline_keyboard[3];
  assert.ok(navRow.some(b => b.text.includes('1 / 3')));
  assert.ok(navRow.some(b => b.callback_data === 'skills_page:1'));
});

test('buildSkillInspectView generates Inspect card with Run buttons', () => {
  const skill = {
    id: 'brainstorming',
    name: 'Brainstorming',
    description: 'Explore ideas with user',
    command: '/superpowers:brainstorming'
  };

  const card = buildSkillInspectView(skill);
  assert.ok(card.text.includes('Brainstorming'));
  assert.ok(card.text.includes('Explore ideas with user'));

  const buttons = card.reply_markup.inline_keyboard.flat();
  assert.ok(buttons.some(b => b.text.includes('Run Skill Now')));
  assert.ok(buttons.some(b => b.text.includes('Run with Arguments')));
  assert.ok(buttons.some(b => b.text.includes('Back to Skills')));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test claude-telegram-bridge/test/skills_scanner.test.js claude-telegram-bridge/test/skills_menu.test.js`
Expected: FAIL

- [ ] **Step 3: Implement skills scanner and menu builder**

```javascript
// claude-telegram-bridge/src/skills/scanner.js
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export function getBuiltInCommands() {
  return [
    { id: 'builtin:clear', name: 'clear', description: 'Clear conversation context and restart clean', command: '/clear' },
    { id: 'builtin:compact', name: 'compact', description: 'Summarize and compress current chat history', command: '/compact' },
    { id: 'builtin:cost', name: 'cost', description: 'Show total token usage and estimated cost', command: '/cost' },
    { id: 'builtin:doctor', name: 'doctor', description: 'Check health and configuration of Claude Code', command: '/doctor' },
    { id: 'builtin:review', name: 'review', description: 'Review changes or PR against quality rules', command: '/review' },
    { id: 'builtin:help', name: 'help', description: 'Show help and available commands', command: '/help' }
  ];
}

export async function scanSkills(directories = []) {
  const results = [];
  const seenIds = new Set();

  for (const dir of directories) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const skillFilePath = path.join(dir, entry.name, 'SKILL.md');
        try {
          const content = await fs.readFile(skillFilePath, 'utf8');
          const parsed = matter(content);
          const name = parsed.data.name || entry.name;
          const description = parsed.data.description || 'No description provided';
          const id = `skill:${name}`;

          if (!seenIds.has(id)) {
            seenIds.add(id);
            results.push({
              id,
              name,
              description: description.replace(/[*_`#]/g, '').trim(),
              command: `/${name}`
            });
          }
        } catch {
          // File does not exist or invalid YAML, skip
        }
      }
    } catch {
      // Directory cannot be read, continue to next
    }
  }

  return results;
}
```

```javascript
// claude-telegram-bridge/src/skills/menu.js
export function buildSkillsKeyboard(skills, page = 0, pageSize = 6) {
  const totalPages = Math.ceil(skills.length / pageSize) || 1;
  const currentPage = Math.max(0, Math.min(page, totalPages - 1));

  const startIdx = currentPage * pageSize;
  const currentSkills = skills.slice(startIdx, startIdx + pageSize);

  const keyboard = [];
  for (let i = 0; i < currentSkills.length; i += 2) {
    const row = [];
    row.push({
      text: `⚡ ${currentSkills[i].name}`,
      callback_data: `skill_inspect:${currentSkills[i].id}`
    });
    if (i + 1 < currentSkills.length) {
      row.push({
        text: `⚡ ${currentSkills[i + 1].name}`,
        callback_data: `skill_inspect:${currentSkills[i + 1].id}`
      });
    }
    keyboard.push(row);
  }

  // Navigation row
  const navRow = [];
  if (currentPage > 0) {
    navRow.push({ text: '◀️ Prev', callback_data: `skills_page:${currentPage - 1}` });
  } else {
    navRow.push({ text: '⏹️', callback_data: 'noop' });
  }

  navRow.push({ text: `${currentPage + 1} / ${totalPages}`, callback_data: 'noop' });

  if (currentPage < totalPages - 1) {
    navRow.push({ text: 'Next ▶️', callback_data: `skills_page:${currentPage + 1}` });
  } else {
    navRow.push({ text: '⏹️', callback_data: 'noop' });
  }
  keyboard.push(navRow);

  return {
    text: `🛠️ *Skills Browser* (Page ${currentPage + 1}/${totalPages})\nTap a skill to view details or run it:`,
    reply_markup: { inline_keyboard: keyboard }
  };
}

export function buildSkillInspectView(skill) {
  const text = [
    `⚡ *${skill.name}*`,
    `\`${skill.command}\``,
    '',
    `📖 *Description:*`,
    skill.description
  ].join('\n');

  const keyboard = [
    [
      { text: '▶️ Run Skill Now', callback_data: `skill_run_now:${skill.id}` },
      { text: '✏️ Run with Arguments', callback_data: `skill_run_args:${skill.id}` }
    ],
    [
      { text: '⬅️ Back to Skills', callback_data: 'skills_page:0' }
    ]
  ];

  return {
    text,
    reply_markup: { inline_keyboard: keyboard }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test claude-telegram-bridge/test/skills_scanner.test.js claude-telegram-bridge/test/skills_menu.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add claude-telegram-bridge/src/skills/ claude-telegram-bridge/test/
git commit -m "feat(bridge): implement skills scanner and paginated interactive menu"
```

---

### Task 7: Projects & Session Lifecycle Manager

**Files:**
- Create: `claude-telegram-bridge/src/projects/manager.js`
- Create: `claude-telegram-bridge/src/projects/menu.js`
- Test: `claude-telegram-bridge/test/project_manager.test.js`

**Interfaces:**
- Produces:
  ```javascript
  // src/projects/manager.js
  export class ProjectManager {
    constructor(projectsDir: string, tmuxController: TmuxController)
    listProjects(): Promise<Array<{ name: string, path: string, runningSessions: string[] }>>
    startFreshSession(projectName: string): Promise<string>
    killProjectSessions(projectName: string): Promise<void>
  }

  // src/projects/menu.js
  export function buildProjectsMenu(projects: Array<any>): { text: string, reply_markup: object }
  export function buildProjectActionView(project: any): { text: string, reply_markup: object }
  ```

- [ ] **Step 1: Write failing tests for ProjectManager and menus**

```javascript
// claude-telegram-bridge/test/project_manager.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ProjectManager } from '../src/projects/manager.js';
import { buildProjectsMenu, buildProjectActionView } from '../src/projects/menu.js';

test('ProjectManager discovers folders and correlates active tmux sessions', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'proj-test-'));
  await fs.mkdir(path.join(tmpDir, 'web-backend'));
  await fs.mkdir(path.join(tmpDir, 'mobile-app'));

  const mockController = {
    listSessions: async () => ['claude-web-backend']
  };

  const manager = new ProjectManager(tmpDir, mockController);
  const list = await manager.listProjects();

  assert.equal(list.length, 2);
  const webProj = list.find(p => p.name === 'web-backend');
  const mobProj = list.find(p => p.name === 'mobile-app');

  assert.deepEqual(webProj.runningSessions, ['claude-web-backend']);
  assert.deepEqual(mobProj.runningSessions, []);

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('buildProjectsMenu renders list with status badges', () => {
  const projects = [
    { name: 'web-backend', runningSessions: ['claude-web-backend'] },
    { name: 'mobile-app', runningSessions: [] }
  ];

  const menu = buildProjectsMenu(projects);
  assert.ok(menu.text.includes('Projects'));
  const buttons = menu.reply_markup.inline_keyboard.flat();
  assert.ok(buttons.some(b => b.text.includes('web-backend') && b.text.includes('🟢')));
  assert.ok(buttons.some(b => b.text.includes('mobile-app') && b.text.includes('⚪')));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test claude-telegram-bridge/test/project_manager.test.js`
Expected: FAIL

- [ ] **Step 3: Implement ProjectManager and menus**

```javascript
// claude-telegram-bridge/src/projects/manager.js
import fs from 'node:fs/promises';
import path from 'node:path';

export class ProjectManager {
  constructor(projectsDir, tmuxController) {
    this.projectsDir = projectsDir;
    this.controller = tmuxController;
  }

  async listProjects() {
    try {
      const entries = await fs.readdir(this.projectsDir, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
      const activeSessions = await this.controller.listSessions('claude-');

      return dirs.map(d => {
        const fullPath = path.join(this.projectsDir, d.name);
        const sessionPrefix = `claude-${d.name}`;
        const running = activeSessions.filter(s => s === sessionPrefix || s.startsWith(`${sessionPrefix}-`));
        return {
          name: d.name,
          path: fullPath,
          runningSessions: running
        };
      });
    } catch {
      return [];
    }
  }

  async startFreshSession(projectName) {
    const sessionName = `claude-${projectName}`;
    const projectPath = path.join(this.projectsDir, projectName);

    // If an existing session exists, kill it first to ensure fresh session
    if (await this.controller.hasSession(sessionName)) {
      await this.controller.killSession(sessionName);
    }

    await this.controller.newSession(sessionName, projectPath, 'claude');
    return sessionName;
  }

  async killProjectSessions(projectName) {
    const sessionPrefix = `claude-${projectName}`;
    const all = await this.controller.listSessions('claude-');
    const toKill = all.filter(s => s === sessionPrefix || s.startsWith(`${sessionPrefix}-`));
    for (const sess of toKill) {
      await this.controller.killSession(sess);
    }
  }
}
```

```javascript
// claude-telegram-bridge/src/projects/menu.js
export function buildProjectsMenu(projects) {
  if (projects.length === 0) {
    return {
      text: '📁 *Projects*\nNo project folders found in the configured directory.',
      reply_markup: { inline_keyboard: [] }
    };
  }

  const keyboard = projects.map(p => {
    const isRunning = p.runningSessions.length > 0;
    const badge = isRunning ? '🟢' : '⚪';
    const statusText = isRunning ? `(${p.runningSessions.length} active)` : '(idle)';
    return [
      {
        text: `${badge} ${p.name} ${statusText}`,
        callback_data: `project_select:${p.name}`
      }
    ];
  });

  return {
    text: '📁 *Projects Dashboard*\nSelect a project to start or manage sessions:',
    reply_markup: { inline_keyboard: keyboard }
  };
}

export function buildProjectActionView(project) {
  const isRunning = project.runningSessions.length > 0;
  const status = isRunning
    ? `🟢 Running (${project.runningSessions.join(', ')})`
    : '⚪ Idle';

  const text = [
    `📁 *Project:* \`${project.name}\``,
    `📍 *Path:* \`${project.path}\``,
    `📊 *Status:* ${status}`,
    '',
    'Choose an action below:'
  ].join('\n');

  const keyboard = [
    [
      { text: '🚀 Start Fresh Session', callback_data: `proj_start:${project.name}` }
    ]
  ];

  if (isRunning) {
    keyboard.push([
      { text: '🛑 Kill All Sessions', callback_data: `proj_kill:${project.name}` }
    ]);
  }

  keyboard.push([
    { text: '⬅️ Back to Projects', callback_data: 'projects_list' }
  ]);

  return {
    text,
    reply_markup: { inline_keyboard: keyboard }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test claude-telegram-bridge/test/project_manager.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add claude-telegram-bridge/src/projects/ claude-telegram-bridge/test/project_manager.test.js
git commit -m "feat(bridge): implement ProjectManager and project action menus"
```

---

### Task 8: Bot Orchestration, Message Streaming & CLI Ingestion

**Files:**
- Create: `claude-telegram-bridge/src/index.js`
- Test: `claude-telegram-bridge/test/integration.test.js`

**Interfaces:**
- Assembles all modules into a robust Telegram bot daemon:
  - Whitelist auth middleware attached first.
  - Commands: `/start`, `/help`, `/projects`, `/skills`, `/status`, `/kill`.
  - Callback queries: handles pagination, project actions, running skills.
  - Text messages: injects input into active tmux session; handles argument input for skills.
  - Background monitor: streams output changes from tmux back into Telegram chat with debouncing and chunking.

- [ ] **Step 1: Write integration smoke test for app bootstrapping**

```javascript
// claude-telegram-bridge/test/integration.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';
import { TmuxController } from '../src/tmux/controller.js';
import { ProjectManager } from '../src/projects/manager.js';
import { scanSkills, getBuiltInCommands } from '../src/skills/scanner.js';

test('Components wire together cleanly without initialization crashes', async () => {
  const env = {
    TELEGRAM_BOT_TOKEN: '12345:TEST_TOKEN',
    ALLOWED_USER_IDS: '123456',
    PROJECTS_DIR: process.cwd()
  };

  const config = loadConfig(env);
  const tmux = new TmuxController(config.tmuxPath);
  const projManager = new ProjectManager(config.projectsDir, tmux);

  const builtins = getBuiltInCommands();
  assert.ok(builtins.length > 0);
  assert.ok(projManager);
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node --test claude-telegram-bridge/test/integration.test.js`
Expected: PASS

- [ ] **Step 3: Implement main bot entrypoint in `src/index.js`**

```javascript
// claude-telegram-bridge/src/index.js
import { Telegraf } from 'telegraf';
import path from 'node:path';
import os from 'node:os';
import { loadConfig } from './config.js';
import { createAuthMiddleware } from './auth.js';
import { TmuxController } from './tmux/controller.js';
import { TmuxMonitor } from './tmux/monitor.js';
import { splitTelegramMessage } from './utils/telegram_chunker.js';
import { scanSkills, getBuiltInCommands } from './skills/scanner.js';
import { buildSkillsKeyboard, buildSkillInspectView } from './skills/menu.js';
import { ProjectManager } from './projects/manager.js';
import { buildProjectsMenu, buildProjectActionView } from './projects/menu.js';

const config = loadConfig();
const bot = new Telegraf(config.botToken);
const tmux = new TmuxController(config.tmuxPath);
const projectManager = new ProjectManager(config.projectsDir, tmux);

// State tracking
let activeSessionName = null;
let activeChatId = null;
let activeMonitor = null;
let pendingArgsSkill = null; // When user clicked 'Run with Arguments'

// Cache scanned skills
let cachedSkills = [];
async function refreshSkills() {
  const localSkillsDir = path.join(process.cwd(), '.claude', 'skills');
  const userSkillsDir = path.join(os.homedir(), '.claude', 'skills');
  const projectSkillsDir = activeSessionName
    ? path.join(config.projectsDir, activeSessionName.replace(/^claude-/, ''), '.claude', 'skills')
    : null;

  const dirs = [localSkillsDir, userSkillsDir, projectSkillsDir].filter(Boolean);
  const scanned = await scanSkills(dirs);
  const builtins = getBuiltInCommands();
  cachedSkills = [...builtins, ...scanned];
}

// Attach Whitelist Auth Guard
bot.use(createAuthMiddleware(config.allowedUserIds));

function switchActiveSession(sessionName, chatId) {
  if (activeMonitor) {
    activeMonitor.stop();
    activeMonitor = null;
  }

  activeSessionName = sessionName;
  activeChatId = chatId;

  if (sessionName && chatId) {
    activeMonitor = new TmuxMonitor(tmux, sessionName, config.pollIntervalMs);
    let pendingOutput = '';
    let debounceTimer = null;

    activeMonitor.start((chunk) => {
      pendingOutput += (pendingOutput ? '\n' : '') + chunk;
      if (!debounceTimer) {
        debounceTimer = setTimeout(async () => {
          const textToSend = pendingOutput.trim();
          pendingOutput = '';
          debounceTimer = null;
          if (!textToSend || !activeChatId) return;

          const chunks = splitTelegramMessage(textToSend, 4000);
          for (const c of chunks) {
            try {
              await bot.telegram.sendMessage(activeChatId, `\`\`\`\n${c}\n\`\`\``, {
                parse_mode: 'Markdown'
              });
            } catch (err) {
              // Fallback to plain text if Markdown parsing fails
              await bot.telegram.sendMessage(activeChatId, c);
            }
          }
        }, 1500);
      }
    });
  }
}

// Commands
bot.command('start', async (ctx) => {
  await ctx.reply(
    '👋 *Welcome to Claude Code Telegram Remote Bridge!*\n\n' +
    'Commands:\n' +
    '• /projects - Manage project folders & launch sessions\n' +
    '• /skills - Browse and run Claude skills\n' +
    '• /status - View current active session\n' +
    '• /help - Help & usage guide\n\n' +
    'Any text you send here will be forwarded directly to your active Claude Code session.',
    { parse_mode: 'Markdown' }
  );
});

bot.command('status', async (ctx) => {
  if (!activeSessionName) {
    return ctx.reply('⚪ *No active session.* Use /projects to start one.', { parse_mode: 'Markdown' });
  }
  const exists = await tmux.hasSession(activeSessionName);
  return ctx.reply(
    `🎯 *Active Session:* \`${activeSessionName}\` (${exists ? '🟢 Online' : '🔴 Terminated'})`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('projects', async (ctx) => {
  const projects = await projectManager.listProjects();
  const menu = buildProjectsMenu(projects);
  await ctx.reply(menu.text, { parse_mode: 'Markdown', reply_markup: menu.reply_markup });
});

bot.command('skills', async (ctx) => {
  await refreshSkills();
  const menu = buildSkillsKeyboard(cachedSkills, 0);
  await ctx.reply(menu.text, { parse_mode: 'Markdown', reply_markup: menu.reply_markup });
});

// Callback Queries
bot.action(/skills_page:(\d+)/, async (ctx) => {
  const page = parseInt(ctx.match[1], 10);
  const menu = buildSkillsKeyboard(cachedSkills, page);
  await ctx.editMessageText(menu.text, { parse_mode: 'Markdown', reply_markup: menu.reply_markup });
  await ctx.answerCbQuery();
});

bot.action(/skill_inspect:(.+)/, async (ctx) => {
  const skillId = ctx.match[1];
  const skill = cachedSkills.find(s => s.id === skillId);
  if (!skill) return ctx.answerCbQuery('Skill not found');
  const view = buildSkillInspectView(skill);
  await ctx.editMessageText(view.text, { parse_mode: 'Markdown', reply_markup: view.reply_markup });
  await ctx.answerCbQuery();
});

bot.action(/skill_run_now:(.+)/, async (ctx) => {
  const skillId = ctx.match[1];
  const skill = cachedSkills.find(s => s.id === skillId);
  if (!skill) return ctx.answerCbQuery('Skill not found');

  if (!activeSessionName) {
    return ctx.reply('⚠️ No active Claude session. Use /projects to start one first.');
  }

  await tmux.sendKeys(activeSessionName, skill.command, true);
  await ctx.answerCbQuery(`Running ${skill.name}...`);
  await ctx.reply(`⚡ Injected \`${skill.command}\` into \`${activeSessionName}\``, { parse_mode: 'Markdown' });
});

bot.action(/skill_run_args:(.+)/, async (ctx) => {
  const skillId = ctx.match[1];
  const skill = cachedSkills.find(s => s.id === skillId);
  if (!skill) return ctx.answerCbQuery('Skill not found');

  pendingArgsSkill = skill;
  await ctx.answerCbQuery();
  await ctx.reply(
    `✏️ Please reply with the arguments you want to pass to \`${skill.command}\` (or type /cancel):`,
    { parse_mode: 'Markdown' }
  );
});

bot.action('projects_list', async (ctx) => {
  const projects = await projectManager.listProjects();
  const menu = buildProjectsMenu(projects);
  await ctx.editMessageText(menu.text, { parse_mode: 'Markdown', reply_markup: menu.reply_markup });
  await ctx.answerCbQuery();
});

bot.action(/project_select:(.+)/, async (ctx) => {
  const projectName = ctx.match[1];
  const projects = await projectManager.listProjects();
  const proj = projects.find(p => p.name === projectName);
  if (!proj) return ctx.answerCbQuery('Project not found');

  const view = buildProjectActionView(proj);
  await ctx.editMessageText(view.text, { parse_mode: 'Markdown', reply_markup: view.reply_markup });
  await ctx.answerCbQuery();
});

bot.action(/proj_start:(.+)/, async (ctx) => {
  const projectName = ctx.match[1];
  await ctx.answerCbQuery('Starting fresh session...');
  const sessionName = await projectManager.startFreshSession(projectName);
  switchActiveSession(sessionName, ctx.chat.id);
  await ctx.reply(
    `🚀 *Fresh session started!*\nFocused on: \`${sessionName}\`\nSend any text message to interact.`,
    { parse_mode: 'Markdown' }
  );
});

bot.action(/proj_kill:(.+)/, async (ctx) => {
  const projectName = ctx.match[1];
  await projectManager.killProjectSessions(projectName);
  if (activeSessionName === `claude-${projectName}`) {
    switchActiveSession(null, null);
  }
  await ctx.answerCbQuery('Sessions terminated');
  await ctx.reply(`🛑 All sessions for \`${projectName}\` terminated.`, { parse_mode: 'Markdown' });
});

bot.action('noop', async (ctx) => {
  await ctx.answerCbQuery();
});

// Text Message Forwarding
bot.on('text', async (ctx) => {
  const text = ctx.message.text;

  if (text === '/cancel') {
    pendingArgsSkill = null;
    return ctx.reply('Action canceled.');
  }

  // Handle skill argument waiting
  if (pendingArgsSkill) {
    const fullCommand = `${pendingArgsSkill.command} ${text}`;
    pendingArgsSkill = null;
    if (!activeSessionName) {
      return ctx.reply('⚠️ No active Claude session. Use /projects to start one.');
    }
    await tmux.sendKeys(activeSessionName, fullCommand, true);
    return ctx.reply(`⚡ Injected \`${fullCommand}\` into \`${activeSessionName}\``, { parse_mode: 'Markdown' });
  }

  // Default: forward directly to active session
  if (!activeSessionName) {
    return ctx.reply(
      '⚪ *No active Claude Code session connected.*\nUse /projects to select a project and start a session.',
      { parse_mode: 'Markdown' }
    );
  }

  await tmux.sendKeys(activeSessionName, text, true);
});

// Launch Bot
await refreshSkills();
bot.launch().then(() => {
  console.log('🤖 Claude Code Telegram Remote Bridge is running...');
});

// Graceful shutdown
process.once('SIGINT', () => {
  if (activeMonitor) activeMonitor.stop();
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  if (activeMonitor) activeMonitor.stop();
  bot.stop('SIGTERM');
});
```

- [ ] **Step 4: Run full test suite**

Run: `node --test claude-telegram-bridge/test/*.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add claude-telegram-bridge/
git commit -m "feat(bridge): implement full Telegram bot daemon with bi-directional streaming"
```

---

### Task 9: End-to-End Verification & Documentation

**Files:**
- Create: `claude-telegram-bridge/README.md`
- Test: Manual execution verification script `claude-telegram-bridge/test/e2e_verify.sh`

**Interfaces:**
- Produces: Complete setup documentation, systemd service unit example, and executable test suite verification.

- [ ] **Step 1: Create verification script**

```bash
# claude-telegram-bridge/test/e2e_verify.sh
#!/usr/bin/env bash
set -e
echo "Running Bridge Unit and Integration Tests..."
npm test
echo "✅ All tests passed successfully!"
```

- [ ] **Step 2: Create complete README with deployment guide**

```markdown
# Claude Code Telegram Remote Bridge

A lightweight Node.js daemon that connects a Telegram bot to live Claude Code CLI sessions running in `tmux`.

## 🚀 Features
- 🔄 **Bi-directional CLI ↔ Telegram Sync:** Send prompt messages from Telegram directly to Claude Code; receive streaming terminal outputs in real-time.
- 🛠️ **Paginated Skills Browser:** Explore and execute built-in and custom skills with arguments.
- 📁 **Project Dashboard:** Start fresh sessions or terminate projects with single-tap buttons.
- 🛡️ **Whitelist Security:** Only authorized Telegram user IDs are allowed to interact.

## 📦 Quick Start
1. `npm install`
2. `cp .env.example .env` (fill in `TELEGRAM_BOT_TOKEN` and `ALLOWED_USER_IDS`)
3. `npm start`
```

- [ ] **Step 3: Run test suite to verify everything passes**

Run: `node --test claude-telegram-bridge/test/*.test.js`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add claude-telegram-bridge/README.md claude-telegram-bridge/test/e2e_verify.sh
git commit -m "docs(bridge): add README and verification script"
```

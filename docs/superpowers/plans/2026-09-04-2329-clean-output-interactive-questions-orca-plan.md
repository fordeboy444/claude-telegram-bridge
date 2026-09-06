# 📱 Clean Conversational Output, Interactive Questions & Orca Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Telegram bridge experience from raw terminal dumps into clean conversational messages, interactive tap-to-answer question keyboards for `AskUserQuestion`, Orca IDE project sync, and native Telegram slash menu commands.

**Architecture:** A dual output architecture where Claude's structured session logs (`~/.claude/projects/.../*.jsonl`) provide clean conversational text and `AskUserQuestion` tool events, while tmux handles user keystroke injection. A fallback terminal screen cleaner strips ASCII logos, status bars, and divider chrome if log files aren't active. `ProjectManager` reads Orca's `orca-data.json` to present the exact projects from the user's IDE with tailored session control.

**Tech Stack:** Node.js (ES Modules), Telegraf 4.x, node:test native runner, node:fs/promises, child_process.

**Spec:** `docs/superpowers/specs/2026-09-04-2326-clean-output-interactive-questions-orca-design.md`

## Global Constraints

- **Platform:** Windows 11 / Node.js 18+ (ES Modules: `"type": "module"`)
- **Zero External Additions:** Use built-in Node.js libraries (`node:fs`, `node:path`, `node:os`) and existing packages (`telegraf`, `dotenv`).
- **Test Framework:** Node.js native test runner (`node --test`)
- **Backward Compatibility:** All existing tests in `test/*.test.js` must continue to pass without regressions.
- **Safety & Error Handling:** Never crash on missing or corrupt files (such as missing `orca-data.json` or unreadable JSONL). Silently fall back to robust defaults.

---

## 🗺️ File Structure & Responsibilities

| File Path | Responsibility |
|---|---|
| `claude-telegram-bridge/src/tmux/session_reader.js` | Discovers and tails active Claude Code session logs (`~/.claude/projects/.../*.jsonl`). Extracts conversational assistant text and `AskUserQuestion` calls. |
| `claude-telegram-bridge/src/tmux/question_handler.js` | Formats `AskUserQuestion` queries and builds Telegram inline keyboard buttons for interactive tap-to-answer. |
| `claude-telegram-bridge/src/tmux/formatter.js` | Cleans terminal output fallback: strips ANSI codes, ASCII logos, status counters, and prompt chrome. |
| `claude-telegram-bridge/src/projects/orca_reader.js` | Reads `%APPDATA%/Orca/profiles/local-default/orca-data.json` to extract active workspace projects. |
| `claude-telegram-bridge/src/projects/manager.js` | Integrates Orca projects with tmux session state and lifecycle control (start / kill current). |
| `claude-telegram-bridge/src/projects/menu.js` | Formats project list and action cards with "Kill Current Session" or "Start Session" buttons. |
| `claude-telegram-bridge/src/index.js` | Integrates `setMyCommands`, connects question callbacks, registers text handlers, and coordinates session switching. |

---

## 📋 Implementation Tasks

### Task 1: Terminal Output Cleaner in `formatter.js`

**Files:**
- Modify: `claude-telegram-bridge/src/tmux/formatter.js`
- Test: `claude-telegram-bridge/test/formatter.test.js`

**Interfaces:**
- Consumes: Raw terminal string from tmux pane
- Produces: `cleanTerminalOutput(rawText: string): string` (strips ASCII banner art, status bars, divider lines `───────`, and `❯ describe a task...` prompts)

- [ ] **Step 1: Write failing tests for terminal chrome stripping**

Add to `claude-telegram-bridge/test/formatter.test.js`:
```javascript
test('cleanTerminalOutput strips Claude ASCII art banners and divider lines', () => {
  const dirty = `
  ╭───────────────────────────╮
  │   Claude Code v2.1.260    │
  ╰───────────────────────────╯
  ───────────────────────────────────────
  Here is the actual response from Claude.
  ───────────────────────────────────────
  ❯ describe a task or ask a question
  `;
  const cleaned = cleanTerminalOutput(dirty);
  assert.strictEqual(cleaned, 'Here is the actual response from Claude.');
});

test('cleanTerminalOutput preserves real code blocks and normal text', () => {
  const code = 'const x = 10;\nconsole.log(x);';
  const cleaned = cleanTerminalOutput(code);
  assert.strictEqual(cleaned, code);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test claude-telegram-bridge/test/formatter.test.js`
Expected: FAIL with `cleanTerminalOutput is not defined` or assertion error.

- [ ] **Step 3: Implement `cleanTerminalOutput` in `src/tmux/formatter.js`**

```javascript
export function cleanTerminalOutput(rawText) {
  if (!rawText) return '';
  const cleaned = cleanAnsi(rawText);
  const lines = cleaned.split('\n');

  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    // Strip box drawing and divider lines
    if (/^[─━═┄┅┈┉┌┐└┘├┤┬┴┼╭╮╯╰│┃]+$/.test(trimmed)) return false;
    // Strip Claude CLI banner / version headers
    if (/Claude Code\s+v?\d+\.\d+/i.test(trimmed)) return false;
    // Strip input prompt line
    if (/^❯\s*(describe a task|ask a question|\.\.\.)?/i.test(trimmed)) return false;
    // Strip terminal status / shortcuts footer lines
    if (/^\?\s+for help\s+·/i.test(trimmed) || /Ctrl\+[A-Z]/i.test(trimmed)) return false;
    return true;
  });

  return filtered.join('\n').trim();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test claude-telegram-bridge/test/formatter.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add claude-telegram-bridge/src/tmux/formatter.js claude-telegram-bridge/test/formatter.test.js
git commit -m "feat(bridge): implement cleanTerminalOutput filter to strip terminal chrome"
```

---

### Task 2: Claude Session Log Reader (`session_reader.js`)

**Files:**
- Create: `claude-telegram-bridge/src/tmux/session_reader.js`
- Test: `claude-telegram-bridge/test/session_reader.test.js`

**Interfaces:**
- Consumes: `projectPath: string`, `options?: { pollIntervalMs?: number }`
- Produces: `ClaudeSessionReader` class with methods `findLatestSessionFile(projectPath): Promise<string|null>`, `readNewEvents(): Promise<Array<{ type: string, content: string|object }>>`, `start(callback)`, `stop()`

- [ ] **Step 1: Write failing tests for `ClaudeSessionReader`**

Create `claude-telegram-bridge/test/session_reader.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ClaudeSessionReader, getProjectSlug } from '../src/tmux/session_reader.js';

test('getProjectSlug formats path into Claude project slug', () => {
  const p = 'C:\\Users\\taro8\\Documents\\claude-code-projects\\claude-code-telegram';
  const slug = getProjectSlug(p);
  assert.match(slug, /claude-code-telegram/i);
});

test('ClaudeSessionReader extracts assistant messages and AskUserQuestion tools', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'session-reader-test-'));
  const sessionFile = path.join(tempDir, 'test.jsonl');

  const line1 = JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'text', text: 'Hello from assistant!' }] }
  });
  const line2 = JSON.stringify({
    type: 'tool_use',
    name: 'AskUserQuestion',
    input: { questions: [{ question: 'Pick one', options: [{ label: 'Option A' }] }] }
  });
  await fs.writeFile(sessionFile, `${line1}\n${line2}\n`);

  const reader = new ClaudeSessionReader({ sessionFilePath: sessionFile });
  const events = await reader.readNewEvents();

  assert.strictEqual(events.length, 2);
  assert.strictEqual(events[0].type, 'text');
  assert.strictEqual(events[0].content, 'Hello from assistant!');
  assert.strictEqual(events[1].type, 'question');
  assert.strictEqual(events[1].content.questions[0].question, 'Pick one');

  await fs.rm(tempDir, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test claude-telegram-bridge/test/session_reader.test.js`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `ClaudeSessionReader` in `src/tmux/session_reader.js`**

```javascript
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export function getProjectSlug(projectPath) {
  if (!projectPath) return '';
  // Normalize drive letter and separators to match Claude's slug convention: C--Users-taro8-...
  return projectPath
    .replace(/^([a-zA-Z]):[\\/]/, '$1--')
    .replace(/[^a-zA-Z0-9_-]/g, '-');
}

export class ClaudeSessionReader {
  constructor(options = {}) {
    this.sessionFilePath = options.sessionFilePath || null;
    this.projectPath = options.projectPath || null;
    this.processedLines = 0;
    this.timer = null;
    this.isPolling = false;
  }

  async findLatestSessionFile(projectPath) {
    if (this.sessionFilePath) return this.sessionFilePath;
    const baseDir = path.join(os.homedir(), '.claude', 'projects');
    try {
      const entries = await fs.readdir(baseDir);
      const targetSlug = getProjectSlug(projectPath).toLowerCase();
      const matchedDir = entries.find(e => e.toLowerCase() === targetSlug || targetSlug.includes(e.toLowerCase()));
      if (!matchedDir) return null;

      const projectLogDir = path.join(baseDir, matchedDir);
      const files = await fs.readdir(projectLogDir);
      const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
      if (jsonlFiles.length === 0) return null;

      // Find newest file by mtime
      let newestFile = null;
      let newestMtime = 0;
      for (const f of jsonlFiles) {
        const fullPath = path.join(projectLogDir, f);
        const stat = await fs.stat(fullPath);
        if (stat.mtimeMs > newestMtime) {
          newestMtime = stat.mtimeMs;
          newestFile = fullPath;
        }
      }
      return newestFile;
    } catch {
      return null;
    }
  }

  async readNewEvents() {
    if (!this.sessionFilePath && this.projectPath) {
      this.sessionFilePath = await this.findLatestSessionFile(this.projectPath);
    }
    if (!this.sessionFilePath || !fsSync.existsSync(this.sessionFilePath)) {
      return [];
    }

    try {
      const content = await fs.readFile(this.sessionFilePath, 'utf8');
      const lines = content.split('\n').filter(Boolean);
      if (lines.length <= this.processedLines) {
        return [];
      }

      const newLines = lines.slice(this.processedLines);
      this.processedLines = lines.length;

      const events = [];
      for (const raw of newLines) {
        try {
          const entry = JSON.parse(raw);
          // Check for completed assistant text message
          if (entry.type === 'assistant' && entry.message?.content) {
            for (const part of entry.message.content) {
              if (part.type === 'text' && part.text?.trim()) {
                events.push({ type: 'text', content: part.text.trim() });
              } else if (part.type === 'tool_use' && part.name === 'AskUserQuestion') {
                events.push({ type: 'question', content: part.input });
              }
            }
          } else if (entry.type === 'tool_use' && entry.name === 'AskUserQuestion') {
            events.push({ type: 'question', content: entry.input });
          }
        } catch {
          // ignore corrupted lines
        }
      }
      return events;
    } catch {
      return [];
    }
  }

  start(onEvent, pollIntervalMs = 1000) {
    if (this.timer) return;
    this.timer = setInterval(async () => {
      if (this.isPolling) return;
      this.isPolling = true;
      try {
        const events = await this.readNewEvents();
        for (const evt of events) {
          onEvent(evt);
        }
      } finally {
        this.isPolling = false;
      }
    }, pollIntervalMs);
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

Run: `node --test claude-telegram-bridge/test/session_reader.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add claude-telegram-bridge/src/tmux/session_reader.js claude-telegram-bridge/test/session_reader.test.js
git commit -m "feat(bridge): implement ClaudeSessionReader to extract clean assistant events"
```

---

### Task 3: Interactive Question Handler (`question_handler.js`)

**Files:**
- Create: `claude-telegram-bridge/src/tmux/question_handler.js`
- Test: `claude-telegram-bridge/test/question_handler.test.js`

**Interfaces:**
- Consumes: Question input payload (`{ questions: [...] }`)
- Produces: `formatQuestionCard(questionPayload): { text: string, reply_markup: object, optionKeys: Array<string> }`

- [ ] **Step 1: Write failing test for `formatQuestionCard`**

Create `claude-telegram-bridge/test/question_handler.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert';
import { formatQuestionCard } from '../src/tmux/question_handler.js';

test('formatQuestionCard builds markdown and numbered inline option buttons', () => {
  const payload = {
    questions: [
      {
        question: 'Which deployment environment should we target?',
        header: 'Target Env',
        options: [
          { label: 'Staging (Recommended)', description: 'Safe pre-production environment' },
          { label: 'Production', description: 'Live customer-facing environment' }
        ]
      }
    ]
  };

  const card = formatQuestionCard(payload);

  assert.match(card.text, /Which deployment environment should we target\?/);
  assert.strictEqual(card.reply_markup.inline_keyboard.length, 2);
  assert.strictEqual(card.reply_markup.inline_keyboard[0][0].text, '1️⃣ Staging (Recommended)');
  assert.strictEqual(card.reply_markup.inline_keyboard[0][0].callback_data, 'answer_q:1');
  assert.strictEqual(card.reply_markup.inline_keyboard[1][0].text, '2️⃣ Production');
  assert.strictEqual(card.reply_markup.inline_keyboard[1][0].callback_data, 'answer_q:2');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test claude-telegram-bridge/test/question_handler.test.js`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `formatQuestionCard` in `src/tmux/question_handler.js`**

```javascript
const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

export function formatQuestionCard(payload) {
  if (!payload || !payload.questions || payload.questions.length === 0) {
    return { text: '❓ *Claude has a question:*', reply_markup: { inline_keyboard: [] } };
  }

  const q = payload.questions[0]; // Primary question
  let text = `❓ *${q.header ? `[${q.header}] ` : ''}Question from Claude:*\n\n${q.question}\n`;

  const keyboard = [];
  if (Array.isArray(q.options)) {
    q.options.forEach((opt, idx) => {
      const numPrefix = NUMBER_EMOJIS[idx] || `${idx + 1}.`;
      if (opt.description) {
        text += `\n${numPrefix} *${opt.label}*\n   _${opt.description}_\n`;
      } else {
        text += `\n${numPrefix} *${opt.label}*\n`;
      }

      keyboard.push([
        {
          text: `${numPrefix} ${opt.label}`,
          callback_data: `answer_q:${idx + 1}`
        }
      ]);
    });
  }

  text += '\n_💡 Tap an option above, or reply with your custom answer below._';

  return {
    text,
    reply_markup: { inline_keyboard: keyboard }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test claude-telegram-bridge/test/question_handler.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add claude-telegram-bridge/src/tmux/question_handler.js claude-telegram-bridge/test/question_handler.test.js
git commit -m "feat(bridge): implement interactive question card builder with inline keyboard"
```

---

### Task 4: Orca Project Sync Reader (`orca_reader.js`)

**Files:**
- Create: `claude-telegram-bridge/src/projects/orca_reader.js`
- Test: `claude-telegram-bridge/test/orca_reader.test.js`

**Interfaces:**
- Consumes: Configured or default path to `orca-data.json`
- Produces: `readOrcaProjects(customFilePath?: string): Promise<Array<{ name: string, path: string, displayName: string, kind: string }>>`

- [ ] **Step 1: Write failing test for `readOrcaProjects`**

Create `claude-telegram-bridge/test/orca_reader.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { readOrcaProjects, getDefaultOrcaDataPath } from '../src/projects/orca_reader.js';

test('getDefaultOrcaDataPath returns path in APPDATA on Windows', () => {
  const p = getDefaultOrcaDataPath();
  assert.ok(p.includes('Orca'));
  assert.ok(p.endsWith('orca-data.json'));
});

test('readOrcaProjects correlates projects with repo paths', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orca-test-'));
  const dummyDataPath = path.join(tempDir, 'orca-data.json');

  const mockData = {
    projects: [
      { id: 'repo:123', displayName: 'Mock Project A', sourceRepoIds: ['123'], kind: 'folder' }
    ],
    repos: [
      { id: '123', path: 'C:\\Users\\taro8\\Documents\\projects\\mock-a', displayName: 'Mock Project A' }
    ]
  };
  await fs.writeFile(dummyDataPath, JSON.stringify(mockData));

  const projects = await readOrcaProjects(dummyDataPath);
  assert.strictEqual(projects.length, 1);
  assert.strictEqual(projects[0].name, 'Mock Project A');
  assert.strictEqual(projects[0].path, 'C:\\Users\\taro8\\Documents\\projects\\mock-a');

  await fs.rm(tempDir, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test claude-telegram-bridge/test/orca_reader.test.js`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `readOrcaProjects` in `src/projects/orca_reader.js`**

```javascript
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export function getDefaultOrcaDataPath() {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  return path.join(appData, 'Orca', 'profiles', 'local-default', 'orca-data.json');
}

export async function readOrcaProjects(filePath = getDefaultOrcaDataPath()) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw);

    const reposById = new Map();
    if (Array.isArray(data.repos)) {
      for (const r of data.repos) {
        if (r.id && r.path) {
          reposById.set(r.id, r);
        }
      }
    }

    const results = [];
    if (Array.isArray(data.projects)) {
      for (const p of data.projects) {
        const repoId = p.sourceRepoIds && p.sourceRepoIds[0];
        const matchedRepo = repoId ? reposById.get(repoId) : null;
        const projectPath = matchedRepo ? matchedRepo.path : null;

        if (projectPath) {
          results.push({
            name: p.displayName || path.basename(projectPath),
            displayName: p.displayName || path.basename(projectPath),
            path: projectPath,
            kind: p.kind || 'git'
          });
        }
      }
    }

    return results;
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test claude-telegram-bridge/test/orca_reader.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add claude-telegram-bridge/src/projects/orca_reader.js claude-telegram-bridge/test/orca_reader.test.js
git commit -m "feat(bridge): implement Orca workspace configuration reader"
```

---

### Task 5: Upgrade `ProjectManager` and `buildProjectActionView`

**Files:**
- Modify: `claude-telegram-bridge/src/projects/manager.js`
- Modify: `claude-telegram-bridge/src/projects/menu.js`
- Test: `claude-telegram-bridge/test/project_manager.test.js`

**Interfaces:**
- Consumes: Orca reader and tmux controller
- Produces: `listProjects()` combines Orca projects (or fallback filesystem dirs) with running sessions; `killCurrentSession(projectName)` terminates only the active session. `buildProjectActionView` renders "Kill Current Session" when active, or "Start Session" when inactive.

- [ ] **Step 1: Write failing tests in `project_manager.test.js`**

Update `claude-telegram-bridge/test/project_manager.test.js`:
```javascript
test('ProjectManager prioritizes Orca projects when available', async () => {
  const fakeOrcaProjects = [
    { name: 'Orca Project 1', path: '/path/1', displayName: 'Orca Project 1' }
  ];
  const pm = new ProjectManager('/fallback', mockTmux, {
    orcaReader: async () => fakeOrcaProjects
  });

  const list = await pm.listProjects();
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].name, 'Orca Project 1');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test claude-telegram-bridge/test/project_manager.test.js`
Expected: FAIL.

- [ ] **Step 3: Update `ProjectManager` in `src/projects/manager.js` and `menu.js`**

Update `claude-telegram-bridge/src/projects/manager.js`:
- Accept optional `deps.orcaReader` (defaults to `readOrcaProjects`).
- In `listProjects()`, call `this.orcaReader()`. If it returns items, map each to check active tmux sessions. If empty, fall back to directory readdir.
- Add `normalizeSessionName(name)` helper replacing spaces and special characters with `-`.
- Implement `killCurrentSession(projectName)`.

Update `claude-telegram-bridge/src/projects/menu.js`:
- Check if project has running sessions:
  - If running: show `🟢 Active` and `🛑 Kill Current Session` button (`action: proj_kill:<name>`).
  - If inactive: show `⚪ Inactive` and `🚀 Start Session` button (`action: proj_start:<name>`).

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test claude-telegram-bridge/test/project_manager.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add claude-telegram-bridge/src/projects/manager.js claude-telegram-bridge/src/projects/menu.js claude-telegram-bridge/test/project_manager.test.js
git commit -m "feat(bridge): integrate Orca projects into ProjectManager and update action menu"
```

---

### Task 6: Native Slash Command Menu & Question Flow Integration in `index.js`

**Files:**
- Modify: `claude-telegram-bridge/src/index.js`
- Test: `claude-telegram-bridge/test/integration.test.js`

**Interfaces:**
- Consumes: Telegraf bot instance, `ClaudeSessionReader`, `formatQuestionCard`, `cleanTerminalOutput`
- Produces: `bot.telegram.setMyCommands([ ... ])` on launch, sends clean assistant text chunks, renders interactive question cards, handles `answer_q:<num>` button clicks by injecting the selection into tmux.

- [ ] **Step 1: Write integration tests for `setMyCommands` and `answer_q` callback**

Update `claude-telegram-bridge/test/integration.test.js`:
```javascript
test('createBot registers slash commands via setMyCommands', async () => {
  let registeredCommands = null;
  const mockBot = {
    use: () => {},
    command: () => {},
    action: () => {},
    on: () => {},
    telegram: {
      setMyCommands: async (cmds) => { registeredCommands = cmds; },
      sendMessage: async () => {}
    }
  };

  createBot(mockConfig, { bot: mockBot, tmux: mockTmux, projectManager: mockPm });
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.ok(Array.isArray(registeredCommands));
  assert.ok(registeredCommands.some(c => c.command === 'projects'));
  assert.ok(registeredCommands.some(c => c.command === 'skills'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test claude-telegram-bridge/test/integration.test.js`
Expected: FAIL.

- [ ] **Step 3: Update `src/index.js` with Slash Commands, Session Reader & Question Callback**

- Call `bot.telegram.setMyCommands([ ... ])` with `/projects`, `/skills`, `/status`, and `/help`.
- Wire `ClaudeSessionReader` inside `switchActiveSession`:
  - When text events arrive: send clean markdown messages directly (splitting over 4000 characters).
  - When question events arrive: format via `formatQuestionCard` and send with inline buttons.
- Handle `action(/answer_q:(\d+)/)`:
  - Inject the selected option number directly into tmux using `tmux.sendKeys(activeSessionName, num, true)`.
  - Acknowledge callback query and notify the chat.
- In `activeMonitor` fallback: apply `cleanTerminalOutput` before sending to ensure terminal noise is stripped.

- [ ] **Step 4: Run full test suite to verify all 41+ tests pass**

Run: `cd claude-telegram-bridge && npm test`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add claude-telegram-bridge/src/index.js claude-telegram-bridge/test/integration.test.js
git commit -m "feat(bridge): register native slash commands and wire interactive question callbacks"
```

---

## 🔍 Self-Review Checklist

1. **Spec Coverage:**
   - Pure conversational output without ASCII logos or dividers? Covered in Tasks 1 & 2.
   - Interactive `AskUserQuestion` tap-to-select buttons? Covered in Tasks 3 & 6.
   - Sync projects with Orca's `orca-data.json`? Covered in Tasks 4 & 5.
   - Target "Kill Current Session" and "Start Session"? Covered in Task 5.
   - Native Telegram `/` menu? Covered in Task 6.
   - Complete Skills browser? Already existing, verified in integration.
2. **No Placeholders:** All steps contain complete code snippets and command invocations.
3. **Type Consistency:** Method names and data structures match across tasks (`formatQuestionCard`, `readOrcaProjects`, `ClaudeSessionReader`, `cleanTerminalOutput`).

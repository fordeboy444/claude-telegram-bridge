# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository is a workspace dedicated to remote Telegram interfaces for AI coding assistants. It contains multiple complementary implementations:

- `claude-telegram-bridge/`: Active lightweight Node.js daemon (ES Modules). Connects Telegram directly to live Claude Code CLI sessions running inside `tmux` with bi-directional streaming, terminal diffing, ANSI stripping, interactive paginated skills browser, and project session management.
- `claude-code-telegram-main/`: Python 3.10+ agentic platform built with Poetry, `python-telegram-bot`, and `claude-agent-sdk`. Detailed project-specific guidelines live in `claude-code-telegram-main/CLAUDE.md`.
- `antigravity-telegram-suite-main/`: Node.js suite controlling Antigravity IDE via Telegram using Chrome DevTools Protocol (CDP).

---

## Commands

### `claude-telegram-bridge` (Node.js)

```bash
cd claude-telegram-bridge

# Install dependencies
npm install

# Run full test suite (Node native test runner)
npm test

# Run a single test file
node --test test/auth.test.js
node --test test/tmux.test.js

# Start the bridge daemon
npm start
```

Configuration: Copy `claude-telegram-bridge/.env.example` to `.env`:

- `TELEGRAM_BOT_TOKEN`: Bot token from @BotFather
- `ALLOWED_USER_IDS`: Comma-separated authorized Telegram numeric IDs (unauthorized requests are dropped silently)
- `PROJECTS_DIR`: Path to project folders (defaults to current working directory)
- `TMUX_PATH`: Path to `tmux` executable (default `tmux`)
- `POLL_INTERVAL_MS`: Terminal pane capture polling frequency (default `1000`)

### `claude-code-telegram-main` (Python)

```bash
cd claude-code-telegram-main

# Install dependencies
make dev              # All dependencies including dev
make install          # Production dependencies only

# Run bot
make run              # Standard run
make run-debug        # Debug logging

# Run tests
make test             # Full test suite with coverage
poetry run pytest tests/unit/test_config.py -k test_name -v   # Single test

# Linting & Formatting
make lint             # Black, isort, flake8, mypy
make format           # Auto-format
poetry run mypy src   # Type checking only
```

---

## High-Level Architecture: `claude-telegram-bridge`

```
 📱 Telegram Client (Phone / Desktop)
        │
        │  [ HTTPS Long-Polling / Telegraf ]
        ▼
 🤖 Node.js Bridge Daemon (`claude-telegram-bridge/src/index.js`)
   ├── 🛡️ Auth Middleware (`src/auth.js`) -> Drops non-whitelisted user IDs
   ├── 📁 Project Manager (`src/projects/manager.js`) -> Lists dirs & tracks active tmux sessions
   ├── 🛠️ Skills Scanner (`src/skills/scanner.js`) -> Discovers SKILL.md frontmatter & built-ins
   ├── 🎛️ Interactive Menus (`src/skills/menu.js`, `src/projects/menu.js`) -> Paginated keyboards
   └── 🔄 Output Monitor (`src/tmux/monitor.js`) -> Polling loop with smart terminal diffing
        │
        │  [ Native child_process `tmux` CLI ]
        ▼
 🖥️ Tmux Terminal Multiplexer
   └── Session: `claude-<project>`
        └── Active Claude Code CLI Process
```

### Key Modules &amp; Responsibilities

- `**src/index.js**`: Application entry point and orchestrator. Wires Telegraf bot, registered Telegram commands (`/projects`, `/skills`, `/status`, `/help`), interactive callback query handlers (answering questions, running skills, managing projects), and routes incoming messages to tmux.
- `**src/tmux/controller.js**`: Low-level wrapper executing `tmux` CLI commands (`hasSession`, `listSessions`, `newSession`, `killSession`, `sendKeys`, `capturePane`, `setSessionOption`, `getSessionOption`). Handles input escaping and error suppression.
- `**src/tmux/session_reader.js**`: Real-time reader for Claude CLI JSONL transcript logs in `~/.claude/projects/<slug>`. Extracts assistant text and `AskUserQuestion` calls as structured events. Binds to the connected tmux session's own transcript via the `@claude_session_id` tmux option (falls back to newest-file for legacy sessions).
- `**src/tmux/question_handler.js**`: Formats `AskUserQuestion` tool calls into Telegram markdown cards with numbered emoji inline keyboards (`answer_q:<number>`).
- `**src/projects/orca_reader.js**`: Discovers workspaces configured in Orca editor (`orca-data.json`), correlating project names with local repository paths.
- `**src/tmux/monitor.js` &amp; `formatter.js`**: Fallback polling loop capturing tmux pane content, computing line diffs, stripping ANSI codes and terminal chrome banners (`cleanTerminalOutput`), debouncing output, and streaming via `telegram_chunker.js`.
- `**src/skills/scanner.js` &amp; `menu.js`**: Scans `.claude/skills` across workspace, user home directory, and active project for YAML frontmatter. Builds interactive Telegram inline keyboards with 6-item pagination, inspect views, immediate run triggers, and argument input prompts.
- `**src/projects/manager.js` &amp; `menu.js`**: Discovers projects (both local directory folders and Orca workspaces), correlates live `claude-<name>` tmux sessions, starts fresh sessions, and terminates existing sessions.
- `**src/auth.js**`: Pure middleware checking incoming `ctx.from.id` against `ALLOWED_USER_IDS`. Drops unauthorized messages with zero response to prevent reconnaissance.

---

## Workflow: Superpowers Plugin

This workspace uses the [Superpowers](https://github.com/obra/superpowers) plugin. Follow its skills:

- **Invoke `telegram-bot-api` or `onorca-api` skills when you do work related to Telegram or Orca** — invoke the skill before you do research, planning, or implementation for that topic.
- **Skill Lifecycle & Manual Invocation Order**:
  1. The user manually invokes `superpowers:brainstorming`.
  2. When brainstorming is complete, tell the user to run `/clear`, then prompt to invoke `superpowers:writing-plans`.
  3. When writing the plan is complete, tell the user to run `/clear`, then prompt to invoke `superpowers:subagent-driven-development`.
  4. After subagent execution finishes, development completes.
- Bugs, test failures, unexpected behavior → `superpowers:systematic-debugging` before proposing fixes.
- Before claiming anything works → `superpowers:verification-before-completion` (run the command, show the output).

## Plan &amp; Spec File Naming (overrides plugin default)

Plugin default is date-only. Always include the **time alongside the date in the actual file name** so same-day artifacts sort chronologically and don't collide:

- Plans: `docs/superpowers/plans/YYYY-MM-DD-HHMM-<feature-name>.md`
- Specs / design docs: `docs/superpowers/specs/YYYY-MM-DD-HHMM-<topic>-design.md`

`HHMM` = 24-hour local time at creation. Example: `2026-09-04-1432-voice-retry-design.md`. State the date + time in the document header too.

---

## Memory

Global project memory directory is configured in `.claude/settings.local.json`:

- `autoMemoryDirectory`: `C:/Users/taro8/Documents/claude-code-projects/claude-code-telegram/.claude/memory`

### Memory Rules

- Save during the session, not only at the end.
- `MEMORY.md` is auto-loaded each session, but cut at 200 lines. Keep the index to one line per memory.
- Save a memory for every feature added, changed, or removed, plus any other notable repo event. Do it as the work happens — do not batch it to session end.
- Write to `.claude/memory/`, one fact per file, and update the `MEMORY.md` index each time.
- On a change: update the existing note in place. On a removal: delete the old note completely — no stale mentions of deleted features anywhere in memory.
- Use absolute dates (2026-09-06, never "today" or "yesterday").
- Memory must always show the current state of the repo, not its history.


---
last_mapped_commit: e9e6d103c3f0fd409b3ef0bccf515ab9c64500a4
last_mapped_at: 2026-10-05
---
<!-- refreshed: 2026-10-05 -->

# Architecture

**Analysis Date:** 2026-10-05

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                     Telegram Interface                       │
│                 (Telegraf Bot / Telegram API)                │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Bridge Daemon                          │
│               `C:\...\src\index.js` (Main Orchestrator)      │
└────────┬──────────────────────┬──────────────────────┬────────┘
         │                      │                     │
         ▼                      ▼                     ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   Tmux Control    │   │  Session Reader   │   │   Project Mgr    │
│ `src/tmux/`       │   │ `src/tmux/`       │   │ `src/projects/`   │
└────────┬─────────┘   └────────┬──────────┘   └────────┬─────────┘
         │                      │                     │
         ▼                      ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Host OS / Tmux Sessions                      │
│     (Claude Code CLI running in detached tmux sessions)     │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Bot Orchestrator** | Manages Telegram bot lifecycle, command routing, and active session state. | `src/index.js` |
| **TmuxController** | Executes shell commands to manage tmux sessions, send keys, and capture panes. | `src/tmux/controller.js` |
| **SessionReader** | Polls Claude's `.jsonl` transcript files to stream responses back to Telegram. | `src/tmux/session_reader.js` |
| **ProjectManager** | Resolves project directories and manages the mapping between projects and tmux sessions. | `src/projects/manager.js` |
| **Skill Scanner** | Discovers available Claude skills from system and project directories. | `src/skills/scanner.js` |
| **Question Handler** | Parses Claude's interactive question modals into Telegram inline keyboards. | `src/tmux/question_handler.js` |

## Pattern Overview

**Overall:** Proxy/Bridge Pattern

**Key Characteristics:**
- **Asynchronous Communication:** Uses Telegraf for incoming Telegram events and a polling file-reader for outgoing Claude responses.
- **Decoupled Execution:** The bridge does not run Claude itself; it manipulates an existing `tmux` session where Claude Code is running.
- **Stateful Mapping:** Maintains a mapping between a Telegram `chatId` and a specific `tmux` session.

## Layers

**Interface Layer:**
- Purpose: Handle Telegram Bot API interactions.
- Location: `src/index.js`
- Contains: Bot command handlers, action callbacks, and message forwarding.
- Depends on: All other layers.
- Used by: Telegram users.

**Control Layer:**
- Purpose: Translate high-level bridge intents into low-level system commands.
- Location: `src/tmux/` and `src/projects/`
- Contains: Tmux wrapper, project resolution logic.
- Depends on: Node.js `child_process` and `fs`.
- Used by: Interface Layer.

**Observation Layer:**
- Purpose: Monitor the internal state of the Claude CLI via its logs.
- Location: `src/tmux/session_reader.js`
- Contains: JSONL file polling and event parsing.
- Depends on: Node.js `fs/promises`.
- Used by: Interface Layer.

## Data Flow

### Primary Request Path (User $\to$ Claude)

1. User sends text/command to Telegram bot (`src/index.js:644`)
2. Bot identifies active session (`activeSessionName`)
3. `TmuxController.sendKeys` injects text into the tmux session (`src/tmux/controller.js:65`)
4. Claude Code CLI processes input in the terminal.

### Primary Response Path (Claude $\to$ User)

1. Claude Code writes a turn entry to a `.jsonl` transcript file.
2. `ClaudeSessionReader` detects file growth via polling (`src/tmux/session_reader.js:191`)
3. Reader parses JSONL line into event types: `user`, `text`, `question`, or `result` (`src/tmux/session_reader.js:128`)
4. `src/index.js` receives event and sends corresponding message to Telegram (`src/index.js:214`)

**State Management:**
- In-memory state in `src/index.js` tracks `activeSessionName`, `activeChatId`, and `activeQuestion`.

## Key Abstractions

**Tmux Session Binding:**
- Purpose: Connects a Telegram user to a specific headless terminal.
- Examples: `src/index.js` (via `switchActiveSession`)
- Pattern: Session-based proxy.

**Skill Mapping:**
- Purpose: Dynamically maps discovered CLI skills to Telegram commands.
- Examples: `src/skills/scanner.js`
- Pattern: Registry pattern.

## Entry Points

**Main Daemon:**
- Location: `src/index.js`
- Triggers: Executed via `node src/index.js` or Docker entrypoint.
- Responsibilities: Initialize config, launch Telegraf bot, and re-attach to existing tmux sessions.

## Architectural Constraints

- **Polling Dependency:** Response streaming relies on Claude Code writing to disk (`.jsonl` files). If disk I/O is delayed, Telegram responses lag.
- **Tmux Reliance:** Requires a functioning `tmux` installation on the host OS.
- **Single Session per Chat:** While the bridge supports multiple projects, a single Telegram chat is bound to one active session at a time.

## Error Handling

**Strategy:** Fail-soft with user notifications.

**Patterns:**
- **Session Death Detection:** `ensureSessionAlive` checks if the tmux session still exists before sending keys; if not, it notifies the user and clears the binding.
- **Fallback Messaging:** `sendWithFallback` ensures messages reach the user even if primary delivery methods fail.

## Cross-Cutting Concerns

**Logging:** Console-based logging for daemon events.
**Validation:** `auth.js` provides a whitelist middleware to restrict bot access to specific Telegram User IDs.
**Authentication:** Environment-variable based bot token and user whitelist.

---

*Architecture analysis: 2026-10-05*

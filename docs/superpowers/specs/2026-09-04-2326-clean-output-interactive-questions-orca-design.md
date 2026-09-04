# 📱 Claude Telegram Bridge: Clean Conversational Output, Interactive Questions & Orca Sync Design

**Date & Time:** 2026-09-04 23:26  
**Status:** Approved by User  
**Target Module:** `claude-telegram-bridge`

---

## 🎯 1. Overview & Goals

The `claude-telegram-bridge` connects a Telegram bot to live Claude Code CLI sessions running inside `tmux`. Currently, the bridge periodically takes full ASCII snapshots of the terminal pane via `capture-pane`, causing:
1. 🛑 **Visual Glitches:** Repeated ASCII banners, logos, progress dashboards, and terminal dividers are sent as code blocks to Telegram.
2. 🔄 **Duplicate Messages:** Background spinner/time updates trigger false diffs that re-send the entire dashboard.
3. ❓ **Lack of Interactive Prompts:** `AskUserQuestion` prompts appear as unformatted text instead of interactive tap-to-select buttons.
4. 📁 **Unfiltered Projects:** `/projects` shows arbitrary filesystem directories rather than the active projects in the Orca IDE workspace.

### 🌟 Desired Outcome
- **Pure Conversational Output:** Telegram receives clean, markdown-rendered text messages from Claude without terminal chrome, ASCII logos, or progress counters.
- **Interactive Question Prompts:** When Claude asks questions via `AskUserQuestion`, Telegram renders the question with inline buttons for the options. Tapping an option immediately responds to Claude, and freeform text input is supported.
- **Context-Aware Project Management:** `/projects` syncs directly with Orca's active project list (`orca-data.json`). Selecting a project lets the user kill only the currently active session or start a session if inactive.
- **Native Telegram Slash Menu:** Typing `/` in Telegram shows `/projects`, `/skills`, `/status`, and `/help` directly in the native keyboard menu.
- **Complete Skills Integration:** Comprehensive listing of built-in Claude commands, project-level skills, and global user skills with tap-to-run buttons.

---

## 🏗️ 2. Architecture & Data Flow

```
                      ┌───────────────────────────────┐
                      │    📱 Telegram User Client    │
                      └───────┬───────────────▲───────┘
                              │               │
                              │ (text/buttons)│ (clean replies & buttons)
                              ▼               │
                      ┌───────────────────────┴───────┐
                      │    🤖 claude-telegram-bridge  │
                      └───────┬───────────────▲───────┘
                              │               │
             [⌨️ sendKeys]    │               │ [📜 Event Reader]
                              ▼               │
                    ┌──────────────────┐      │
                    │ 🖥️ Tmux Session  │      │
                    │ Running Claude   │      │
                    └────────┬─────────┘      │
                             │                │
                             ▼                │
               ┌──────────────────────────────┴───────┐
               │ 📝 Claude Session JSONL Transcript   │
               │ (~/.claude/projects/<slug>/<id>.jsonl│
               └──────────────────────────────────────┘
```

---

## 🔍 3. Component Specifications

### 3.1 💬 Clean Output Engine (`src/tmux/session_reader.js` & `src/tmux/formatter.js`)
- **Primary Source:** Rather than diffing raw terminal screen dumps, the bridge watches the active project's Claude session log (`~/.claude/projects/.../*.jsonl`).
- **Event Extraction:**
  - Extracts completed `assistant` role messages (`message.content` text blocks).
  - Extracts `AskUserQuestion` tool calls (`name: "AskUserQuestion"`).
  - Discards intermediate thinking blocks, bash tool executions, and file edits to keep Telegram focused on final responses.
- **Terminal Fallback Filter:** If no JSONL log is found for a custom session, `formatter.js` strips all terminal UI noise (Claude ASCII logo, status bars, divider lines `───────`, and `❯ describe a task`).

### 3.2 ❓ Interactive Question Prompts (`src/tmux/question_handler.js`)
- When `AskUserQuestion` is detected:
  - Formats the question text cleanly in Markdown.
  - Generates inline keyboard buttons corresponding to each question option.
  - Appends an "Other (Type below)" option if appropriate.
- **Interaction Flow:**
  1. Tapping an inline button immediately sends the selection key/number to the active `tmux` session via `sendKeys`.
  2. Typing a text message forwards custom text directly to the active prompt.

### 3.3 📂 Orca Project Sync (`src/projects/manager.js` & `src/projects/menu.js`)
- **Source of Truth:** Reads `%APPDATA%/Orca/profiles/local-default/orca-data.json`.
- **Project Discovery:** Matches `data.projects` with `data.repos` to list the exact active projects shown in the Orca sidebar:
  - `Main Agent`
  - `airtable-linkedin-content-system`
  - `hermes agent on hetzner`
  - `empty`
  - `relay-code-pi-agent`
  - `claude-code-telegram`
- **Session Actions:**
  - If user selects the **currently active project**:
    - Status: `🟢 Active (Session: claude-<name>)`
    - Action: `🛑 Kill Current Session` (terminates only this active session)
  - If user selects an **inactive project**:
    - Status: `⚪ No active current session in this project`
    - Action: `🚀 Start Session`

### 3.4 ⌨️ Telegram Slash Commands & Skills (`src/index.js` & `src/skills/scanner.js`)
- **Native Slash Menu:** Registers commands on startup using `bot.telegram.setMyCommands([ ... ])`:
  - `/projects` — Manage project sessions
  - `/skills` — Browse and run Claude skills
  - `/status` — View current active session
  - `/help` — Help & usage guide
- **Skills Catalog:** Scans and unifies:
  1. Built-in Claude commands (`/clear`, `/compact`, `/cost`, `/doctor`, `/help`, `/init`, `/review`, etc.).
  2. Local project skills: `./.claude/skills/`.
  3. Global user skills: `~/.claude/skills/` and cached plugins.

---

## 🚧 4. Error Handling & Edge Cases

- **Orca Config Missing / Corrupted:** Fallback to scanning the default `PROJECTS_DIR` directory gracefully.
- **Session Switching:** Ensure any active log watchers or tmux timers are stopped cleanly when switching projects.
- **Message Truncation:** Chunk long conversational messages using `splitTelegramMessage` to respect Telegram's 4096 character limit.

---

## ✅ 5. Acceptance Criteria

1. ❌ **No ASCII Diagrams:** Sending prompts or waiting for responses produces zero ASCII banners or terminal screen dumps in Telegram.
2. 💬 **Clean Assistant Replies:** Claude's conversational replies arrive as regular, clean text.
3. 🔘 **Tap-to-Answer Questions:** When Claude asks a question with choices, inline buttons appear in Telegram and tapping one answers the prompt immediately.
4. 📁 **Orca Project List:** `/projects` shows only the projects active in Orca with targeted "Kill Current Session" or "Start Session" buttons.
5. ⌨️ **Native `/` Menu:** Typing `/` in Telegram displays the full commands list with descriptions.
6. 🛠️ **Unified Skills:** `/skills` lists built-in commands alongside local and global skills with interactive execution.

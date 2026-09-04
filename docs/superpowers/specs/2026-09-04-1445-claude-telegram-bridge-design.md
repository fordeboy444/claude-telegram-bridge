# Claude Code Telegram Remote Bridge: System Design Specification

- **Date:** 2026-09-04
- **Time:** 14:45
- **Status:** Approved
- **Target Platforms:** Linux VPS (primary), macOS, Windows (WSL/Git Bash)

---

## 🎯 Executive Summary

The **Claude Code Telegram Remote Bridge** is a lightweight Node.js daemon that connects a Telegram bot to live [Claude Code](https://claude.ai/code) sessions running inside terminal multiplexer (`tmux`) sessions on a VPS or desktop. 

It provides:
1. **Bi-directional Terminal Mirroring:** Send messages from Telegram to Claude Code's CLI prompt, and stream terminal outputs back to Telegram in real-time.
2. **Interactive Paginated Skills Browser:** Two-step "Inspect & Run" interface to explore built-in Claude commands and custom `.claude/skills/` without memorizing names.
3. **Project & Session Management:** Simple `/projects` dashboard to switch projects, spin up fresh sessions with one tap, or terminate all sessions for a given project.
4. **Strict Security:** Whitelist-based authentication ensuring only authorized Telegram users can view or interact with the system.

---

## 🏗️ Architecture & Component Design

```
             ┌──────────────────────────────────────────────┐
             │            Authorized Telegram User          │
             └──────────────────────┬───────────────────────┘
                                    │ (Messages, Callback Queries)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               🤖 Claude Code Telegram Remote Bridge (Node.js)          │
│                                                                        │
│  ┌───────────────────────┐                  ┌───────────────────────┐  │
│  │   Auth Middleware     │                  │  Interactive Menus    │  │
│  │   (Whitelist Guard)   │                  │  • /skills (Pages)    │  │
│  └───────────┬───────────┘                  │  • /projects (Actions)│  │
│              │                              └───────────┬───────────┘  │
│              ▼                                          │              │
│  ┌──────────────────────────────────────────────────────┴───────────┐  │
│  │                       Session Orchestrator                       │  │
│  │   • Tracks active project & tmux session per user                │  │
│  │   • Discovers projects from filesystem                           │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────┴───────────────────────────────┐  │
│  │                    Tmux Controller & Streamer                    │  │
│  │   • send-keys (inject Telegram input into active CLI prompt)     │  │
│  │   • capture-pane (smart diff polling + ANSI strip + formatting)  │  │
│  │   • lifecycle (start fresh session, kill project sessions)       │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        🖥️ Host System / VPS                            │
│                                                                        │
│  tmux session: `claude-web-backend`                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ $ cd ~/projects/web-backend && claude                            │  │
│  │ > Fix the auth bug                                               │  │
│  │ [Tool: Read src/auth.ts]                                         │  │
│  │ [Output: Applied fix...]                                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎛️ Feature Specifications

### 1. 🔄 Bi-Directional CLI ↔ Telegram Sync

- **Input Injection (Telegram ➡️ CLI):**
  - Messages sent by the user in the Telegram chat are forwarded to the active `tmux` session via `tmux send-keys -t <session_name> "<content>" Enter`.
  - Supports multiline messages using escaped paste buffers.
- **Output Streaming (CLI ➡️ Telegram):**
  - The daemon polls the active `tmux` pane buffer (`tmux capture-pane -p -t <session_name> -S -100`) every 1000ms.
  - **Diff Engine:** Keeps track of the last captured line index and only extracts newly printed content.
  - **ANSI Cleansing:** Strips ANSI escape sequences, terminal spinner artifacts, and raw control characters.
  - **Message Debouncing & Rate Limiting:** Batches output lines and sends/edits Telegram messages every 1.5–2 seconds to stay well within Telegram's rate limits.
  - **Long Output Chunking:** Outputs longer than 4096 characters are split cleanly across multiple messages or formatted as readable code blocks.

---

### 2. 🛠️ Paginated Skills Browser ("Inspect & Run")

- **Discovery:**
  - Scans `.claude/skills/` (and global `~/.claude/skills/`) for `SKILL.md` files.
  - Includes core built-in Claude Code commands (`/clear`, `/compact`, `/cost`, `/doctor`, `/review`, `/help`).
  - Extracts frontmatter `name:` and `description:`.
- **Navigation Flow:**
  - Invoked with `/skills`.
  - Displays inline buttons arranged 6 per page:
    ```
    [ 🧠 brainstorming ]   [ 🐞 systematic-debug ]
    [ 📝 writing-plans ]   [ 🧪 tdd              ]
    [ 🔍 code-review   ]   [ 🌐 onorca-api       ]
    [ ◀️ Prev ]       [ 1 / 4 ]       [ Next ▶️ ]
    ```
- **Inspect & Run Modal:**
  - Tapping a skill opens the inspection card in-place:
    - **Title & Slug:** e.g., `superpowers:brainstorming`
    - **Description:** Clear summary of what the skill does.
    - **Buttons:**
      - `[ ▶️ Run Skill Now ]`: Injects `/skill-name` directly into the live `tmux` session.
      - `[ ✏️ Run with Arguments ]`: Prompts user to send custom arguments; once sent, injects `/skill-name <args>`.
      - `[ ⬅️ Back to Skills ]`: Returns to the paginated list.

---

### 3. 📁 Project & Session Management (`/projects`)

- **Project Discovery:**
  - Reads configured directories from `PROJECTS_DIR` (e.g., `~/projects/*`) or a static `projects.json`.
- **User Experience:**
  1. User types `/projects`.
  2. Bot presents a list of projects with status indicators:
     - `📁 [ web-backend ] (1 session running)`
     - `📁 [ mobile-app ] (idle)`
  3. Clicking a project opens the **Project Action View**:
     - `[ 🚀 Start Fresh Session ]`
       - If sessions exist for this project, kills old ones or creates a clean new session: `tmux new-session -d -s claude-<project_slug> -c <project_path> "claude"`.
       - Immediately switches user's Telegram focus to this session.
       - Confirms with: *"🚀 Fresh session started for `web-backend`! You can now send messages directly."*
     - `[ 🛑 Kill All Sessions in Project ]`
       - Runs `tmux kill-session -t claude-<project_slug>` for all matching sessions.
       - Confirms with: *"🛑 All sessions for `web-backend` terminated."*
     - `[ ⬅️ Back to Projects ]`: Returns to project list.

---

## 🛡️ Security & Access Control

1. **User Whitelist Guard:**
   - Every incoming Telegram message or callback query passes through auth middleware:
     ```javascript
     const allowedUsers = process.env.ALLOWED_USER_IDS.split(',').map(id => id.trim());
     if (!allowedUsers.includes(ctx.from.id.toString())) {
       return; // Silently ignore unauthorized requests
     }
     ```
2. **Path Containment:**
   - Projects can only be launched within approved directory trees configured in `.env`.
3. **No Direct Arbitrary Shell Execution:**
   - Messages are routed exclusively into the running `claude` CLI process in `tmux`, not executed as bare host shell scripts.

---

## 🧰 Tech Stack & Dependencies

- **Runtime:** Node.js (v18+) ES Modules
- **Telegram Framework:** `telegraf` (^4.16.0)
- **Terminal Multiplexer:** `tmux` (Native system CLI via Node `child_process`)
- **Metadata Parsing:** `gray-matter` (for YAML frontmatter in `SKILL.md`)
- **Configuration:** `dotenv`

---

## 📂 Project Structure

```
claude-telegram-bridge/
├── .env.example
├── package.json
├── src/
│   ├── index.js               # Entry point & bot bootstrap
│   ├── config.js              # Environment & config validation
│   ├── auth.js                # Telegram ID authorization middleware
│   ├── tmux/
│   │   ├── controller.js      # tmux command execution (new, kill, send-keys)
│   │   ├── monitor.js         # Pane output polling & diff engine
│   │   └── formatter.js       # ANSI cleaning & markdown formatting
│   ├── skills/
│   │   ├── scanner.js         # Scans .claude/skills & built-in commands
│   │   └── menu.js            # Paginated Telegram inline keyboard UI
│   ├── projects/
│   │   ├── manager.js         # Project discovery & session associations
│   │   └── menu.js            # Project action menu (Start fresh / Kill all)
│   └── utils/
│       └── telegram_chunker.js# Splits long messages cleanly
```

---

## ✅ Acceptance & Verification Criteria

1. **Bi-directional Sync:**
   - Running `tmux attach -t claude-<project>` in terminal and sending "hello" from Telegram results in "hello" appearing at the CLI prompt.
   - Claude's streaming terminal output is captured and sent back to Telegram within 2 seconds.
2. **Skills Navigation:**
   - `/skills` opens a clean paginated menu.
   - Prev/Next page navigation updates the menu message in place without spamming new messages.
   - Clicking a skill displays its description and "Run Skill Now" / "Run with Arguments" buttons.
3. **Project Lifecycle:**
   - `/projects` lists configured folders.
   - Tapping "Start Fresh Session" spawns the `tmux` session and sets Telegram focus.
   - Tapping "Kill All Sessions" cleans up the `tmux` session completely.
4. **Security:**
   - Messages from non-whitelisted Telegram IDs are completely ignored.

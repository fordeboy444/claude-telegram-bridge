---
last_mapped_commit: e9e6d103c3f0fd409b3ef0bccf515ab9c64500a4
last_mapped_at: 2026-10-05
---
# Codebase Structure

**Analysis Date:** 2026-10-05

## Directory Layout

```
[project-root]/
├── src/                    # Source code for the bridge daemon
│   ├── projects/          # Project & session management logic
│   ├── skills/             # Claude skill discovery & menu generation
│   ├── tmux/               # Tmux manipulation & transcript reading
│   └── utils/              # Shared helpers (messaging, chunking)
├── test/                   # Test suites for core components
├── hooks/                  # Shell scripts for lifecycle management
├── telegram-bridge-setup/  # Setup scripts and skill definitions
├── .planning/               # Codebase mapping and planning docs
└── Dockerfile              # Containerization configuration
```

## Directory Purposes

**`src/`:**
- Purpose: Main application logic.
- Contains: JavaScript modules for bot orchestration, tmux control, and session monitoring.
- Key files: `src/index.js` (entry point), `src/config.js` (config loader).

**`src/tmux/`:**
- Purpose: Low-level interface with the host's tmux environment.
- Contains: Session controllers, transcript readers, and output formatters.
- Key files: `src/tmux/controller.js`, `src/tmux/session_reader.js`.

**`src/projects/`:**
- Purpose: High-level project abstraction.
- Contains: Logic to list directories, start fresh sessions, and resolve project paths.
- Key files: `src/projects/manager.js`, `src/projects/menu.js`.

**`src/skills/`:**
- Purpose: Integration with Claude Code's skill system.
- Contains: Scanners for discovering `.md` skills and logic for generating Telegram keyboards.
- Key files: `src/skills/scanner.js`, `src/skills/menu.js`.

**`test/`:**
- Purpose: Component and integration testing.
- Contains: Unit tests for auth, config, tmux, and session reading.
- Key files: `test/integration.test.js`, `test/tmux.test.js`.

## Key File Locations

**Entry Points:**
- `src/index.js`: The main daemon process that launches the Telegraf bot.

**Configuration:**
- `src/config.js`: Loads settings from `.env` and environment variables.
- `.env.example`: Template for required environment variables.

**Core Logic:**
- `src/tmux/controller.js`: Wraps `tmux` CLI commands for key injection and pane capture.
- `src/tmux/session_reader.js`: Implements the polling logic for `.jsonl` transcripts.

**Testing:**
- `test/`: Directory containing the full test suite.

## Naming Conventions

**Files:**
- `*.js`: Standard JavaScript modules (ESM).
- `*.test.js`: Test files corresponding to source modules.
- `*.sh`: Shell scripts for host-level operations.

**Directories:**
- Plural nouns for module groups (e.g., `projects`, `skills`, `utils`).

## Where to Add New Code

**New Feature (Bot Commands/Logic):**
- Primary code: `src/index.js` (for routing) and corresponding module in `src/`
- Tests: `test/`

**New Tmux/CLI Capability:**
- Implementation: `src/tmux/controller.js`

**New Project Management Logic:**
- Implementation: `src/projects/manager.js`

**Utilities:**
- Shared helpers: `src/utils/`

## Special Directories

**`hooks/`:**
- Purpose: Scripts used by the deployment process to manage the daemon.
- Generated: No
- Committed: Yes

**`telegram-bridge-setup/`:**
- Purpose: Contains setup scripts and the `SKILL.md` definition for the bridge itself.
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-10-05*

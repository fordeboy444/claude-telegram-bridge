# Bridge Auto-Start, Single-Connection Swap, and Typing Hardening — Design

- **Date:** 2026-09-06 15:01
- **Status:** Approved in brainstorming session; pending spec review
- **Branch:** `feat/claude-telegram-bridge`

## Problem

The Telegram bridge daemon needs manual lifecycle control through two Claude Code skills (`telegram-bridge-connect`, `telegram-bridge-disconnect`). The `/projects` menu cannot swap the bridge connection to an already-running session of another project — a running project only offers a Kill button. The typing indicator has unverified paths: injections from skill runs and question-answer buttons never start typing, and a dead session can leave the indicator stuck.

## Requirements

1. Remove the `telegram-bridge-connect` and `telegram-bridge-disconnect` skills.
2. The bridge daemon starts automatically when Claude Code starts, and stops when Claude Code exits.
3. The user connects from Telegram via `/projects`.
4. The typing indicator works on every path and never sticks.
5. Input typed in Telegram appears in the CLI pane. Responses print on both the CLI and Telegram.
6. The bridge connects to exactly one tmux session at a time, regardless of project. Swapping projects swaps the connection; the old session keeps running.

## Decisions from brainstorming

| Topic | Decision |
|---|---|
| Project swap | Old tmux session keeps running in WSL; the bridge only rebinds its connection. A Connect button is added for running sessions. |
| Daemon stop | SessionEnd hook stops the daemon. Ownership is tracked with a PID file. |
| Typing | No specific symptom reported; verify and harden all paths. |
| Approach | A — minimal extension of existing files; no new modules. |
| Visuals | Diagrams shown as ASCII in chat; visual companion declined. |

## 1. Daemon lifecycle

```
Claude Code session start ──► .claude/hooks/telegram-bridge-start.sh
                               ├─ daemon already runs? ──► exit 0 (PID file untouched)
                               └─ daemon down? ─────────► start node src/index.js (hidden)
                                                           write PID to .claude/telegram-bridge.pid
Claude Code session end ────► .claude/hooks/telegram-bridge-stop.sh
                               ├─ PID file exists? ─────► kill that PID, delete the file
                               └─ no PID file? ────────► exit 0 (this session is not the owner)
```

- New `.claude/hooks/telegram-bridge-start.sh`:
  - Unsets `CLAUDE_CODE_CHILD_SESSION` before starting the daemon. The SessionStart hook inherits the Claude Code environment; without this, transcript saving gets disabled down the `wsl → tmux → claude` chain (see `src/index.js` startup note).
  - Checks for a running daemon with the same PowerShell `Get-CimInstance Win32_Process` pattern the removed `connect.sh` used.
  - If not running: `Start-Process node src/index.js` hidden, working directory `claude-telegram-bridge/`; writes the new process id to `.claude/telegram-bridge.pid`.
  - If running: exits 0 without touching the PID file (another session owns it).
- New `.claude/hooks/telegram-bridge-stop.sh`:
  - If `.claude/telegram-bridge.pid` exists and that PID is alive: kills it, deletes the file.
  - If no PID file exists: exits 0. This session did not start the daemon; another session owns it.
- Both hooks are registered in `.claude/settings.local.json` under `SessionStart` and `SessionEnd`, with absolute paths (same style as the existing `notify-on-stop.sh` entry).
- tmux sessions do **not** stop with the daemon. They keep their state in WSL. The next daemon start re-attaches to the single running session (rule in section 2).

**Known ceiling (ponytail):** single-owner PID file. With two concurrent Claude Code sessions, the second session's exit kills the first session's daemon. Upgrade path: a refcount file if concurrent sessions become routine.

## 2. Connection and swap

```
State: bridge connected to claude-alpha (reader bound to alpha's transcript)

Telegram: /projects → tap project "beta" → 🟢 Connect
   │
   ▼  bot.action proj_connect:beta
      switchActiveSession("claude-beta", chatId, path)
        ├─ stopTyping()
        ├─ reader(alpha).stop()        ← alpha tmux session KEEPS RUNNING
        ├─ read @claude_session_id of claude-beta
        └─ start reader(beta) bound to beta's transcript
   │
   ▼
Reply: "🔌 Connected to claude-beta (was claude-alpha)"
Swap back later: /projects → alpha → Connect — context intact, no restart
```

- `buildProjectActionView` (`src/projects/menu.js`): a running project shows **🟢 Connect** (`proj_connect:<name>`) plus the existing **🛑 Kill Current Session**; an idle project keeps **🚀 Start Session**.
- New `bot.action(/proj_connect:(.+)/)` in `src/index.js`: resolves the project and takes its first running session — the button only renders when one exists. If the session died between menu render and tap, it answers the callback with "Session not running" and returns. On success it calls `switchActiveSession` and replies with the old → new connection note.
- `switchActiveSession` already stops typing, stops the old reader, and clears stale echo-suppression state. No structural change.
- `attachExistingSession` (daemon start): attach only when **exactly one** `claude-*` session runs. With more than one, attach none; the user picks via `/projects`. Today it blindly picks `sessions[0]`.
- Text auto-attach stays as is: one running session → connect and forward the text; several → ask for `/projects`.
- Pre-inject liveness check: on incoming text, if the connected tmux session no longer exists, clear the connection and reply "🔴 Session ended. Use /projects." This prevents a silent `sendKeys` failure into a dead session.
- `proj_kill` stays: it terminates the project's sessions and disconnects if they held the connection.

## 3. Typing hardening

| Trigger | Action |
|---|---|
| Injection: text forward, `answer_q`, `skill_run_now`, `skill_run_args` completion | Start |
| Transcript event: user (includes CLI-typed input) | Start |
| Transcript events: text, question, result | Stop |
| Swap or disconnect | Stop |
| Session death detected by liveness tick | Stop + notify |

Rules:

- `startTyping` is added to every injection point: `answer_q`, `skill_run_now`, and the `pendingArgsSkill` completion path. Text forwarding already has it.
- Transcript-driven start/stop stays as implemented (result entries end every turn).
- `startTyping` rebinds when `chatId` changes: today an existing timer blocks the restart for a new chat.
- Liveness inside the typing tick: every 4 seconds the tick also checks `tmux.hasSession(activeSessionName)`. On death it stops typing, stops the reader, clears the connection, and sends "🔴 Session ended" once.

Telegram API facts (sendChatAction, core.telegram.org/bots/api#sendchataction): the typing status lasts 5 seconds or less, and clients clear it when a bot message arrives. The existing 4-second resend interval is therefore correct and stays.

## 4. Input and response flow — acceptance targets

```
Telegram: "hey"                  CLI pane (tmux claude-<project>)
   │ inject "Telegram user: hey"        │
   ├─────────────────────────────────────►  the input line appears in the pane
   │ [typing ON]                          │ Claude processes the request
   │                                      │ the reply prints in the pane (native CLI output)
   │ ◄──── transcript text event ────────┤
   │ [typing OFF]                         │
 reply message on Telegram          reply already visible on the CLI
```

- Telegram text is injected as `Telegram user: <text>`, so it is visible in the CLI pane exactly as sent, plus the source prefix. The prefix marks the origin for Claude and for echo suppression. Slash-command passthrough stays raw (no prefix).
- The reply reaches both sides by construction: the CLI pane renders it natively, and the bound transcript reader streams the assistant text to Telegram.
- CLI-typed input echoes to Telegram as `👤 CLI User: <text>` (existing behavior, covered by tests).
- One turn = one typing cycle: typing starts on injection or user event, stops on the first assistant text, question, or result.

## 5. Cleanup

- Delete `.claude/skills/telegram-bridge-connect/` and `.claude/skills/telegram-bridge-disconnect/` (SKILL.md and scripts).
- Keep `.claude/skills/telegram-bridge-setup/` for first-time `.env` configuration. Replace its closing "Use /telegram-bridge-connect to start the bridge" line with "The bridge starts automatically with Claude Code."
- `src/index.js`: remove the dead `TmuxMonitor` import, the unused `activeMonitor` state and its stop calls, and the unused `cleanTerminalOutput` import.
- `src/tmux/monitor.js` and its tests stay: the module is the documented fallback output path and is not referenced at runtime today.

## 6. Testing

Unit tests (Node native runner, `npm test`):

- `projects_menu.test.js`: a running project renders the Connect button; an idle project does not.
- `integration.test.js`:
  - `proj_connect` rebinds the active session and leaves the old session untouched.
  - typing starts on `answer_q`, `skill_run_now`, and the args-completion path.
  - typing stops and the connection clears when the liveness check fails.
  - `attachExistingSession` attaches with exactly one session, returns null with two.
- Manual verification (hooks): start Claude twice → one daemon; exit a session → the daemon it started is gone; a second session's exit does not stop a daemon it does not own.

End-to-end acceptance:

1. Start Claude Code. The daemon starts without any command.
2. In Telegram: `/projects` → project → Connect (or Start).
3. Send `hey`. The CLI pane shows `Telegram user: hey`. Both the CLI and Telegram show the reply.
4. While Claude works, the typing indicator shows. It stops at the first reply block.
5. Connect to a second project. The first session stays alive. Swap back. Context is intact.
6. While Claude is working (typing indicator active), kill the session from another pane. Within ~4 seconds Telegram shows "🔴 Session ended". If Claude was idle instead, the next text message reports the ended session.

## Files

| Action | Path |
|---|---|
| Delete | `.claude/skills/telegram-bridge-connect/` (whole directory) |
| Delete | `.claude/skills/telegram-bridge-disconnect/` (whole directory) |
| Create | `.claude/hooks/telegram-bridge-start.sh` |
| Create | `.claude/hooks/telegram-bridge-stop.sh` |
| Edit | `.claude/settings.local.json` (SessionStart, SessionEnd) |
| Edit | `claude-telegram-bridge/src/index.js` |
| Edit | `claude-telegram-bridge/src/projects/menu.js` |
| Edit | `.claude/skills/telegram-bridge-setup/SKILL.md` |
| Edit | `.claude/skills/telegram-bridge-setup/scripts/setup.sh` |
| Edit | `claude-telegram-bridge/test/projects_menu.test.js` |
| Edit | `claude-telegram-bridge/test/integration.test.js` |

## Out of scope

- No changes to the Python (`claude-code-telegram-main`) or Antigravity suites.
- No ConnectionManager extraction (approach B rejected).
- No changes to `src/tmux/monitor.js` beyond leaving it in place.
- No multi-user chat rebinding beyond the `chatId` guard fix.
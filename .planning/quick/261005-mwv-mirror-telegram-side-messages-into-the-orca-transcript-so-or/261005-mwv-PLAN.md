---
quick_id: 261005-mwv
title: Mirror Telegram-side messages into the Orca transcript
depends_on: []
files_modified:
  - src/index.js
  - src/tmux/transcript_mirror.js
  - test/transcript_mirror.test.js
  - test/integration.test.js
---

# Plan 261005-mwv — Mirror Telegram-side messages into the Orca transcript

## 🎯 Goal

Orca shows the full two-way conversation. Each message sent from Telegram appears as a user turn in the Claude session transcript JSONL. Orca reads that JSONL and renders the turn.

## 📚 Context — what research so far shows

**Bridge side (code-verified):**

- The bridge injects Telegram text into the tmux Claude CLI as `Telegram user: <text>` via `tmux send-keys -l` + Enter (src/index.js:661-665, src/tmux/controller.js:69-74). Slash commands pass through raw.
- The bridge tails the bound session transcript `/home/orca/.claude/projects/<slug>/<session-id>.jsonl` and relays turns to Telegram (src/tmux/session_reader.js:88-166). The bound id comes from the tmux option `@claude_session_id`, published by the SessionStart hook (src/projects/manager.js:15-35, hooks/claude-session-id-sync.sh).
- The bridge already assumes tmux-typed prompts become JSONL user turns: it suppresses the Telegram echo by matching `lastInjectedPrompt` against the user event within 10 s (src/index.js:223-229). This assumption is NOT verified on the live host.
- The bridge container and the Orca container both mount `orca-home` at `/home/orca` (Dockerfile `ENV HOME=/home/orca`, `PROJECTS_DIR=/home/orca`; COOLIFY_DEPLOY.md §2). Both see the same transcript files.

**Orca side (docs-verified, onorca.dev skill):**

- Orca renders past sessions from the on-disk session store — "Claude's `~/.claude` history" (docs: agents/session-history). File-driven views: the Agent Session History panel ("latest conversation turns", "First prompt") and "Open log" (raw JSONL). A scan runs periodically; "Refresh Session History" forces one.
- Orca Chat UI is a decoder over an Orca-run agent PTY (docs: agents/native-chat: "the terminal remains the source of truth"). The bridge tmux PTY lives in another container. No file write can reach that view.
- Orca is an extracted Electron AppImage at `/opt/orca/squashfs-root/` in the orca container (orca-coolify README). Its transcript parser JS is readable there.

**Unknown live facts that decide the fix:**

1. Does the bound session JSONL contain user turns for Telegram-sent text?
2. Which file do Orca-typed user turns land in — the same session file, or a different one?
3. Which fields does Orca's parser key on to render a user turn?

## ✅ Task 1 — Research: transcript ground truth and Orca rendering

Read-only investigation on the VPS. `docker exec` for inspection is established practice in this workspace. Never change deployment state via host commands.

1. **Locate the live artifacts.**
   - Containers: bridge app UUID `z51mkfyd0o7dh7zbnkdolryx`, orca app UUID `krno4lok0n60h987k687kwlw` (find names with `docker ps`).
   - Active tmux session and bound id:
     `docker exec <bridge> tmux list-sessions -F '#{session_name}'`
     `docker exec <bridge> tmux show-options -v -t <session> @claude_session_id`
2. **Ground truth in the JSONL (read-only, no new prompts needed).**
   - Grep recent Telegram turns: `grep -n 'Telegram user:' <bound>.jsonl | tail -3` under `/home/orca/.claude/projects/<slug>/`.
   - Capture the exact record shape of one Telegram-typed user turn (full JSON line).
   - Find user turns that do NOT start with `Telegram user:` in the same project dir. Note WHICH file each kind landed in (same session file or different files). This answers fact 2.
   - If no Telegram turn exists anywhere, run one controlled probe: create a throwaway tmux session in the bridge container, inject text with `tmux send-keys -l ...` + Enter (the exact Telegram path), wait, grep its JSONL, then kill the probe session.
3. **Orca parser fields.**
   - Grep the orca bundle for transcript markers: `docker exec <orca> sh -c "grep -rl 'jsonl' /opt/orca/squashfs-root/resources | head"` then inspect the session-history parsing code for the fields that mark a user turn (`type`, `message.role`, `userType`, `isMeta`, `isSidechain`, content shape). This answers fact 3.
4. **Live render check (if the web UI is reachable).** Orca web UI → right sidebar → Agents tab → find the bridge session → check "latest conversation turns" and "Open log". Press "Refresh Session History" first.
5. **Pick the branch.**
   - 🅰 **Branch A** — Telegram turns are MISSING from the JSONL → write-side fix (Task 2A).
   - 🅱 **Branch B** — Telegram turns ARE present and DO render in the file-driven views → the user reads a different session file or a PTY-driven Chat UI view. No safe bridge-side write exists. Close as evidence-only (Task 2B).
   - 🅲 **Branch C** — turns are present but the file view does not render them → shape mismatch. Fix = Task 2A, with the synthetic record carrying the parser-required fields from step 3.

## 🔧 Task 2 — Fix: make Telegram-sent messages appear in the Orca transcript

Implement ONE branch. Commit atomically per repo convention.

### Branch A/C — code fix

1. **New module `src/tmux/transcript_mirror.js`.**
   - Export `appendUserTurnRecord({ claudeHome, projectPath, sessionId, text })`.
   - Resolve the file the same way the reader does: import `getProjectSlug` (src/tmux/session_reader.js:11-17); build `<claudeHome>/projects/<slug>/<sessionId>.jsonl`.
   - Append ONE JSON line with the CLI's user-turn shape as verified in Task 1 (uuid, timestamp, cwd, sessionId, `type: "user"`, `message: { role: "user", content: <text> }`, plus the parser-required fields from Task 1 step 3).
   - Append only when the file already exists. Write only the bound session file. Never write a file the bridge does not own.
2. **Wire a pending-mirror in `src/index.js`, next to `lastInjectedPrompt` (src/index.js:41-42, 661-665).**
   - On each conversational injection, store `{ text, deadline: now + ~6 s }`. Skip slash passthrough — the CLI already records command turns as meta entries.
   - The reader's user event that matches the injected text (the existing suppression match, src/index.js:225) clears the pending mirror: the CLI recorded the turn. Write nothing.
   - If the deadline passes with no matching user event, call `appendUserTurnRecord` with the bound id (`tmux.getSessionOption(activeSessionName, '@claude_session_id')` at mirror time — handles /clear hops) and the active project path. If no bound id exists, skip the mirror.
   - Keep the deadline inside the 10 s suppression window. Then the mirror's own record never echoes back to Telegram.
3. **Tests (node --test).**
   - `test/transcript_mirror.test.js`: file resolution; record shape; no write when the file is absent.
   - `test/integration.test.js`: inject → CLI record arrives → no synthetic record; inject → no CLI record → synthetic record written.
   - `npm test` must pass. Baseline today: 135 tests.
4. **Deploy through the Coolify API** (POST `/api/v1/deploy`, app UUID `z51mkfyd0o7dh7zbnkdolryx`, branch `gsd-edition`). Never deploy from host commands. The public URL answering 503 is normal — the daemon has no HTTP server.
5. **Live verify.** Send a Telegram message → the JSONL gains the user turn → the Orca session view shows it → Telegram shows no double echo.

### Branch B — evidence close-out, no code

- Do not write into files the bridge does not own. Do not try to reach PTY-driven views — Chat UI decodes its own PTY (Orca docs: agents/native-chat).
- Record in the task report: which file holds the full two-way conversation, which Orca view renders it (session history / Open log), and which view cannot show bridge-injected turns.
- Save a memory note: how to see the two-way conversation in Orca. Report the finding to the team lead.

## 🔒 Guardrails

- Append only. Never rewrite, reorder, or truncate transcript lines.
- Write only the bound session file. Never the Orca-run session's file.
- A synthetic record must never duplicate a CLI record (pending-mirror dedupe).
- Keep the mirror inside the 10 s suppression window (src/index.js:225).
- Read-only host inspection only. All deployment changes go through the Coolify API.

## ✔️ Verification

- Branch A/C: the JSONL contains the Telegram user turn; Telegram shows no double echo; the Orca session view shows the turn; `npm test` passes.
- Branch B: the report proves the file-level transcript already holds both sides, and names the Orca view that renders it.
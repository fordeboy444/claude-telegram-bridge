---
quick_id: 261005-qnc
title: "/projects: pick a running project = resume its live session"
depends_on: []
files_modified: ["src/index.js"]
files_deleted: []
---

# Plan 261005-qnc — /projects: enter the live session instead of starting fresh

🔍 **Root cause (confirmed in code):**

- `bot.action(/project_select:(.+)/)` in `src/index.js:461-470` only renders the
  action card. It never focuses the chat on the live session.
- `buildProjectActionView` (`src/projects/menu.js:43-51`) shows only
  `proj_kill` (End Session) for a running project — there is no button that
  emits `proj_connect`, so the `proj_connect` handler
  (`src/index.js:495-512`) is unreachable dead code today.
- `startFreshSession` (`src/projects/manager.js:120-138`) kills the existing
  main session before launching a new one. Today nothing guards against a
  fresh start over a live session the user did not stop.

💡 **Design:** selection on a running project = resume. The card stays the same
shape (`buildProjectActionView` derives End Session from live tmux state), so
the user can still stop the session from the card. Fresh start stays possible
only through the explicit idle path: no live session, or the user pressed
End Session first (sibling 261005-qnd re-renders the card after that kill).

## Task 1 — project_select resumes a live session

📍 **File:** `src/index.js` (project_select handler, lines 461-470)

✅ **Steps:**

1. After finding `proj`, prefer the exact main session over suffix variants
   (`runningSessions` mixes `claude-<proj>` and `claude-<proj>-2`):

   ```js
   const preferred = proj.runningSessions?.includes(sessionNameFor(proj.name))
     ? sessionNameFor(proj.name)
     : proj.runningSessions?.[0];
   ```

2. When `preferred` exists AND `await tmux.hasSession(preferred)` is true:
   enter/resume it — call `switchActiveSession(preferred, ctx.chat.id, proj.path)`
   (same call shape as the `proj_connect` handler at lines 506-508), answer the
   callback with `🔌 Entered ${preferred}`, then still render
   `buildProjectActionView(proj)` via `ctx.editMessageText` so the End Session
   button stays reachable in the same card.
3. When no live session (or `hasSession` is false): keep today's behavior —
   answer the callback and render the action card only.

⚠️ **Edge cases:**

- Stale tmux list: `runningSessions[0]` may be dead — the `hasSession` guard
  falls back to the plain card; no crash.
- Enter while another chat session was active: `switchActiveSession` already
  handles teardown of the previous reader and question state
  (`src/index.js:182-196`); rely on it, add nothing.

## Task 2 — proj_start refuses to clobber a live session

📍 **File:** `src/index.js` (proj_start handler, lines 472-493)

✅ **Steps:**

1. At the top of the handler, after resolving `proj`, re-check live state just
   before `startFreshSession` (the card may be stale at press time):

   ```js
   let live = null;
   const candidates = [
     sessionNameFor(projectName),
     ...((proj?.runningSessions) || [])
   ];
   for (const s of candidates) {
     if (await tmux.hasSession(s)) { live = s; break; }
   }
   ```
2. If a live session (`live`) is found, resume instead: `switchActiveSession(live,
   ctx.chat.id, proj.path)`, answer `▶️ Resumed ${live}`, and reply
   `▶️ Resumed the \`${liveName}\` session (it was still running). End it first
   to start fresh.` — skip `startFreshSession` entirely.
3. Only when no live session exists, run the existing fresh-start path
   unchanged.

⚠️ **Edge cases:**

- `projectName` comes from callback regex — it must never reach a shell. It
  only feeds `sessionNameFor` and list/lookup comparisons (same mitigation as
  the existing `proj_kill` path).
- Handler already wraps errors in `runActionHandler` (lines 401-409): keep the
  new early-return inside it.

## Task 3 — Verify and commit

✅ **Steps:**

1. Run `npm test` if the suite runs locally; the repo has no build/lint step.
2. Manual smoke (next deploy, out of scope here — do NOT deploy):
   - `/projects` → pick a running (🟢) project → bot enters the session, card
     still shows `🛑 End Session`.
   - Press Start Session while a session is live (stale card) → bot resumes,
     does not kill.
   - End Session → fresh Start works (covered by sibling 261005-qnd).
3. Commit with message:
   `projects: resume live session on project select` +
   `Co-Authored-By: Claude Code <noreply@anthropic.com>`.

🔗 **Coordination note (sibling 261005-qnd):** both plans edit `src/index.js`.
This plan is the base (qnd depends on this one per its frontmatter); land qnc
first. qne/qnf also touch `src/index.js` but distinct handlers (/status,
/project-resources) — no line overlap with this plan.

<assumption_delta_decision>
No identity-model change: the noun "project session" stays single; entering a
live session reuses the existing `switchActiveSession` identity anchor and adds
no second platform, optional field, or parameter. Decision: no-change.
</assumption_delta_decision>

<coverage_note>
No external API integration: Telegram Bot API and tmux surfaces are already
integrated; this plan only reorders existing internal handler logic. Detector
does not fire — no matrix needed.
</coverage_note>

<threat_model>
Security enforcement (quick-batch): this plan edits command handler code only.

- ASVS level: L1 (quick-batch advisory; no project config.json declares a level).
- Threat: callback-data injection into `project_select:(.+)` / `proj_start:(.+)`
  regexes — already mitigated: `projectName` never interpolates into shell
  commands; it matches only through `sessionNameFor` and tmux session-list
  comparisons.
- Threat: resume path attaching a chat to a session it should not own —
  sessions are resolved from `projectManager.listProjects()` (host tmux state),
  not user text; unchanged trust boundary from `proj_connect`.
- Threat: unhandled `switchActiveSession` rejection leaving the card stale —
  handlers stay inside `runActionHandler` / existing try/catch fail-safe style.
- Blocking threshold: no new attack surface, no credential handling.
</threat_model>
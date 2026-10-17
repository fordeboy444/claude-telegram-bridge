---
quick_id: 261005-qnc
status: complete
completed: 2026-10-05
commit: b9d9d9e
files_modified:
  - src/index.js
---

# Summary 261005-qnc — /projects: Enter the Live Session

## What happened

Executed exactly per plan. Branch `gsd-edition`, primary checkout, no worktree.

- Task 1 (`src/index.js:461-484`) — `bot.action(/project_select:(.+)/)` now
  prefers the exact main session (`sessionNameFor(proj.name)` over suffix
  variants), enters it via `switchActiveSession(preferred, ctx.chat.id,
  proj.path)` guarded by `await tmux.hasSession(preferred)`, answers the
  callback with `🔌 Entered ${preferred}`, then still renders
  `buildProjectActionView(proj)` so `🛑 End Session` stays reachable in the
  same card. No live session → today's plain-card behavior (answers the
  callback, renders the card).
- Task 2 (`src/index.js:486-512`) — `bot.action(/proj_start:(.+)/)` re-checks
  live tmux state before `startFreshSession`: candidates = exact
  `sessionNameFor(projectName)` first, then `proj.runningSessions`. On a live
  hit it resumes via `switchActiveSession(live, ctx.chat.id, proj ? proj.path
  : null)`, answers `▶️ Resumed ${live}`, replies
  `▶️ Resumed the \`${live}\` session (it was still running). End it first to
  start fresh.`, and returns — `startFreshSession` never runs, so no live
  session gets clobbered by a stale card press.
- Handler stays inside `runActionHandler`; fresh-start path after the guard is
  unchanged. `projectName` still feeds only `sessionNameFor`, list lookups, and
  `hasSession` comparisons — never a shell string.

## Verification

- `node --check src/index.js`: clean.
- `npm test`: 156 pass, 0 fail (3074 ms). No new tests added; plan prescribed
  manual smoke at next deploy, out of scope here.

## Commits

- `b9d9d9e` — projects: resume live session on project select (code only,
  docs artifacts not committed)

## Notes

- No deviations from the plan.
- Coordination honored: landed as base of the qnc→qnd chain on top of
  `d9f0761` (qna). qnd (stale-button fix after End Session) runs next in
  `src/index.js`.
- Deploy not performed (batch runner owns redeploy).
---
quick_id: 261005-qnd
title: "/projects: refresh action card after End Session"
status: complete
completed_at: 2026-10-05
commit: 54a50fd
---

# Summary 261005-qnd — /projects: refresh action card after End Session

## What changed

- `src/index.js` — `proj_kill` handler now re-renders the project action card
  after the sessions are killed:
  - Re-fetches fresh project data via `projectManager.listProjects()` and
    matches by `name` or `displayName`, the same pattern as `proj_start`.
  - Calls `buildProjectActionView(fresh)` and `ctx.editMessageText(...)` so the
    card shows the idle status and `🚀 Start Session` before the confirmation
    reply lands (edit first, reply second — matches proj_start ordering).
  - `editMessageText` is wrapped in `try/catch` with a
    `console.warn('⚠️ Project card refresh failed:', err.message)` — covers the
    Telegram "message is not modified" case without crashing the daemon.
  - The `if (fresh)` guard skips the edit when the project no longer exists.

## Root cause (re-located in current code)

The plan anchored the handler at lines 514-532; after the qnc landed it sits at
`src/index.js:557-575` (the handler body at 570-574). It killed the sessions and
sent a new text reply but never edited the card, so the message kept showing
`🛑 End Session` and `🟢 Active`.

## Not changed

- `src/projects/menu.js` — no change needed. `buildProjectActionView` derives
  the button and status from `project.runningSessions`, which reads live tmux
  state, so a fresh `listProjects()` after the kill yields the idle card.
- `project_select` / `proj_start` (qnc) resume logic untouched and compatible:
  after End Session those paths see no live tmux session and use the fresh-start
  path as designed.

## Verification

- `npm test`: 162 pass, 0 fail.
- Deploy smoke (End Session → card flips to ⚪ idle + Start Session) is out of
  scope for this batch; no deploy performed.
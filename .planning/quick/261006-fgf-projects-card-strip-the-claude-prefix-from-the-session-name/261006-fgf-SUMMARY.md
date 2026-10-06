---
plan_id: 261006-fgf
title: "/projects card: strip the claude- prefix from the Status line session name"
status: complete
subsystem: telegram-bridge
tags: [ui, projects, display]
key-files:
  created: []
  modified:
    - src/projects/menu.js
    - test/project_manager.test.js
commits:
  - a831ecd: feat(261006-fgf): strip claude- prefix from /projects card Status session name
  - 9690802: test(261006-fgf): expect stripped session name in /projects card
metrics:
  tasks: 2/2
  tests: 165 pass, 0 fail
status_date: 2026-10-06
---

# Plan 261006-fgf — /projects card status line strips claude- prefix

🎯 The /projects action card Status line now shows `Session: web-backend`
instead of `Session: claude-web-backend`, matching the /status (261005-qne)
and /project-resources (261005-qnf) display convention.

## What was done

- **Task 1 (`a831ecd`):** Imported the existing `projectNameFromSession`
  helper (`src/projects/manager.js:49-51`) into `src/projects/menu.js` and
  wrapped `project.runningSessions[0]` in `buildProjectActionView`'s running
  branch. No local strip regex; single source of the naming rule preserved
  (per REVIEW.md IN-11). Idle branch, labels, and all `callback_data` values
  untouched.
- **Task 2 (`9690802`):** Updated `test/project_manager.test.js`:
  - Running-project assertion now expects `Active (Session: web-backend)`
    with the raw fixture `runningSessions: ['claude-web-backend']` unchanged.
  - Added negative assertion: `!runningView.text.includes('claude-')`.
  - Added suffix-variant case: `claude-web-backend-2` renders as
    `web-backend-2` (one literal leading strip only).

## Verification

- `node --test test/project_manager.test.js` — 13 pass, 0 fail.
- `npm test` — 165 pass, 0 fail (full suite green).
- `! grep -q "Session: claude-" src/projects/menu.js` — passed.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.
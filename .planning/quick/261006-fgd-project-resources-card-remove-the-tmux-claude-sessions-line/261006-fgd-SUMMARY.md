---
plan_id: 261006-fgd
quick_id: 261006-fgd
title: "/project-resources card: remove the tmux sessions line and retitle the card to Resources"
status: complete
phase: quick
plan: 261006-fgd
subsystem: telegram-bridge
tags: [display, diagnostics, quick-batch]
requires: []
provides: ["resources-card-retitle"]
affects: ["261006-fge (sibling item must declare depends_on: 261006-fgd and keep the new header + row absence)"]
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified:
    - src/diagnostics.js
    - test/diagnostics.test.js
decisions:
  - "Single atomic commit for both tasks — committing Task 1 alone would leave the header test assertion RED"
metrics:
  duration: "~4 min"
  completed: 2026-10-06
actuals:
  tasks: 2
  commits: 1
plan_head_before: 7bbfbaf
plan_head_after: f12818e
---

# Quick Item 261006-fgd Summary

Retitled the `/project-resources` card header to **Resources** and removed the
`tmux claude sessions` row; everything else on the card (active-session line,
four name-only sections) is unchanged, and `gatherDiagnostics` still returns
`tmuxSessions` in its contract.

## What Was Done

- **Task 1 — Retitle + drop row** (`src/diagnostics.js`): header entry is now
  `🗂️ *Resources*`; the `🖥️ *tmux claude sessions:*` push was removed,
  keeping the single trailing `''` blank buffer to preserve spacing. Untouched:
  active-session block, four name-only sections, `gatherDiagnostics`, and the
  command-name comments (sibling 261006-fge sweeps those with the `/diag` →
  `/resources` rename).
- **Task 2 — Tests** (`test/diagnostics.test.js`): header regex now expects
  `🗂️ \*Resources\*`; added an absence assertion for the literal
  `tmux claude sessions` in the live-tmux render test (alongside the existing
  absence asserts). `gatherDiagnostics` assertions intact.

## Verification

- `node --test test/diagnostics.test.js` — 10/10 pass.
- `npm test` — 165/165 pass.
- `grep -n "tmux claude sessions" src/diagnostics.js` — zero matches.
- `grep -n "Project Resources" src/diagnostics.js` — zero matches.

## Deviations from Plan

- **[Process] Single commit for Tasks 1+2** (`f12818e`): the plan's own
  verification note says Task 1 alone leaves the header assertion RED, so both
  tasks were committed as one atomic commit to keep every commit green.
- Test count note: full suite is 165 passing (plan cited baseline 162 — sibling
  items 261006-fgb/fgc commits were already in HEAD before this item ran).

## Known Stubs

None.

## Self-Check: PASSED

- `src/diagnostics.js` modified — exists (f12818e).
- `test/diagnostics.test.js` modified — exists (f12818e).
- Commit `f12818e` present in `git log`.
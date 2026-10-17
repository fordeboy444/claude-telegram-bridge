---
plan_id: 261006-fge
quick_id: 261006-fge
title: "Rename /project-resources to /resources and delete the hidden /diag alias"
status: complete
phase: quick-261006-fge
plan: 261006-fge
subsystem: telegram-bridge
tags: [rename, diagnostics, telegram-command, quick-batch]
requires: ["261006-fgd"]
provides: ["resources-command-surface"]
affects: []
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified:
    - src/index.js
    - test/integration.test.js
    - README.md
    - COOLIFY_DEPLOY.md
    - src/diagnostics.js
    - test/diagnostics.test.js
decisions:
  - "Grep gate adjusted to /diag\\b (word boundary): the plan's literal '/diag' pattern false-matched the legitimate './diagnostics.js' import, which the plan itself forbids renaming"
  - "Internal JS identifiers (gatherDiagnostics, formatDiagnosticsMessage, local diag vars) untouched — only the Telegram command surface was renamed"
metrics:
  duration: "~9 min"
  completed: 2026-10-06
actuals:
  tasks: 3
  commits: 3
plan_head_before: 9690802
plan_head_after: e6417a5
---

# Quick Item 261006-fge Summary

Renamed the resources diagnostic command to its final name `/resources` and
permanently deleted the hidden `/diag` alias. Exactly one route to the
resources card exists: `bot.command('resources', ...)`. Menu, /start, /help,
README, deploy guide, and all comments reference the new name; internal JS
identifiers are untouched.

## What Was Done

- **Task 1 — RED test contract** (`test/integration.test.js`, 81a923d): the
  createBot test's four old command assertions were replaced with six new ones —
  `resources` present in the menu, `diag` and `project-resources` absent from
  the menu, handler registered as `handlers.commands.resources`, and
  `handlers.commands.diag` / `handlers.commands['project-resources']`
  undefined. Confirmed RED (1 fail on the new assertion, 24 other tests pass).
- **Task 2 — GREEN rename** (`src/index.js`, 7a08dc0): menu entry became
  `{ command: 'resources', description: 'Project skills & plugin resources' }`;
  /start bullet and /help sentence renamed to /resources;
  `handleProjectResources` → `handleResources` with a single
  `bot.command('resources', ...)` registration; both old registration lines
  (`project-resources` and hidden `diag`) deleted outright; `like /diag for
  /doctor` reference dropped from the /interrupt comment and the hidden-alias
  sentence dropped from the card comment.
- **Task 3 — Docs & comments** (README.md, COOLIFY_DEPLOY.md,
  src/diagnostics.js, test/diagnostics.test.js, e6417a5): README command table
  row renamed (action text and position unchanged); deploy-guide check 2
  rewritten to the plan's wording for the /resources card; diagnostics.js
  header comment now names /resources without the "/diag is a hidden alias"
  parenthetical, and line-22 comment reads "/resources card";
  test/diagnostics.test.js header comment renamed. 261006-fgd's card content
  (🗂️ *Resources* header, no tmux row) preserved — nothing reverted.

## Verification

- `node --test test/integration.test.js` — RED before Task 2 (1 new-assertion
  fail), 25/25 pass after.
- `npm test` — 165/165 pass (baseline matches 261006-fgd's count).
- `grep -rn -e 'project-resources' -e "command('diag')" -e '/diag\b'
  src README.md COOLIFY_DEPLOY.md` — zero matches.
- Repo-wide sweep: the only remaining old-name mentions are the intentional
  absence-assertions inside test/integration.test.js (plus .planning docs).

## Deviations from Plan

- **[Rule 3 - Blocking verification gate] `/diag` grep pattern refined to
  `/diag\b`:** the plan's verify commands used a literal `/diag` pattern, which
  substring-matches the legitimate import `./diagnostics.js` in src/index.js —
  the very import the plan forbids renaming. The word-boundary form still
  catches genuine `/diag` command mentions (verified: matches nothing now that
  all mentions are removed). Test and doc behavior unaffected.

## Known Stubs

None.

## Self-Check: PASSED

- All six listed files modified — exist on disk (commits 81a923d, 7a08dc0, e6417a5).
- Commits 81a923d, 7a08dc0, e6417a5 present in `git log` (gsd-edition branch).
- Full suite 165/165 green at HEAD.
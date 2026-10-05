---
plan_id: 261005-qnf
quick_id: 261005-qnf
title: "/project-resources: strip the claude- prefix from session names"
depends_on: []
files_modified:
  - src/diagnostics.js
  - test/diagnostics.test.js
files_deleted: []
---

# Plan 261005-qnf — /project-resources: strip the claude- prefix from session names

## Goal

🎯 The active session line and the `tmux claude sessions` line show the project
folder name only (`my-app`), with no `claude-` prefix.

⚠️ Ordering note (batch coordinator decision, 2026-10-05): sibling item 261005-qnb
rewrites the same format block in `src/diagnostics.js` and declares
`depends_on: ["261005-qnf"]`. Both planners initially declared a dependency on
the other (cycle). Canonical order: qnf lands first (tiny prefix strip), then
qnb reworks the block and carries the strip forward through
`projectNameFromSession`. This plan's own frontmatter now has no dependency; it
also must not touch command registration in `src/index.js`.

## Current behavior

- `src/diagnostics.js:108-117` — `formatDiagnosticsMessage` prints
  `Active session:` from `diag.activeSession` (raw, e.g. `claude-my-app`) and
  `tmux claude sessions:` from `diag.tmuxSessions` (raw names).
- `src/diagnostics.js:71` — `gatherDiagnostics` collects names from
  `tmux.listSessions('claude-')`.
- `src/projects/manager.js:49-51` — exported helper
  `projectNameFromSession(sessionName)` removes one leading `claude-`.
  `src/diagnostics.js` already imports it.

## Design

💡 Strip at display time only, in `formatDiagnosticsMessage`.

- ✅ Keep `gatherDiagnostics` returning raw tmux names. Callers compare them
  against real tmux session names; do not break that contract.
- ✅ In `formatDiagnosticsMessage`:
  - `Active session:` line prints `projectNameFromSession(diag.activeSession)`.
  - `tmux claude sessions:` line maps each name through
    `projectNameFromSession` before wrapping in backticks.
  - Suffix variants behave correctly: `claude-my-app-2` → `my-app-2` (only the
    literal leading `claude-` is removed), which matches item 261005-qne's
    accepted behavior for `/status`.

<assumption_delta_decision>
- Detector: not run (quick-batch item, no phase section; probe would skip).
- Reasoned verdict: `no-change`. `projectNameFromSession` already names the
  generalized "project name" noun; this plan only widens its use to a display
  path. No singular→plural seam is crossed.
</assumption_delta_decision>

<api_coverage_check>
No external API integration: this plan changes Telegram message rendering only;
no new service, SDK, or HTTP surface is added. (Detector skipped — quick-batch
item with no phase section — reasoned opt-out recorded here instead.)
</api_coverage_check>

<schema_push_check>
No schema-relevant files in scope (no Prisma/Payload/Drizzle/Supabase/TypeORM
paths). Skip silently.
</schema_push_check>

<threat_model>
Security enforcement is not active (no `.planning/config.json` with
`workflow.security_asvs_level`); no blocking threats apply. The change alters
display strings only — session names come from the host's local tmux and are
rendered inside an already-authorized user chat. No new input surface, no
trusted-boundary change.
</threat_model>

## Tasks

### Task 1 — Strip the prefix at display time

Files: `src/diagnostics.js`

1. In `formatDiagnosticsMessage`, change:
   - Line ~110: print `projectNameFromSession(diag.activeSession)` in the
     backtick slot; keep the `activeSessionAlive` status text unchanged.
   - Line ~115: map `diag.tmuxSessions` through `projectNameFromSession`
     before the `` ` ``-wrap join; keep the `'none'` fallback and the
     `*tmux claude sessions:*` label unchanged.
2. Use the already-imported `projectNameFromSession` — do not add a local
   duplicate regex.
3. Do not change `gatherDiagnostics` data shape.

Verification:
- `node --test test/diagnostics.test.js` passes.
- Grep check: no new `replace(/^claude-` regex appears in `src/diagnostics.js`.

### Task 2 — Update tests

Files: `test/diagnostics.test.js`

1. In `test('formatDiagnosticsMessage renders readable Telegram markdown')`
   (line 161): input fixtures stay `claude-my-app`; replace
   `assert.match(message, /claude-my-app/)` with:
   - `assert.match(message, /`my-app`/)` (project name shown)
   - `assert.ok(!/claude-my-app/.test(message))` (raw name gone)
2. Add one focused test — suffixed session: feed
   `tmuxSessions: ['claude-my-app-2']` and assert `my-app-2` appears with no
   `claude-` prefix and no double strip of the inner text.
3. Leave all `gatherDiagnostics` assertions unchanged (raw names still flow).

Verification:
- `node --test test/diagnostics.test.js` passes with the new assertions.

## Task order

Task 1 → Task 2 (tests assert Task 1's output).

## Out of scope

- ❌ Renaming `/diag` → `/project-resources` (261005-qnb).
- ❌ Skill sources block, source paths, skill-count rows (261005-qnb).
- ❌ `/status` session names (261005-qne).
- ❌ Deploy to Coolify.

## Risks

⚠️ Markdown parse: `projectNameFromSession` output goes inside backticks the
same as today; no parse-mode risk.
⚠️ Merge risk with 261005-qnb in the same function — both are small line edits
in `formatDiagnosticsMessage`; qnb merges first (`depends_on`).
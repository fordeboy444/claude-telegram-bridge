---
plan_id: 261006-fgf
quick_id: 261006-fgf
title: "/projects card: strip the prefix from the Status line session name"
depends_on: []
files_modified:
  - src/projects/menu.js
  - test/project_manager.test.js
files_deleted: []
---

# Plan 261006-fgf — /projects card: strip the claude- prefix from the session name

## Goal

🎯 The /projects action card's Status line shows the project folder name
(`web-backend`) inside `Session:`, with no tmux prefix — same display
convention /status and /project-resources already use (items 261005-qne and
261005-qnf).

- **Before:** `📊 *Status:* 🟢 Active (Session: claude-web-backend)`
- **After:** `📊 *Status:* 🟢 Active (Session: web-backend)`

## Current behavior

- `src/projects/menu.js:27-31` — `buildProjectActionView(project)` renders
  `🟢 Active (Session: ${project.runningSessions[0]})` using the RAW tmux
  session name straight out of `runningSessions` (e.g. `claude-web-backend`).
- `runningSessions` mixes `claude-<proj>` with `-2`-suffixed variants
  (`src/index.js:474`); names are `claude-` + `normalizeName(projName)`.
- Reusable helper: `projectNameFromSession(sessionName)` in
  `src/projects/manager.js:49-51` — removes one leading claude- prefix,
  passes non-prefixed names through unchanged, guards falsy input.
- Existing tests: `test/project_manager.test.js:161-163` feeds
  `runningSessions: ['claude-web-backend']` and asserts the RAW name in the
  card text — that assertion is the behavior this item reverses and must be
  updated.
- `menu.js` currently imports nothing from `manager.js`; `manager.js` does not
  import `menu.js` (no cycle: its imports are node builtins + `orca_reader.js`).

## Design

💡 Strip at display time only, in `buildProjectActionView` — the same pattern
qne (/status) and qnf (/project-resources) established.

- ✅ Import `projectNameFromSession` from `./manager.js` in
  `src/projects/menu.js` and apply it to `project.runningSessions[0]` in the
  Status line. Do NOT write a new local strip regex (helper is the single
  source of the naming rule, per `.planning/cleanup/REVIEW.md` IN-11).
- ✅ Keep everything else in `buildProjectsMenu` and `buildProjectActionView`
  unchanged: labels, idle text, buttons, `callback_data` values (`project_select:`,
  `proj_start:`, `proj_kill:` use `project.name`, not the session name).
- ✅ Do NOT change the shape of `runningSessions` or `listProjects` — raw tmux
  names still flow (callers compare them against real tmux sessions,
  `src/projects/manager.js:159` and `src/index.js:504`).
- ✅ Suffix variants behave correctly: a `claude-web-backend-2` session shows
  as `web-backend-2` (only the literal leading prefix is removed) — matches the
  accepted /status behavior from 261005-qne.
- ✅ Idle branch text (`⚪ No active current session in this project`) is
  untouched.

<assumption_delta_decision>
- Detector: not run (quick-batch item, no phase section).
- Reasoned verdict: `no-change`. `projectNameFromSession` already names the
  generalized "project name" noun; this plan only applies it to one more
  display path. No singular→plural seam is crossed.
</assumption_delta_decision>

<api_coverage_check>
No external API integration: this plan changes Telegram message rendering
only; no new service, SDK, or HTTP surface is added.
</api_coverage_check>

<schema_push_check>
No schema-relevant files in scope (no Prisma/Payload/Drizzle/Supabase/TypeORM
paths). Skip silently.
</schema_push_check>

<threat_model>
Security enforcement active (ASVS level 1, block on `high`).

## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| host tmux → Telegram chat | Session names shown in the card originate from the host's tmux, not from Telegram users |

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-261006-fgf-01 | Tampering (info display) | `buildProjectActionView` Status line | low | accept | Session names reaching the card are host-created via `sessionNameFor` (`claude-` + `normalizeName`, chars `[a-zA-Z0-9_-]` only — `src/projects/manager.js:40-47`), so post-strip output is injection-safe plain text; no Telegram-user-controlled input feeds this line, and the strip does not alter any `callback_data`. Nothing at high+ severity; no blocking threat under `security_block_on: high`. |

## STRIDE Note

The change removes a rendering step (prefix) rather than adding input handling;
the trust boundary set is unchanged. `proj_kill:`/`project_select:` payloads
continue to carry `project.name` exactly as today.
</threat_model>

## Tasks

### Task 1 — Strip the prefix at display time

Files: `src/projects/menu.js`

1. Add `import { projectNameFromSession } from './manager.js';` at the top of
   `src/projects/menu.js`.
2. In `buildProjectActionView` (line 28-31), change the running branch to wrap
   the session name through the helper:
   `🟢 Active (Session: ${projectNameFromSession(project.runningSessions[0])})`.
3. Leave the idle branch, card labels (Project/Path/Status), and all
   `callback_data` values untouched.
4. Do not add a local strip regex or modify `runningSessions` anywhere.

Verification:
- `node --test test/project_manager.test.js` passes (Task 2's updated test
  drives this).
- `! grep -q "Session: claude-" src/projects/menu.js` — the compound
  `Active (Session:` literal must only ever be followed by the helper call.

### Task 2 — Update the test to expect the stripped name

Files: `test/project_manager.test.js`

1. In `test('buildProjectActionView renders appropriate buttons based on
   running status')` (lines 151-167):
   - Keep the fixture `runningSessions: ['claude-web-backend']`.
   - Replace `assert.ok(runningView.text.includes('Active (Session: claude-web-backend)'))`
     (line 163) with `Active (Session: web-backend)`.
   - Add `assert.ok(!runningView.text.includes('claude-'))` — the raw tmux
     name no longer appears anywhere in the card text.
2. Add one focused assertion for a suffix-variant session: feed
   `buildProjectActionView({ name: 'web-backend', path: '/projects/web-backend', runningSessions: ['claude-web-backend-2'] })`
   and assert the text contains `Active (Session: web-backend-2)` (one literal
   leading strip only; nothing inside the suffix is double-stripped).
3. Do not alter the idle-project assertions or button assertions — they still
   hold.

Verification:
- `node --test test/project_manager.test.js` passes with the new assertions.

## Task order

Task 1 → Task 2 (tests assert Task 1's output). Run order is safe either way
once both land, but execute as given so the negative assertion is meaningful.

## Verification

- `node --test test/project_manager.test.js` — targeted, fast.
- `npm test` — full suite (162+ tests) stays green; no other module renders
  the card, so the blast radius is exactly these two files.

## Out of scope

- ❌ `/diag` → `/resources` rename and its docs/tests (261006-fge).
- ❌ Thinking-effort line on /status (261006-fgc).
- ❌ "tmux claude sessions" line / "Resources" retitle (261006-fgd).
- ❌ Deploying to Coolify.

## Risks

⚠️ Merge risk with 261006-fge: none — this plan does not touch
`src/index.js` (hence `depends_on: []`); fge's rename work lives in command
registration, help/start text, README, and diagnostics-adjacent tests, none of
which overlap `src/projects/menu.js` or `test/project_manager.test.js`.

⚠️ Markdown parse risk: none — the slot holds `normalizeName` output
(`[a-zA-Z0-9_-]`), unchanged in character class, one word shorter than before.
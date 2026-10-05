---
quick_id: 261005-qne
depends_on: []
files_modified:
  - src/status_report.js
  - test/status_report.test.js
files_deleted: []
---

# Plan 261005-qne — /status: strip the claude- prefix from the session name

## Goal

The /status message shows 🎯 `claude-Main-Agent` today. Show the folder name only:
🎯 `Main-Agent`. No other /status field changes.

Example: session `claude-main-agent` renders as `main-agent`.
Session names without the prefix render unchanged.

## Scope Notes

- 📍 Display-layer fix only. `formatStatusMessage` / `renderStatusLines` in
  `src/status_report.js:333` receive `activeSessionName` from the caller
  (`src/index.js:331`) and print it verbatim (after `sanitizeLabel`).
- ✂️ Strip `^claude-` at render time in `renderStatusLines`. `projectNameFromSession`
  (`src/projects/manager.js:50`) already uses this rule, but importing
  `projects/manager.js` into `status_report.js` adds a coupling we do not want for
  one regex — the plan keeps the display concern inside the display module.
- 🚫 The raw name stays untouched everywhere else: tmux operations, transcript
  paths, and other messages (🚀 fresh session, 🔌 connected) still show `claude-*`.
  This item covers /status only.
- Sibling 261005-qnf strips the same prefix in `src/diagnostics.js`
  (/project-resources). Different file, different test file — no dependency, no race.

## Coordination

- `depends_on` is empty by design: qne touches `src/status_report.js` +
  `test/status_report.test.js`; qnf touches `src/diagnostics.js` +
  `test/diagnostics.test.js`. No shared file.
- Both items use the same display rule (strip `^claude-`), but each strips in its
  own module, so neither plan edits the other's file.
- ⚠️ `test/status_report.test.js` lines 186-188 and 223-225 assert the raw
  `claude-*` name appears. Those assertions flip in this plan.

## Tasks

### Task 1 — Strip the prefix in the /status renderer

File: `src/status_report.js` (`renderStatusLines`, near the current line 333).

Current:

```js
const name = sanitizeLabel(sessionName || 'unknown');
```

Change to strip the prefix before sanitizing, keeping the `unknown` fallback:

```js
// Display name only: sessions are named claude-<folder>; show the folder part.
const displayName = sessionName ? sessionName.replace(/^claude-/, '') : '';
const name = sanitizeLabel(displayName || 'unknown');
```

- Empty after strip (a session literally named `claude-`): falls back to `unknown`.
- `null` / missing session name: same `unknown` fallback as before.
- One regex, one line of behavior change. No signature change.

Commit: `fix(/status): show folder name without claude- prefix`

### Task 2 — Update tests

File: `test/status_report.test.js`.

- Flip assertions at lines 186-188 (`claude-x` → expect `x`, not `claude-x`) and
  223-225 (`claude-myproject` → expect `myproject`, not `claude-myproject`).
- Add one focused test: `formatStatusMessage({ sessionName: 'claude-Main-Agent', ... })`
  renders `Main-Agent` and does not contain `claude-Main-Agent`.
- Add one fallback test: `sessionName: 'plain'` renders `plain` (no prefix, unchanged).
- Run the suite: `npm test` (no build/lint step in the workspace).

Commit: `test(/status): assert session name renders without claude- prefix`

## Verification

- ✅ `npm test` passes (status_report suite green with flipped + new assertions).
- ✅ `/status` on a live session shows the folder name only in the 🎯 line.
- ✅ No file outside the two listed in `files_modified` changes.

## Hook Dispositions (plan-pre-hooks)

- 🔌 **API Coverage:** No external API integration — a display-string change inside
  the bridge. Detector verdict for this scope: not detected. No COVERAGE.md.
- 🔁 **Assumption-Delta:** No singular→plural / required→optional shift — one
  display field keeps one identity; we only render the same noun differently.
  Decision: `no-change`.
- 🗄️ **Schema Push:** No ORM / schema files in scope. Skip silently.
- 🛡️ **Threat Model:** see block below. No new trust boundary.

<threat_model>
- ASVS level: L1 (display-only change).
- Assets: Telegram chat output. Threats: a project folder name that starts with
  the literal text `claude-` now loses up to 7 display characters — cosmetic,
  not a security issue. `sanitizeLabel` still strips Markdown characters after
  the strip, so no Markdown injection vector opens. No new input source, no
  blocking findings.
</threat_model>
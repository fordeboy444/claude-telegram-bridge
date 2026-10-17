---
status: complete
plan_id: 261005-qnf
quick_id: 261005-qnf
title: "/project-resources: strip the claude- prefix from session names"
completed: 2026-10-05
commits:
  - 2dcb2c6
  - c835f3e
---

# Summary 261005-qnf — /project-resources: strip the claude- prefix from session names

## What changed

🎯 The `/diag` Active session line and the `tmux claude sessions:` line now
show the project folder name only (`my-app`), with no `claude-` prefix.

- `src/diagnostics.js` (formatDiagnosticsMessage):
  - `Active session:` now prints `` `${projectNameFromSession(diag.activeSession)}` ``;
    the `activeSessionAlive` status text (🟢/🔴) is unchanged.
  - `tmux claude sessions:` maps each name through `projectNameFromSession`
    before the backtick-wrap join; the `'none'` fallback and label are unchanged.
  - Uses the already-imported helper from `src/projects/manager.js` — no local
    regex added.
- `gatherDiagnostics` data shape untouched: it still returns raw tmux names
  (`claude-my-app`), so the caller/tmux name contract holds.

## Tests

- `test/diagnostics.test.js` — in `formatDiagnosticsMessage renders readable
  Telegram markdown`, the raw-name assertion became two: `` /`my-app`/ `` must
  match and `/claude-my-app/` must not.
- New focused test `formatDiagnosticsMessage strips the prefix from suffixed
  session names`: `claude-my-app-2` → `` `my-app-2` `` (single strip, no
  `my-app-2-2`).
- All `gatherDiagnostics` tests unchanged and passing with raw names.

## Verification

- ✅ `node --test test/diagnostics.test.js` — 8 pass, 0 fail.
- ✅ `npm test` (full suite) — 159 pass, 0 fail.
- ✅ Grep: no `replace(/^claude-` regex in `src/diagnostics.js`.

## Out of scope (untouched)

- `/diag` → `/project-resources` rename (261005-qnb) and the format rework.
- Skill sources block, source paths, skill-count rows (261005-qnb).
- `/status` session names (261005-qne, already landed as 77843ba).
- Deploy to Coolify.

## Notes for 261005-qnb

⚠️ You own this block next. The two lines now call `projectNameFromSession`
inside the backtick slots:
- `src/diagnostics.js:110` — active session slot.
- `src/diagnostics.js:115` — tmux sessions map.
Carry the strip forward (or keep it when you rewrite the block) so the final
format still shows bare project names. Tests to preserve:
`` `my-app` `` matches, `/claude-my-app/` does not, suffixed test passes.
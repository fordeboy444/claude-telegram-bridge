---
quick_id: 261005-qne
status: complete
date: 2026-10-05
commits: [9908be1, 77843ba]
files_modified: [src/status_report.js, test/status_report.test.js, test/integration.test.js]
---

# Summary 261005-qne — /status: strip the claude- prefix from the session name

## Done

- ✅ `renderStatusLines` in `src/status_report.js:333` strips a leading `claude-`
  from `sessionName` at render time, then sanitizes. The `unknown` fallback stays
  for a null name and for a name that is exactly `claude-`.
- ✅ Flipped assertions in `test/status_report.test.js` (was lines 186-188 and
  223-225): now expect `` `x` `` and `` `myproject` `` and no `claude-` match.
- ✅ Added one focused test: `claude-Main-Agent` renders `Main-Agent` only.
- ✅ Added one fallback test: `plain` renders `plain` unchanged.
- 🚫 Raw name untouched everywhere else — tmux ops, transcript paths, other
  messages still see the full session name. Display-layer change only.

## Deviation

- ⚠️ `test/integration.test.js:873` also asserted the raw name
  (`claude-status-proj`) in the enriched /status flow and failed after Task 1.
  Updated it to assert `` `status-proj` `` in the Task 2 commit. This file was
  not in the plan's `files_modified`; the plan's own verify gate (`npm test`
  green) required the flip. No source files outside the listed set changed.

## Verification

- ✅ `npm test`: 158 pass, 0 fail (was 157/1 before the integration fix).

## Hook Dispositions (plan-post-hooks)

- 🔌 API Coverage: not detected — no external API surface touched.
- 🔁 Assumption-Delta: `no-change` — one display field keeps one identity.
- 🗄️ Schema Push: skipped — no ORM/schema files in scope.
- 🛡️ Threat Model: no new trust boundary; `sanitizeLabel` still runs after the
  strip, so no Markdown injection vector opens.
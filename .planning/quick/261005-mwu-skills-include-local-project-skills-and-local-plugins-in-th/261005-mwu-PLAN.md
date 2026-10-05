---
quick_id: 261005-mwu
description: "/skills: include local (project) skills and local plugins in the skills browser, not only global + built-in."
depends_on: []
files_modified:
  - src/index.js
  - src/skills/scanner.js
  - src/skills/menu.js
  - src/diagnostics.js
  - test/helpers.js
  - test/skills_discovery.test.js
  - test/skills_scanner.test.js
  - test/plugin_skills.test.js
  - test/skills_menu.test.js
  - test/diagnostics.test.js
  - test/integration.test.js
  - README.md
created: 2026-10-05
---

# Plan 261005-mwu — `/skills` Local Skills and Local Plugins

## 🎯 Goal

The user opens `/skills` with an active session. The browser lists the session's project (worktree) skills and its local plugin installs. Each item carries a source tag: local, global, plugin, or local plugin.

## 💡 Context

- The scanner already knows all four source kinds (`src/skills/scanner.js:31`, `scanPluginSkills` at line 90). So the code looks complete. It fails on the host for one reason: wrong project path.
- `refreshSkills()` derives the project dir from the session NAME: `path.join(config.projectsDir, projectNameFromSession(activeSessionName))` (`src/index.js:162-164`). Two flaws:
  - `projectNameFromSession` cannot invert `normalizeName` (`src/projects/manager.js:40-51`). Spaces become dashes. Worktree dir names do not match.
  - Orca worktrees live at paths from `orca-data.json` (`proj.path`). The name-derived path misses them.
- `switchActiveSession(sessionName, chatId, projectPath)` receives the true worktree path. It uses it only for the reader, then discards it (`src/index.js:200-201`).
- Result: project `.claude/skills` never resolves. Project-scoped plugin installs never match. The user sees global skills and built-ins only.
- Plugin tagging: `scanPluginSkills` already picks project-scoped installs (entries with `projectPath`). But it tags every result `source: 'plugin'`. Local and global installs look the same.
- `installed_plugins.json` (v2) facts, confirmed on the user's machine: `scope: 'user'` entries carry no `projectPath` (global). `scope: 'local'` entries carry `projectPath` (project install).
- Skills-directory plugins: Claude Code loads plugin dirs that hold `.claude-plugin/plugin.json` under `~/.claude/skills/` AND the project's `.claude/skills/` (origin `@skills-dir`, per the plugin loading reference). `scanSkills` reads only `<dir>/<name>/SKILL.md`. So skills inside such plugins never show.
- Claude Code does NOT scan a project `.claude/plugins/` directory (stated in the same reference). Do not scan that path.
- The bridge runs as UID 1000 with `orca-home` at `/home/orca`. `os.homedir()` inside the bridge matches the Claude sessions' home. So `installed_plugins.json` is shared and current.

### Code paths to reuse

| Concern | Where | Rule |
|---|---|---|
| Project path | `switchActiveSession` argument `projectPath` (`src/index.js:181`) | Store it. Do not re-derive it from the session name. |
| Fallback | `projectPath \|\| path.join(config.projectsDir, resolvedProjectName)` (`src/index.js:201`) | Keep as fallback. All callers pass `proj.path` today. |
| Skill dir list | `resolveSkillsDirectories` (`src/skills/scanner.js:31`) | Add a `projectPath` override. Keep the name-derived fallback. |
| Plugin install select | `scanPluginSkills` `eligible` + `chosen` filter (`src/skills/scanner.js:117-126`) | Unchanged. It already prefers project-scoped installs. |
| Source labels | `SOURCE_ICONS` / `SOURCE_LABELS` (`src/skills/menu.js:5-6`) | Add `plugin-local`. Keep `plugin` for global. |
| Dedup | `seenIds` set in `scanSkills` (`src/skills/scanner.js:47`) | Reuse for skills-dir plugin skills. |

## ✅ Task 1 — Track the active project path and use it for every scan

**Files:** `src/index.js`, `src/skills/scanner.js`, `src/diagnostics.js`, `test/skills_discovery.test.js`, `test/diagnostics.test.js`, `test/integration.test.js`

- **Steps:**
  1. In `createBot` state (`src/index.js:32-33`): add `let activeProjectPath = null;` after `activeSessionName`.
  2. In `switchActiveSession` (`src/index.js:195-201`): hoist `resolvedProjectName` and `resolvedProjectPath` above the `if (sessionName && chatId)` block. Set `activeProjectPath = resolvedProjectPath` right after `activeChatId`. Keep the reader's use of `resolvedProjectPath`. A null session clears `activeProjectPath`.
  3. In `refreshSkills()` (`src/index.js:151-168`): delete the name-derived join. Pass `projectPath: activeProjectPath` to `resolveSkillsDirectories` and to `scanPluginSkills`.
  4. In `resolveSkillsDirectories` (`src/skills/scanner.js:31-43`): accept `projectPath`. Use it for the `'project'` dir entry when given. Fall back to the name-derived path when not given. Existing callers keep working.
  5. In `gatherDiagnostics` (`src/diagnostics.js:10-11,42-45`): accept `activeProjectPath`. Use it for `resolveSkillsDirectories` and for `pluginProjectPath`. Keep the name-derived fallback.
  6. In the `/diag` handler (`src/index.js:315-325`): pass `activeProjectPath` to `gatherDiagnostics`.
  7. In `getActiveState()` (`src/index.js:680`): include `activeProjectPath`.
  8. Tests, in the existing style (`makeSkill`, `makePluginSkill`, `makeBotMock`, `makeTmuxMock`):
     - `test/skills_discovery.test.js`: new test — `resolveSkillsDirectories` with an explicit `projectPath` returns `<projectPath>/.claude/skills` with source `'project'`. The two existing fallback tests stay unchanged and green.
     - `test/diagnostics.test.js`: new test — `gatherDiagnostics` with `activeProjectPath` lists that dir in `skillSources` and matches plugin installs against it.
     - `test/integration.test.js`: new test — build a tmp project dir that does NOT sit under `config.projectsDir/<session-name>`. Put one skill in `<tmp>/.claude/skills`. Call `switchActiveSession('claude-test', 12345, tmpProjectDir)`. Await `refreshSkills()`. Assert the returned list contains the project skill. Assert `getActiveState().activeProjectPath === tmpProjectDir`. Call `botInstance.stop()`.
- **Verify:** `npm test` passes. The suite is green after this task.

## ✅ Task 2 — Tag local plugins and surface skills-directory plugins

**Files:** `src/skills/scanner.js`, `src/skills/menu.js`, `src/diagnostics.js`, `test/helpers.js`, `test/plugin_skills.test.js`, `test/skills_scanner.test.js`, `test/skills_menu.test.js`

- **Steps:**
  1. In `scanPluginSkills` (`src/skills/scanner.js:148-155`): set `source: install.projectPath ? 'plugin-local' : 'plugin'` on each result. Nothing else changes. The install-preference logic already picks the project-scoped install when one exists.
  2. In `scanSkills` (`src/skills/scanner.js:57-77`): when a child dir has no `SKILL.md`, probe `<child>/.claude-plugin/plugin.json`. Add one helper in the same module, `scanSkillsDirPlugin(pluginRoot, source, seenIds)`:
     - Read the manifest `name`. Fall back to the dir name. Broken or missing manifest: return `[]` silently.
     - Scan `<pluginRoot>/skills/<n>/SKILL.md` (default layout only).
     - Emit for each skill: `id: 'skillsdir:<pluginName>:<skillName>'`, `name: '<pluginName>:<skillName>'`, `command: '/<skillName>'`, description from frontmatter.
     - Source tag: `'plugin-local'` when the parent dir source is `'project'` or `'local'`; `'plugin'` when `'global'`.
     - Dedup through the shared `seenIds` set. Push ids into it.
  3. In `src/skills/menu.js:5-6`: add `plugin-local: '🧩'` to `SOURCE_ICONS` and `plugin-local: '🧩 local plugin'` to `SOURCE_LABELS`. Keep `plugin: '🧩 plugin'` unchanged for global installs.
  4. In `src/diagnostics.js:49-58`: each `pluginSources` entry gains the skill's `source`. In `formatDiagnosticsMessage`, print `— local` or `— global` on the plugin source line.
  5. In `test/helpers.js`: add `makeSkillsDirPlugin(skillsRoot, pluginFolder, pluginName, skillFolder, skillName, description)`. It writes `.claude-plugin/plugin.json` (with `name`) plus `skills/<skillFolder>/SKILL.md`.
  6. `test/plugin_skills.test.js`: extend two asserts — the project-scoped test (`:32`) asserts `source === 'plugin-local'`; the beats-global test (`:64`) asserts `'plugin-local'`. The global test (`:12`) stays `'plugin'`.
  7. `test/skills_scanner.test.js`: three new tests — a skills-dir plugin in a `'project'` dir yields namespaced skills tagged `'plugin-local'`; the same in a `'global'` dir is tagged `'plugin'`; a broken manifest is skipped without error.
  8. `test/skills_menu.test.js`: new assert — `getSkillIcon` returns `🧩` and the inspect view shows `🧩 local plugin` for a `plugin-local` skill.
- **Verify:** `npm test` passes. All new tests pass.

## ✅ Task 3 — Update docs and run the full suite

**Files:** `README.md`

- **Steps:**
  1. Update the feature bullet (`README.md:13`): the browser also lists project (worktree) skills and local plugin installs when a session is active.
  2. Update the `/skills` row in the command table (`README.md:116`): mention project and local plugin sources.
  3. Run `npm test`. All tests pass.
- **Verify:** Suite green. README shows the new sources.

## 🧪 Plan-level checks

- [ ] `npm test` passes with all new tests.
- [ ] With a session active, `/skills` lists skills from the session's real worktree dir.
- [ ] `/diag` shows the project dir with the `(project)` tag.
- [ ] Project-scoped plugin installs show tagged `🧩 local plugin`.
- [ ] Skills-dir plugins under the project `.claude/skills` show their inner skills.
- [ ] No session: browser shows local + global + global plugins only. Behavior unchanged.

## 📦 Out of scope

- tmux `pane_current_path` lookup. Callers pass `proj.path` today. The `projectsDir/<name>` fallback stays.
- Manifest `skills` key (extra skill dirs). Default `skills/` layout only.
- Scanning a project `.claude/plugins/` dir. Claude Code does not load plugins from there.
- Plugin commands, agents, and hooks. The browser lists skills only.
- Deploy of the bridge. The daemon runs in Coolify. A redeploy applies the change.
- Items 261005-mws and 261005-mwt touch `src/index.js` too, but in different regions. No ordering need.
---
status: complete
quick_id: 261005-qnb
completed: 2026-10-05
commits:
  - fcdd35a feat(diag): rename to /project-resources, keep /diag as hidden alias
  - bdf3a56 feat(diag): four name-only lists in the project-resources card
  - c2a6af1 docs: document /project-resources in the command table
---

# Summary 261005-qnb: `/diag` → `/project-resources` rename + list-only output

## What Changed

- ✅ `src/index.js`: the `/diag` handler body moved into `handleProjectResources(ctx)` inside the bot factory scope; both `bot.command('project-resources', …)` and `bot.command('diag', …)` register the same handler. Menu entry (`defaultCommands`) renamed with description `Project resources: skills & plugins`, kept in position after `interrupt`. `/start` line replaced with `/project-resources`; one new `/help` line added after `/interrupt` (the alias stays undocumented). The `/interrupt` comment (line ~343) still cites `/diag` — it remains valid since the alias exists.
- ✅ `src/diagnostics.js`: `formatDiagnosticsMessage` rebuilt as `🗂️ *Project Resources*` + active-session line + tmux line (both keep the `claude-` prefix strip via `projectNameFromSession`, carrying qnf forward) + four name-only sections — `📁 *Local skills:*`, `📁 *Global skills:*`, `🧩 *Local plugins:*`, `🧩 *Global plugins:*` (`• name` bullets; empty sections omitted). Deleted `formatDirLabel`, the per-dir path block, the per-installPath block, and the `⚡ N scanned …` totals row.
- ✅ `gatherDiagnostics` now classifies names into four buckets in the loop: plain skills by dir source (`local`/`project` → local, `global` → global); skills-directory plugins discovered inside skills dirs route to the plugin buckets (they carry per-skill `plugin-local`/`plugin` source, which `skillNames` alone lost). `installed_plugins.json` plugin skills (`plugins: [{ name, source }]` per plan) join the same buckets. `formatDirLabel`'s dir dedup and `skillSources`/`pluginSources`/`totalScannedSkills` stay for compatibility. Dropped `builtinsCount` and `pluginSkillsCount` (and the now-unused `getBuiltInCommands` import).
- ✅ `test/diagnostics.test.js`: `pluginSkillsCount` assertions replaced with `plugins` shape assertions; the old markdown-format test rewritten as an end-to-end four-list test (asserts all four headers with contiguous bullets, prefix-stripped session name, no `.claude` substring, no `scanned`); new tests for empty-section omission and cwd/worktree dedup; the suffix-strip format test kept with the new minimal shape.
- ✅ `test/integration.test.js`: command-menu test now asserts `project-resources` present, `diag` absent, and `handlers.commands.diag === handlers.commands['project-resources']` (same handler instance).
- ✅ `README.md` command table: `/project-resources` row after `/interrupt`. `COOLIFY_DEPLOY.md` verify step now says "/project-resources card".

## Verification

- `npm test`: 162 tests, 162 pass, 0 fail (was 160; +2 net — two old format tests became four).

## Notes for the Next Items

- 💡 `formatDiagnosticsMessage` now reads `localSkillNames`/`globalSkillNames`/`localPluginNames`/`globalPluginNames` from the diag object — old-format fixtures with `skillSources`-only input will render with no lists.
- ℹ️ A skills-directory plugin in a local skills dir now appears under 🧩 Local plugins (previously it only appeared as a skills bullet with a `plugin:skill` name). `/skills` browser behavior unchanged.
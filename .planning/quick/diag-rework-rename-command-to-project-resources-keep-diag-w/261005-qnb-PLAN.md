---
quick_id: 261005-qnb
description: "/diag rework: rename to /project-resources with /diag kept as hidden alias; drop source paths and skill-count rows; replace the Skill sources block with four plain name-only lists (Local skills, Global skills, Local plugins, Global plugins)."
depends_on:
  - 261005-qnf
files_modified:
  - src/index.js
  - src/diagnostics.js
  - test/diagnostics.test.js
  - test/integration.test.js
  - README.md
files_deleted: []
created: 2026-10-05
---

# Plan 261005-qnb — `/diag` → `/project-resources` rename + list-only output

<threat_model>
No security-relevant surface change. The command keeps the same Telegram
authorization path (bot.command handlers run inside the existing authorized-bot
middleware). The output drops filesystem paths — that REDUCES information
exposure (no directory layout leak in chat). New reply text contains skill and
plugin names only, already public to the chat owner. ASVS: n/a (no config,
config.json absent → enforcement inactive). Nothing to block on.
</threat_model>

## 🎯 Goal

The user types `/project-resources` (or the old `/diag`) and gets a compact card:
active session, tmux sessions, and four plain lists — Local skills, Global
skills, Local plugins, Global plugins. No source paths. No skill-count rows.

## 💡 Context

- Current state: `bot.command('diag', ...)` at `src/index.js:370`, menu entry at
  `src/index.js:116`, `/start` list at `src/index.js:277`.
- `formatDiagnosticsMessage` (`src/diagnostics.js:105-140`) prints per-dir path
  lines, per-plugin installPath lines, and a totals row
  (`⚡ N scanned + M built-in + K plugin`). All of that goes away.
- Skill discovery already tags each skill with `source` (`src/skills/scanner.js:35-43`):
  `local` (cwd `.claude/skills`), `project` (active worktree `.claude/skills`),
  `global` (home `.claude/skills`). Plugins: `plugin-local` (worktree/cwd install)
  or `plugin` (global install) (`scanner.js:129`, `202-207`).
- Mapping for the four lists:
  | List | skillSources / pluginSources source values |
  |---|---|
  | Local skills | `local`, `project` |
  | Global skills | `global` |
  | Local plugins | `plugin-local` |
  | Global plugins | `plugin` |
- Icon convention: qna (261005-qna) gives ALL skills one folder glyph and keeps
  the jigsaw for plugins. Use 📁 for both skill lists, 🧩 for both plugin lists.
- Prefix stripping (qnf, 261005-qnf) removes the `claude-` prefix from the
  active-session line and the tmux list. qnf runs first and edits the same
  format block. This plan rewrites that block AFTER qnf, so Task 2 must carry
  the stripping forward (helper `projectNameFromSession` in
  `src/projects/manager.js` already does it — delegate, do not hand-roll).
- Hidden alias rule: `/diag` keeps a full working handler but must NOT appear in
  the Telegram command menu (`updateBotCommands`, `src/index.js:110-118`) and not
  in the `/start` / `/help` text lists. `/diag` was named to avoid clobbering the
  built-in `/doctor` passthrough; `/project-resources` has the same safety
  (no built-in skill or command with that name is expected; if a user skill
  named `project-resources` existed, the native command wins — same trade-off
  `/interrupt` accepted, per plan 261005-mwt).

## ✅ Task 1 — Rename the command, keep `/diag` as a hidden alias

**Files:** `src/index.js`, `test/integration.test.js`

- **Steps:**
  1. In the `/diag` handler block (`src/index.js:368-381`): keep the body, move it
     into a private `async function handleProjectResources(ctx)` inside the bot
     factory scope (it closes over `activeSessionName`, `activeProjectPath`,
     `cachedSkills` refresh flow, `config`, `tmux`).
  2. Register both routes with the same handler:
     - `bot.command('project-resources', handleProjectResources);`
     - `bot.command('diag', handleProjectResources);` — keep the comment above
       and extend it: "`/diag` stays as a hidden legacy alias; it is not synced
       to the Telegram command menu."
  3. In `updateBotCommands()` `defaultCommands` (`src/index.js:116`): replace the
     `diag` entry with `{ command: 'project-resources', description: 'Project resources: skills & plugins' }`.
     Keep the position after `interrupt`. `commandMapping` cleanup is untouched.
  4. `/start` text (`src/index.js:277`): replace the `/diag` line with
     `• /project-resources - Project skills & plugin resources`.
  5. `/help` text: add one `/project-resources` line after `/interrupt`
     (`src/index.js:284-294` has no `/diag` line today — add it; the hidden alias
     stays undocumented).
  6. `test/integration.test.js` command-menu assertions (`test/integration.test.js:33-35`):
     keep `commandsSet.length === 6`; replace any `diag` expectation with
     `assert.ok(commandsSet.some(c => c.command === 'project-resources'))` and
     `assert.ok(!commandsSet.some(c => c.command === 'diag'), 'diag is a hidden alias, not in the menu')`.
     In the mock, both `bot.command('project-resources', h)` and
     `bot.command('diag', h)` land in `handlers.commands` — assert
     `handlers.commands.diag === handlers.commands['project-resources']` (same
     handler instance).
- **Verify:** `npm test` passes.

## ✅ Task 2 — Rework the reply format into four name-only lists

**Files:** `src/diagnostics.js`, `test/diagnostics.test.js`

- **Steps:**
  1. In `gatherDiagnostics` (`src/diagnostics.js:10-95`): no structural change
     needed. `skillSources` entries already carry `source`, `exists`,
     `skillNames`; `pluginSkills` is not returned — extend the return object with
     `plugins: pluginSkills.map(p => ({ name: p.name, source: p.source }))` so
     the formatter does not re-derive from `pluginSources` paths. Drop
     `builtinsCount` and `pluginSkillsCount` from the return when no formatter or
     test still needs them (`getBuiltInCommands` import can go if unused).
  2. In `formatDiagnosticsMessage` (`src/diagnostics.js:105-140`): rebuild:
     - Header line: `🗂️ *Project Resources*`.
     - Active-session line and tmux-sessions line: keep structure, apply the
       `claude-` prefix strip from qnf (delegate to `projectNameFromSession` from
       `src/projects/manager.js`; it is already imported). If qnf landed the
       strip elsewhere in this file, keep it working under the new format.
     - Delete the `🗂️ *Skill sources:*` per-dir block (`formatDirLabel` has no
       remaining caller — delete the function, `src/diagnostics.js:97-103`).
     - Delete the `🧩 *Plugin skills:*` per-installPath block.
     - Delete the `⚡ N scanned + M built-in + K plugin` totals row
       (`src/diagnostics.js:135-137`) and the `pluginNote` line.
     - Append four sections, each `['', '<header>', ...bullets]`:
       - `📁 *Local skills:*` — names from skillSources with source `local` or
         `project`, deduped (a worktree path and cwd overlap), `• name` per line.
       - `📁 *Global skills:*` — names from source `global`.
       - `🧩 *Local plugins:*` — plugin names with source `plugin-local`, deduped.
       - `🧩 *Global plugins:*` — plugin names with source `plugin`, deduped.
       - A section with zero entries is omitted entirely (no empty header).
  3. `test/diagnostics.test.js`: keep the gather tests that assert
     `skillSources` shape (that data still exists); adjust any test that asserts
     `builtinsCount`/`pluginSkillsCount` on the return object. Add format tests:
     - fixture with a local dir, global dir, worktree dir, one `plugin-local`
       and one `plugin` install → message contains `*Local skills:*`,
       `*Global skills:*`, `*Local plugins:*`, `*Global plugins:*`, contains a
       skill name bullet, does NOT contain `.claude` (no paths), does not match
       `/scanned/` (no totals row).
     - fixture with only a global dir and no plugins → message has
       `*Global skills:*`, has no `*Local skills:*` header, no `*Local plugins:*`.
     - dedup: same skill name in `local` and `project` dirs → one bullet.
- **Verify:** `npm test` passes.

## ✅ Task 3 — README and full-suite check

**Files:** `README.md`

- **Steps:**
  1. In the command table (`README.md:112-121`): add a row after `/interrupt`:
     `| /project-resources | Lists the project's skills and plugins — name-only view of local and global skills, local and global plugins. |`
  2. `COOLIFY_DEPLOY.md:31` says "the diagnostics card" — reword to "the
     /project-resources card" (one-word-level edit).
  3. Run `npm test`. All suites green.
- **Verify:** Suite green. Table shows the new row.

## 🧪 Plan-level checks

- [ ] `/project-resources` in the Telegram menu; `/diag` absent from the menu.
- [ ] `/diag` still answers with the same card (alias shares the handler).
- [ ] Reply contains no file paths, no `.claude` substrings, no counts.
- [ ] `claude-` prefix stripped from session lines (carries qnf forward).
- [ ] Empty sections are omitted; deduped name bullets.
- [ ] `npm test` green.

## 📦 Out of scope

- Deploy of the bridge. No deployment in this batch.
- The `/status` prefix strip (261005-qne) and `/effort` picker (261005-qng).
- The skills browser icon work (261005-qna) — this plan only follows its icon
  convention for the resource card.
- Removing skills discovery data elsewhere; only this command's output shrinks.
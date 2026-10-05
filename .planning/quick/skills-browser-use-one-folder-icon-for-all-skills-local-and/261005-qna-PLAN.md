---
quick_id: 261005-qna
description: "/skills browser: use one folder icon for ALL skills, local and global; remove the globe icon. Plugins keep the jigsaw icon for both local and global."
depends_on: []
files_modified:
  - src/skills/menu.js
  - src/skills/scanner.js
  - test/skills_menu.test.js
created: 2026-10-05
---

# Plan 261005-qna — One Folder Icon for All Skills

## 🎯 Goal

In `/skills`, every non-builtin, non-plugin skill shows the 📁 folder icon, whether it comes from a local, project, or global directory. The 🌐 globe icon no longer appears anywhere. Plugins keep 🧩 for both local and global installs. Built-in commands keep ⌨️.

## 💡 Context

- The whole icon logic sits in two maps in `src/skills/menu.js:4-12`:
  - `SOURCE_ICONS` (`src/skills/menu.js:5`): `global: '🌐'` today. This is the only place that returns the globe.
  - `SOURCE_LABELS` (`src/skills/menu.js:6-12`): `global: '🌐 global'` labels the Source line in the inspect card.
- Consumers: `getSkillIcon` (`src/skills/menu.js:14-17`) for keyboard rows and the inspect card header; `buildSkillInspectView` (`src/skills/menu.js:95`) for the `🗂️ Source:` line.
- The scanner carries the same glyph in a comment only (`src/skills/scanner.js:30`). It does not render icons. Comment update keeps the docs truthful.
- The source *string* (`'global'` vs `'local'`) stays unchanged everywhere. The dedup, the Source label text `global`, and the scanner logic are untouched. This task changes a display glyph only.
- Tests that pin the globe: `getSkillIcon` source map (`test/skills_menu.test.js:154`) and the inspect-card Source line (`test/skills_menu.test.js:171`).
- No external API, no schema files, no identity-model change → no plan-pre-hook fires (assumption-delta is advisory and the noun set is unchanged; this is a glyph swap).

<threat_model>
Not applicable — display glyph change only. No new input path, no callback payload change, no persistence.
</threat_model>

## ✅ Task 1 — Fold global under the folder icon and fix the pinned tests

**Files:** `src/skills/menu.js`, `src/skills/scanner.js`, `test/skills_menu.test.js`

- **Steps:**
  1. In `src/skills/menu.js:5`, set `global: '📁'` in `SOURCE_ICONS`. The `'🌐'` literal disappears from this file after step 3.
  2. In `src/skills/menu.js:9`, set `global: '📁 global'` in `SOURCE_LABELS`, so the inspect card Source line reads `🗂️ Source: 📁 global`.
  3. In `src/skills/menu.js:4`, rewrite the map comment: `built-in commands ⌨️, all skills 📁, plugins 🧩`.
  4. In `src/skills/scanner.js:30`, update the comment to `📁 local / 📁 global / project`. Logic unchanged.
  5. In `test/skills_menu.test.js:154`: change the `global` case to `assert.equal(getSkillIcon({ id: 'skill:a', source: 'global' }), '📁')`.
  6. In `test/skills_menu.test.js:171`: change the assertion from `includes('🌐')` to `includes('📁 global')` — this checks both the new icon and the kept source word in one assert.
  7. No other test touches 🌐 (verified by grep over `test/`). Run the full suite.
- **Verify:** `npm test` passes. `grep -rn '🌐' src/ test/` returns zero hits.

## 🧪 Plan-level checks

- [ ] `/skills` keyboard rows show 📁 for a global skill (same glyph as local).
- [ ] Inspect card for a global skill shows `Source: 📁 global`.
- [ ] Plugin rows keep 🧩 for both `plugin` and `plugin-local` sources (tests at `test/skills_menu.test.js:155-156`, `:160-166` — untouched and green).
- [ ] Built-ins keep ⌨️ (test at `:151` — untouched).
- [ ] No 🌐 remains in `src/` or `test/`.

## 📦 Out of scope

- Source string values, dedup, and scanner directory logic. Display only.
- README — it never names the globe glyph.
- Deploy. A Coolify redeploy applies the change; that is the batch runner's job, not this plan's.
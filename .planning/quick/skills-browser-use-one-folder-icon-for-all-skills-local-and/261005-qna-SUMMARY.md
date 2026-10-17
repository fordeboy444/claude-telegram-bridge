---
quick_id: 261005-qna
status: complete
completed: 2026-10-05
commit: d9f0761
files_modified:
  - src/skills/menu.js
  - src/skills/scanner.js
  - test/skills_menu.test.js
---

# Summary 261005-qna — One Folder Icon for All Skills

## What happened

Executed exactly per plan. Branch `gsd-edition`, primary checkout, no worktree.

- `src/skills/menu.js:5` — `SOURCE_ICONS.global` is now `'📁'` (was `'🌐'`).
- `src/skills/menu.js:9` — `SOURCE_LABELS.global` is now `'📁 global'`; inspect card reads `🗂️ Source: 📁 global`.
- `src/skills/menu.js:4` — map comment rewritten to `built-in commands ⌨️, all skills 📁, plugins 🧩`.
- `src/skills/scanner.js:30` — comment updated to `📁 local / 📁 global / project`. Logic unchanged.
- `test/skills_menu.test.js:154` — global case asserts `'📁'`.
- `test/skills_menu.test.js:171` — asserts `includes('📁 global')` (icon + kept source word).

## Verification

- `npm test`: 156 pass, 0 fail.
- `grep 🌐` over `src/` and `test/`: zero hits (verified with rg across the repo).
- Plugin rows keep 🧩 for `plugin` and `plugin-local` (tests `:155-156`, `:160-166` untouched, green).
- Built-ins keep ⌨️ (test `:151` untouched).

## Commits

- `d9f0761` — skills: use one 📁 folder icon for all skills, local and global (code only, docs artifacts not committed)

## Notes

- No deviations from the plan.
- Display-only change: `'global'` source string, dedup, and scanner directory logic untouched.
- Deploy not performed (batch runner owns redeploy).
---
status: complete
quick_id: 261005-qng
completed: 2026-10-05
commits:
  - d4c6acc
  - 18bf89c
  - d6d032b
---

# Summary 261005-qng: /effort Picker (low → max, Faster to Smarter)

## What Changed

- `src/index.js` (slash branch of `bot.on('text')`, after the session guards): a builtin with `choices` typed with no arguments now replies with `buildSkillInspectView(matchedSkill)` instead of injecting a bare command into tmux. This makes typed `/effort` open the level picker, and gives typed `/model` the same picker for free. A command with args (`/effort high`) still injects directly. Comment explains the "why".
- `src/skills/scanner.js:12`: effort builtin description is now `Adjust thinking effort (fast → smart)` — the Faster-to-Smarter order is stated in the Telegram command menu, skills browser, and picker caption.
- `test/skills_scanner.test.js:21`: assertion updated to the new description.
- `test/integration.test.js` (new test at end of file, distinct from the /diag menu region): `typed /effort with no args opens the effort picker instead of injecting` — asserts no `sendKeys` on bare `/effort`, exactly 5 `skill_choice:` buttons in order `low, medium, high, xhigh, max`, and that `/effort high` still injects `/effort high` into `claude-test`.

## Verification

- `npm test`: 160 tests, 160 pass, 0 fail.
- `test/integration.test.js`: 25/25 pass. New test passes.

## Notes

- The "⬅️ Back to Skills" row stays in the picker (single code path through `buildSkillInspectView`).
- The `skill_choice:` tap handler at `src/index.js:438` is unchanged; it injects `/effort <level>` into the active session.
- Did not register `bot.command('effort')` — the text-handler branch covers it once, avoiding double dispatch.
- Per batch note, integration-test additions were placed in a new final test to stay out of the /diag menu rename region that 261005-qnb will touch.
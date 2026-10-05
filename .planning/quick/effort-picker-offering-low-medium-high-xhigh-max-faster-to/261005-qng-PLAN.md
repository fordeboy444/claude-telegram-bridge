---
quick_id: 261005-qng
title: "/effort — picker with low / medium / high / xhigh / max in Faster to Smarter order"
depends_on: []
files_modified:
  - src/index.js
  - src/skills/scanner.js
  - test/skills_scanner.test.js
  - test/integration.test.js
files_deleted: []
---

# Plan 261005-qng: /effort Picker (low → max, Faster to Smarter)

## 1. Goal

Tapping or typing `/effort` must offer the five effort levels `low / medium / high / xhigh / max` in Faster-to-Smarter order as Telegram buttons, and the picked level must reach the active Claude session.

## 2. Current State (verified 2026-10-05)

💡 Much of this item already exists. Plan against the real code, do not re-derive it.

| Piece | Location | State |
|---|---|---|
| Effort builtin | `src/skills/scanner.js:12` | ✅ `builtin:effort`, command `/effort`, choices `['low', 'medium', 'high', 'xhigh', 'max']` — exact Faster-to-Smarter order |
| Choice picker render | `src/skills/menu.js:102-110` (`buildSkillInspectView`) | ✅ one button per choice, 2 per row, callback `skill_choice:<hash>:<choice>` |
| Choice tap → injection | `src/index.js:438-452` | ✅ sends `<command> <choice>` into the active tmux session |
| Typing `/effort` with no args | `src/index.js:674-689` | ❌ matches `commandMapping` and injects a **bare `/effort`** into tmux — no picker |
| Typed `@clawdbot args` path | `src/index.js:686-688` | ✅ `/effort high` already injects `/effort high` |

**The gap:** the picker is only reachable through the /skills browser inspect view (`/skills` → tap `⌨️ effort`). Typing `/effort` directly does not open the picker. This plan makes typed `/effort` open the same picker, reusing the existing pattern.

- ℹ️ The same routing condition also fixes `/model` (typed bare `/model` → picker) for free; no separate item exists for it in the catalog.
- ℹ️ `buildSkillInspectView` is already imported in `src/index.js:12`.
- ℹ️ Choice hash: `commandMapping` stores the same object that `assignSkillHashes` annotated (`src/index.js:170-172`), so `skill.hash` is present and the `skill_choice:` callback resolves. `hashOf()` also falls back to re-hashing the id.
- ℹ️ Telegram command menu already lists `effort` with description "Adjust thinking effort" (`updateBotCommands`, `src/index.js:124-137`).

## 3. Design

```
User types "/effort" (no args), active session exists
  └─> bot.on('text') slash branch (src/index.js:674)
        ├─> commandMapping has 'effort' ── matchedSkill (choices present)
        ├─> session guards (same as today)
        └─> NEW: no args && skill.choices ──► buildSkillInspectView(matchedSkill)
                reply with the existing picker:
                [low ▾ medium] [high ▾ xhigh] [max] [⬅ Back to Skills]
User taps a level
  └─> skill_choice: hash:low|medium|high|xhigh|max   (unchanged, src/index.js:438)
        └─> tmux.sendKeys(activeSessionName, "/effort <level>", true)
User types "/effort high"
  └─> args path (unchanged) ──► injects "/effort high" directly
```

Decisions:

- Reuse `buildSkillInspectView` for the picker — the 2026-09-12 skills-browser spec pattern. One code path per choice menu, no new menu code.
- The "⬅️ Back to Skills" row stays. It leads to the full browser; harmless for a direct invocation and keeps the single code path.
- The order comes from `scanner.js` choices and stays `low, medium, high, xhigh, max` (Faster → Smarter). Tests assert it.
- Arg-aware: a bare command shows the picker; a command with args still injects directly. `/model` with no args gets the same treatment.

<threat_model>
No new external input surface, auth change, or injection boundary:
- The picker renders only `skill.choices`, which are hardcoded builtin strings from `src/skills/scanner.js` — user-supplied Telegram text never reaches button labels.
- The `skill_choice:` callback already exists and injects a constant whitelist choice into tmux.
- No new privilege, no new callback regex breadth needed (`\w+` matches all five levels).
</threat_model>

## 4. Tasks

### Task 1 — Route bare choice commands to the picker (`src/index.js`)

1. In the slash-command branch of `bot.on('text')` (`src/index.js:674-690`): after the `matchedSkill` lookup and **after the existing `!activeSessionName` / `ensureSessionAlive` guards** (same order, same replies), add:

   ```js
   if (!args && Array.isArray(matchedSkill.choices) && matchedSkill.choices.length) {
     const view = buildSkillInspectView(matchedSkill);
     return ctx.reply(view.text, { parse_mode: 'Markdown', reply_markup: view.reply_markup });
   }
   ```

2. Comment the branch with its "why": a bare `/effort` (or `/model`) means "open the level picker", not a malformed Claude command; the picker itself injects the real command on tap.
3. The args path (`const fullCmd = args ? ...`) stays exactly as it is — `/effort high` must keep injecting directly.
4. No session active + bare `/effort` → keeps the existing `⚠️ No active Claude session` reply (picker is still the right UX for /model-style commands both ways).
5. Verify: `npm test` stays green.

### Task 2 — Effort order hint in the description (`src/skills/scanner.js`)

1. Change the effort builtin description at `src/skills/scanner.js:12` from `Adjust thinking effort` to `Adjust thinking effort (fast → smart)`. This text appears in the Telegram command menu, the skills browser, and the picker caption — it encodes the Faster-to-Smarter order in every surface.
2. The choices array stays exactly `['low', 'medium', 'high', 'xhigh', 'max']`. Do not reorder or rename.
3. Update the assertion in `test/skills_scanner.test.js:21` to the new description.
4. Verify: `npm test` stays green.

### Task 3 — Integration test (`test/integration.test.js`)

1. New test `typed /effort with no args opens the effort picker instead of injecting`:
   - Setup: `makeBotMock()` + `makeTmuxMock()` (`hasSession → true`, `listSessions` per helpers), `createBot(defaultTestConfig(), ...)`, then `switchActiveSession(...)` to a fake `claude-*` session.
   - Capture replies: `reply: async (text, opts) => { replies.push({ text, opts }); }`, and capture `sendKeys` on the tmux mock, plus `answerCbQuery`/`reply` as needed by the existing test style (see the `/clear` test at `test/integration.test.js:210-235`).
   - Dispatch `mockBot.handlers.on.text({ chat: { id: 12345 }, message: { text: '/effort' }, reply })`.
   - Assert: `sendKeys` NOT called — no bare injection.
   - Assert: reply has `reply_markup.inline_keyboard`; flatten the buttons; exactly 5 `skill_choice:` buttons; their `text` values in button order are `['low', 'medium', 'high', 'xhigh', 'max']` (Faster → Smarter).
2. Same test (or a second one): dispatch `message: { text: '/effort high' }` and assert `sendKeys` received `/effort high` — args still bypass the picker.
3. Verify: full `npm test` green.

## 5. Verification

- `npm test` — all suites green, including the two touched test files.
- New test asserts button order `low, medium, high, xhigh, max` and that bare `/effort` injects nothing.
- Manual host check is out of scope here; the batch merge deploys through Coolify as usual.

## 6. Risks / Notes

- ℹ️ Cross-item: batch items 261005-qna (skill icons) touch `src/skills/menu.js` icon maps; this plan does not modify `menu.js`, so no conflict. Items qne/qnf (claude- prefix strip) touch `src/index.js` status/diag regions, not the slash-command branch.
- ⚠️ Telegraf dispatch: `bot.command('skills'|...)` handlers run alongside `bot.on('text')`. Builtins like `effort` have no dedicated `bot.command`, so a bare `/effort` reaches the `bot.on('text')` slash branch once. Do not also register `bot.command('effort')` — that would double-dispatch.
- ℹ️ Known deferred minor from the 2026-09-12 ledger (`\w+` choice regex rejects dashed choices) is irrelevant here — all five levels are `\w`-safe.
- ℹ️ Contribution hooks checked: API-coverage (no external API), assumption-delta (no identity change), schema-push (no ORM files) — none fire. No COVERAGE.md required.
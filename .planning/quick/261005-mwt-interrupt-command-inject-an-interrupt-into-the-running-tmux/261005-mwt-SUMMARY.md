---
quick_id: 261005-mwt
status: complete
completed: 2026-10-05
commits:
  - 0275e18 "feat(interrupt): add /interrupt command that sends one Escape to the active session"
  - d31e007 "test(interrupt): cover Escape send, no-session guard, and question card clear"
  - b2b503b "docs(readme): add /interrupt row to the Telegram commands table"
---

# Summary 261005-mwt — `/interrupt` Command

## ✅ Result

- Native `bot.command('interrupt')` handler in `src/index.js` (after `/status`).
- Handler flow: no-session guard → `ensureSessionAlive` → `tmux.sendKeysWithDelay(activeSessionName, ['Escape'], 0)` → `activeQuestion = null` → `stopTyping()` → Markdown confirmation.
- Registered in `defaultCommands` after `/status`, plus `/start` and `/help` lists.
- README command table row added after `/status`.

## 🧪 Tests

- Extended the first integration test: menu length 5 → 6, `interrupt` entry assert.
- Three new behavior tests: one-Escape send (asserts session, `['Escape']`, delay `0`, typing stop), no-session warning (no keys sent), question card clear (`qa:0:1` tap answers `Question expired or not found`).
- `npm test`: 149 pass, 0 fail (146 before, 3 added). Left green.

## 📝 Notes

- Task 2 step 1 (mock records `bot.command` handlers) was already in place — landed with 261005-mws; no `test/helpers.js` change needed in this item.
- `/interrupt` never reaches the pane as text: the command handler intercepts before `bot.on('text')`.

## ⚠️ Deviations

None.
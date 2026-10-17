---
quick_id: 261005-mwt
description: "/interrupt command: inject an interrupt into the running tmux Claude session to stop the current task."
depends_on: []
files_modified:
  - src/index.js
  - test/helpers.js
  - test/integration.test.js
  - README.md
created: 2026-10-05
---

# Plan 261005-mwt — `/interrupt` Command

## 🎯 Goal

The user sends `/interrupt` in Telegram. The bridge sends one Escape key to the active tmux session. Claude Code stops the running task.

## 💡 Context

- Claude Code has no `/interrupt` slash command. The interrupt action is the Escape key press.
- `/clear` and other passthrough commands are typed text (`src/index.js:617-634`). `/interrupt` must NOT reach the pane as text.
- So `/interrupt` becomes a native bridge command. It follows the `/diag` pattern (`src/index.js:315`).
- Telegraf registers `bot.command()` handlers before `bot.on('text')` (`src/index.js:597`). The command handler intercepts `/interrupt` first. The text passthrough never sees it.
- The named-key helper already exists: `TmuxController.sendKeysWithDelay()` (`src/tmux/controller.js:79`). It runs one `send-keys -t <session> <key>` exec per key. The question modal already uses it for `Enter`, `Right`, `Space`, `Down`.

### ⚠️ Rules

- Send exactly ONE `Escape`. Two fast Escape presses trigger the Claude Code rewind feature. Never send two.
- Do not use `sendKeys()` for this. It sends literal text with `-l` (`src/tmux/controller.js:69`). A literal ESC byte is not a clean Escape press.
- Escape also cancels an open question modal. Clear `activeQuestion` after the send. Otherwise the Telegram card stays live. Its buttons would submit to a cancelled modal.
- Escape at an idle prompt does nothing harmful. The command still confirms.

### Code paths to reuse

| Concern | Where | Rule |
|---|---|---|
| Session guard | `ensureSessionAlive(ctx)` (`src/index.js:95`) | Reuse. It reports dead sessions and clears the connection. |
| Key send | `tmux.sendKeysWithDelay(activeSessionName, ['Escape'], 0)` | Reuse. Delay `0` avoids the default 300 ms sleep. |
| Typing | `stopTyping()` after the send | The turn was killed. Do not wait for a result event. |
| Question card | `activeQuestion = null` after the send | Escape cancels the modal in the pane. |
| Menu | `defaultCommands` in `updateBotCommands()` (`src/index.js:109`) | Add one entry. |
| Reply style | `ctx.reply` with `parse_mode: 'Markdown'` and backticked session name | Match the other commands. |

Note: a user skill named `interrupt` can no longer be triggered by typing. The native command wins. This mirrors the `/diag` vs `/doctor` decision.

## ✅ Task 1 — Implement the `/interrupt` handler and menu entry

**Files:** `src/index.js`, `test/integration.test.js` (one assertion only)

- **Steps:**
  1. Add `bot.command('interrupt', ...)` after the `status` command (`src/index.js:299`).
  2. Handler logic, in order:
     - If `!activeSessionName`: reply `⚠️ No active Claude session. Use /projects to start one first.` Then return.
     - Await `ensureSessionAlive(ctx)`. Return when it returns false.
     - Await `tmux.sendKeysWithDelay(activeSessionName, ['Escape'], 0);`
     - Set `activeQuestion = null;`
     - Call `stopTyping();`
     - Reply `` 🛑 Interrupt sent to `${activeSessionName}` `` with `parse_mode: 'Markdown'`.
  3. Add a short comment above the handler. State the one-Escape rule and the modal-clear rule. Match the `/diag` comment style.
  4. In `defaultCommands`: add `{ command: 'interrupt', description: 'Stop the running Claude task' }` after the `status` entry.
  5. Add one `/interrupt` line to the `/start` and `/help` command lists.
  6. In `test/integration.test.js`, first test: change `commandsSet.length` from `5` to `6`. Add `assert.ok(commandsSet.some(c => c.command === 'interrupt'))`.
- **Verify:** `npm test` passes. The suite is green after this task.

## ✅ Task 2 — Extend the test mock and add behavior tests

**Files:** `test/helpers.js`, `test/integration.test.js`

- **Steps:**
  1. In `makeBotMock()` (`test/helpers.js:53`): record command handlers. Add `commands: {}` to the `handlers` object. Replace `command: () => {}` with `command: (name, handler) => { handlers.commands[name] = handler; }`.
  2. Add three tests to `test/integration.test.js`. Follow the existing style (`makeBotMock`, `makeTmuxMock`, `MockReader`, `switchActiveSession`, `botInstance.stop()`).
     - **Test A — sends one Escape:** connect `claude-test`. Inject a text message first, so typing starts. Override `sendKeysWithDelay` to record calls. Run `mockBot.handlers.commands.interrupt` with a mock ctx. Assert one call with session `claude-test`, keys `['Escape']`, delay `0`. Assert the reply mentions `Interrupt`. Assert `getActiveState().typingActive === false`.
     - **Test B — no active session:** run the interrupt handler with no connected session. Assert the warning reply. Assert `sendKeysWithDelay` was never called.
     - **Test C — clears the question card:** connect a session. Arm a question via the reader `question` event. Run the interrupt handler. Then tap a `qa:0:1` action. Assert the callback answer is `Question expired or not found`.
  3. Call `botInstance.stop()` at the end of each test.
- **Verify:** `npm test` passes. All new tests pass.

## ✅ Task 3 — Document the command and run the full suite

**Files:** `README.md`

- **Steps:**
  1. Add a `/interrupt` row to the command table (`README.md:112-121`). Place it after the `/status` row. Text: `Sends one Escape key to the active session. Claude Code stops the current task.`
  2. Run `npm test`. All tests pass.
- **Verify:** Suite green. README table shows the new row.

## 🧪 Plan-level checks

- [ ] `npm test` passes with all new tests.
- [ ] `/interrupt` is registered in the Telegram command menu.
- [ ] The handler never injects the text `/interrupt` into the pane.
- [ ] The handler sends exactly one `Escape`, never two.

## 📦 Out of scope

- Deploy of the bridge. The daemon runs in Coolify. A redeploy applies the change.
- Hard kill of a session. `/projects` End Session covers that.
- `/status` enrichment (261005-mws). No shared code with this item.
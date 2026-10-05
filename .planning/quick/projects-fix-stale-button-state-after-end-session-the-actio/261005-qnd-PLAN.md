---
quick_id: 261005-qnd
title: "/projects: refresh action card after End Session"
depends_on: ["261005-qnc"]
files_modified: ["src/index.js"]
files_deleted: []
---

# Plan 261005-qnd — /projects: stale button after End Session

🔍 **Root cause (confirmed in code):**

- `bot.action(/proj_start:(.+)/)` in `src/index.js:472` already re-renders the
  action card with `buildProjectActionView` after it changes state (lines 480-487).
- `bot.action(/proj_kill:(.+)/)` in `src/index.js:514-532` does NOT. It kills the
  sessions and sends a new text reply (`🛑 All sessions for ... terminated`),
  but the action card message still shows `🛑 End Session` and the `🟢 Active`
  status line.

💡 `src/projects/menu.js` needs no change: `buildProjectActionView` derives the
`End/Start` button and status from `project.runningSessions`, and
`ProjectManager.listProjects()` reads live tmux state via
`controller.listSessions('claude-')` (`src/projects/manager.js:102`). After a
`tmux kill-session` the sessions are gone at once, so a fresh
`listProjects()` gives the idle state.

## Task 1 — Re-render the action card after kill

📍 **File:** `src/index.js` (proj_kill handler, lines 514-532)

✅ **Steps:**

1. After `killProjectSessions` and after `ctx.answerCbQuery('Sessions terminated')`,
   re-fetch fresh project data the same way `proj_start` does:

   ```js
   const fresh = (await projectManager.listProjects()).find(
     p => p.name === projectName || p.displayName === projectName
   );
   if (fresh) {
     const view = buildProjectActionView(fresh);
     await ctx.editMessageText(view.text, { parse_mode: 'Markdown', reply_markup: view.reply_markup });
   }
   ```

2. Keep the existing confirmation `ctx.reply(...)` AFTER the re-render so the
   card edit lands first (matches proj_start ordering).

⚠️ **Edge cases:**

- Project not found after kill (rare): the `if (fresh)` guard skips the edit —
  card stays as is, no crash.
- `editMessageText` can throw when the card is unchanged (Telegram
  "message is not modified"). Wrap it in `try {} catch {}` with a
  `console.warn('⚠️ Project card refresh failed')`, matching the
  fail-safe style in `CONVENTIONS.md`.

## Task 2 — Verify and commit

✅ **Steps:**

1. Run the test suite if present (`npm test`); the repo has no build/lint step.
2. Manual smoke (next deploy, out of scope here — do NOT deploy): End Session
   → card shows `⚪` idle status and `🚀 Start Session` before the confirmation
   reply arrives.
3. Commit with message:
   `projects: refresh action card after End Session` +
   `Co-Authored-By: Claude Code <noreply@anthropic.com>`.

<assumption_delta_decision>
No identity-model change: single noun (project action card), no pluralization,
optionalization, or parameterization in scope. Decision: no-change.
</assumption_delta_decision>

<threat_model>
Security enforcement (quick-batch): this plan edits command handler code only.

- ASVS level: L1 (not re-configured for quick batch; advisory).
- Threat: callback-data injection into `proj_kill:(.+)` regex — already
  mitigated: `projectName` never interpolates into shell; it matches through
  `sessionNameFor` + tmux session list filter.
- Threat: `editMessageText` throwing on unchanged message — handled with
  try/catch (fail-safe, no daemon crash).
- Blocking threshold: no new attack surface; no credential handling introduced.
</threat_model>
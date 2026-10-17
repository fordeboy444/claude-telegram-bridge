---
last_mapped_commit: e9e6d103c3f0fd409b3ef0bccf515ab9c64500a4
last_mapped_at: 2026-10-05
---
<!-- refreshed: 2026-10-05 -->

# Codebase Concerns

**Analysis Date:** 2026-10-05

## Tech Debt

**Session State Management:**
- Issue: State (active session, chat ID, typing timers) is managed via closure variables inside `createBot` in `src/index.js`. As the bot grows, this will become difficult to test and maintain.
- Files: `src/index.js`
- Impact: Harder to implement multi-user session isolation (currently assumes a primarily single-user or strictly shared-session model) and difficult to unit test state transitions.
- Fix approach: Move session state into a dedicated `SessionState` class or a lightweight store.

**Error Handling in Async Loops:**
- Issue: Several async calls in `src/index.js` (e.g., `refreshSkills`, `tmux.hasSession`) use `.catch(() => {})` or generic `try-catch` blocks that log warnings but don't have a recovery strategy.
- Files: `src/index.js`
- Impact: Silent failures in skill refreshing or session health checks can lead to a degraded user experience without clear failure indicators.
- Fix approach: Implement a structured error handling and retry mechanism for critical bridge operations.

## Known Bugs

**Not detected**

## Security Considerations

**Environment Variable Exposure:**
- Risk: Secrets (`TELEGRAM_BOT_TOKEN`) are loaded via `dotenv` from `.env`. While not hardcoded, the project relies on the host environment's security to protect this file.
- Files: `src/config.js`
- Current mitigation: `.gitignore` should ensure `.env` is not committed.
- Recommendations: Use a secret manager or Coolify's built-in environment variable injection for production.

**User Authorization:**
- Risk: Simple whitelist check for `ALLOWED_USER_IDS`.
- Files: `src/auth.js` (referenced in `src/index.js`)
- Current mitigation: `createAuthMiddleware` restricts access to whitelisted IDs.
- Recommendations: Ensure the whitelist is strictly managed.

## Performance Bottlenecks

**Tmux Polling Overhead:**
- Issue: `ClaudeSessionReader` (used in `src/index.js`) polls the tmux session at a configurable interval (default 1000ms).
- Files: `src/index.js`, `src/tmux/session_reader.js`
- Cause: Constant disk/process I/O to read session transcripts.
- Improvement path: If possible, move to a push-based notification system for tmux output, or optimize the reading buffer.

**Skill Scanning Frequency:**
- Issue: `refreshSkills` is called on every session switch and periodically.
- Files: `src/index.js`
- Cause: File system scanning of multiple directories (home, projects, etc.).
- Improvement path: Implement a cache with a TTL or a file-watcher (e.g., `chokidar`) to update skills only when files change.

## Fragile Areas

**Tmux Interaction:**
- Files: `src/tmux/controller.js`, `src/tmux/session_reader.js`
- Why fragile: The bridge relies on `tmux` CLI commands and parsing text output. Any change in tmux version or environment (e.g., different shell) could break the interaction.
- Safe modification: Wrap tmux commands in a highly abstracted layer with extensive integration tests.
- Test coverage: Integration tests exist in `test/tmux.test.js` and `test/session_reader.test.js`.

**Question Modal Handling:**
- Files: `src/index.js` (lines 451-471)
- Why fragile: `ensureModalSubmitted` uses regex on captured pane text (`/Submit answers/`) and sends hardcoded keys (`Enter`, `Right`). This is highly dependent on the exact UI rendering of Claude Code's modals.
- Safe modification: Avoid reliance on specific text labels if possible; monitor for specific session state changes.

## Scaling Limits

**Single Bot Token:**
- Current capacity: Single Telegram bot instance.
- Limit: Telegram's rate limits on `sendChatAction` and `sendMessage`.
- Scaling path: Move to a queue-based message delivery system if the number of concurrent users/sessions increases.

## Dependencies at Risk

**Telegraf Version:**
- Risk: Heavy reliance on `telegraf` v4.
- Impact: Breaking changes in Telegraf's middleware or API could disrupt the bridge.
- Migration plan: Keep dependencies updated and maintain a clean separation between the Telegram API and the Tmux logic.

## Missing Critical Features

**Multi-User Session Isolation:**
- Problem: The current architecture in `src/index.js` uses a single `activeSessionName`. If multiple whitelisted users use the bot, they will overwrite each other's active sessions.
- Blocks: Safe multi-user operation.

## Test Coverage Gaps

**E2E Deployment Verification:**
- What's not tested: The actual interaction between the Dockerized bridge and the host's tmux process in a production Coolify environment.
- Files: `test/e2e_verify.sh`
- Risk: Deployment failures due to permission issues with the tmux socket or environment paths.
- Priority: Medium

---

*Concerns audit: 2026-10-05*

---
last_mapped_commit: e9e6d103c3f0fd409b3ef0bccf515ab9c64500a4
last_mapped_at: 2026-10-05
---
# Coding Conventions

**Analysis Date:** 2026-10-05

## Naming Patterns

**Files:**
- Source files use `snake_case` for utility-like modules (e.g., `telegram_chunker.js`, `session_reader.js`) and `camelCase` or `snake_case` for others.
- Test files follow the pattern `[module].test.js` (e.g., `config.test.js`).

**Functions:**
- Use `camelCase` for function and method names (e.g., `loadConfig`, `createBot`, `switchActiveSession`).

**Variables:**
- Use `camelCase` for local variables and state tracking (e.g., `activeSessionName`, `typingTimer`).

**Types:**
- Project uses standard JavaScript (ES Modules). Classes use `PascalCase` (e.g., `TmuxController`, `ProjectManager`).

## Code Style

**Formatting:**
- ES Modules (`import`/`export`) are used throughout.
- Use of `node:path`, `node:os`, `node:url` prefixed imports for built-in modules.

**Linting:**
- Not explicitly defined in a config file, but follows a consistent style of async/await for I/O and Telegraf middleware patterns.

## Import Organization

**Order:**
1. External dependencies (e.g., `telegraf`)
2. Node.js built-in modules (prefixed with `node:`)
3. Local project imports (absolute relative paths)

**Path Aliases:**
- Not detected.

## Error Handling

**Patterns:**
- Use of `try...catch` blocks around external API calls (Telegram, tmux) to prevent daemon crashes.
- Warnings are logged to console using `console.warn` with emoji prefixes (e.g., `⚠️ Telegram command sync failed`).
- Fail-safe patterns: `alive = true` in catch blocks when a failure to check status should not block the operation.

## Logging

**Framework:** `console`

**Patterns:**
- Log initialization and critical state changes (e.g., `🤖 Claude Code Telegram Remote Bridge is running...`).
- Use of emoji prefixes for visibility in logs (e.g., `🔗 Re-attached`, `⚠️ Plugin skill scan failed`).

## Comments

**When to Comment:**
- Complex logic blocks, such as the `ensureModalSubmitted` loop or `CLAUDE_CODE_CHILD_SESSION` stripping, are documented with detailed comments explaining the "why".

**JSDoc/TSDoc:**
- Not extensively used; relies on descriptive function names and implementation comments.

## Function Design

**Size:** Functions are generally focused, though `createBot` is a large factory function containing the bot's internal state and command handlers.

**Parameters:** Use of options objects for dependency injection in `createBot(config, deps = {})`.

**Return Values:** Async functions consistently return Promises.

## Module Design

**Exports:** Named exports for utilities and classes; factory functions for bot initialization.

**Barrel Files:** Not detected.

---

*Convention analysis: 2026-10-05*

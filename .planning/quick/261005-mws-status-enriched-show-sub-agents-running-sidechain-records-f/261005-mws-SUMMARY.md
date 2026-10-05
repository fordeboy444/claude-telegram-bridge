---
status: complete
quick_id: 261005-mws
completed: 2026-10-05
commits:
  - f40f937 feat(status): add status module with session and sub-agent gathering
  - b436a4e feat(status): wire /status to the enriched dashboard with a fallback
  - 6b02b7b test(status): cover the status module, config claudeHome, and wired /status
  - 82c96c2 fix(status): return session start as epoch ms, not the raw timestamp string
---

# Summary 261005-mws: /status Enriched Dashboard

## What Changed

- ✅ `src/tmux/session_reader.js`: extracted `resolveClaudeProjectDir` and `findLatestJsonlFile` as exported helpers; class methods delegate. No behavior change (reader suite still green).
- ✅ `src/config.js`: new `claudeHome` config key (`CLAUDE_HOME` env override, default `~/.claude`).
- ✅ `src/status_report.js` (new): `gatherSessionStatus` reads the main transcript (first-record start time, 256 KB tail scan for the last assistant `message.model`, stat mtime for last activity) and `<projectDir>/<sessionId>/subagents/agent-*.jsonl` side-chain files (mtime freshness window, input+output token sums, last assistant model, meta labels). `formatStatusMessage` renders the dashboard with compact numbers, durations, and relative ages; lists at most 10 running agents, then `…and N more`; shrinks labels, then the list, to stay under 3800 chars.
- ✅ `src/index.js`: reader gets `claudeHome`; new `activeProjectPath` state set on session switches; `/status` reads `@claude_session_id` fresh (fallback to the reader's id), gathers, and replies with Markdown. Gather errors fall back to the old one-line reply plus a note; the command never crashes the daemon.
- ✅ Tests: `test/config.test.js` covers the `claudeHome` default/override; `test/status_report.test.js` (new) covers freshness split, token sums (cache fields ignored), label fallbacks (description → agentType → file-name id), missing transcript and missing subagents dir, list cap with `…and 20 more`, and helper formats; `test/helpers.js` `makeBotMock` records command handlers; `test/integration.test.js` adds an enriched `/status` test over a real temp claudeHome fixture asserting session name, uptime `25m`, model, and the running-agent line.

## Verification

- `npm test`: 146 tests, 146 pass, 0 fail (was 135; 11 new tests).
- Reader streaming behavior unchanged — no regression in `test/session_reader.test.js`.

## Notes for the Next Items

- ⚠️ An extra fix commit exists (session start parses to epoch ms). Three feature/test commits plus that fix.
- ℹ️ 261005-mwt touches `src/index.js` in different regions (/interrupt); no conflict expected.
- ℹ️ Constants live in `src/status_report.js`: `RUNNING_WINDOW_MS` (5 min), `MAX_LISTED_AGENTS` (10), `TAIL_BYTES` (256 KB), `DESC_MAX` (48).
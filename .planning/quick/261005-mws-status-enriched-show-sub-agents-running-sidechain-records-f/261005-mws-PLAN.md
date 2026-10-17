---
quick_id: 261005-mws
title: "/status enriched — sub-agents, runtime, tokens, model, uptime"
depends_on: []
files_modified:
  - src/config.js
  - src/tmux/session_reader.js
  - src/status_report.js
  - src/index.js
  - test/config.test.js
  - test/status_report.test.js
  - test/helpers.js
  - test/integration.test.js
files_deleted: []
---

# Plan 261005-mws: /status Enriched Dashboard

## 1. Goal

The `/status` command shows more data. Today it prints one line: session name plus Online/Terminated (`src/index.js:290-299`). After this change it prints a compact dashboard: running sub-agents, run time per agent, tokens per agent, current model, and session uptime.

## 2. Verified Data Sources (research 2026-10-05)

💡 All facts below come from real transcripts on this machine. Do not re-derive them.

| What | Where | Fields used |
|---|---|---|
| Main transcript | `<claudeHome>/projects/<slug>/<sessionId>.jsonl` | first record `timestamp` (session start); last assistant `message.model` (current model); file mtime (last activity) |
| Sub-agent transcripts | `<claudeHome>/projects/<slug>/<sessionId>/subagents/agent-<agentId>.jsonl` | `isSidechain:true` records; `timestamp`; assistant `message.usage` (`input_tokens`, `output_tokens`); assistant `message.model` (actual model) |
| Sub-agent meta | `agent-<agentId>.meta.json` next to each file | `agentType`, `description` (label). Tolerate a missing file |

- The bridge binds `<sessionId>` today: tmux option `@claude_session_id`, set at launch with `--session-id` (`src/projects/manager.js:130-137`), refreshed by the SessionStart hook. `ClaudeSessionReader` resolves the same path (`src/tmux/session_reader.js:88-94`).
- ⚠️ Sub-agent files contain NO `type:"result"` record and no portable completion marker. Async Agent calls return their parent tool_result at launch, not at completion. So "running" = last record time (file mtime) within a freshness window. Display "last active Xm ago" so the human can judge long silent tool calls.
- ⚠️ Old Claude Code versions wrote side-chain records inline in the parent file. Current versions use the `subagents/` dir. The host runs a current version. If the dir is missing, show "no sub-agents".

## 3. Design

```
/status
  └─> tmux.hasSession ────────────► alive flag
  └─> tmux option @claude_session_id (fallback: reader.sessionId)
  └─> gatherSessionStatus(claudeHome, projectPath, sessionId)
        ├─ main transcript  ─► start time, model (tail scan), last activity
        └─ subagents/*.jsonl ─► stat mtime ─► fresh? parse: elapsed, tokens, model
  └─> formatStatusMessage ─► ctx.reply (Markdown, < 3800 chars)
```

Dashboard sketch:

```
📊 *Session Status*
🎯 `claude-myproject` 🟢 Online
🤖 Model: `glm-5.3:cloud`
⏱ Uptime: 2h 14m · Last activity: 3m ago

🤝 *Sub-agents:* 2 running · 5 finished
1. [general-purpose] Fix failing tests
   ⏳ 12m · in 45.2k · out 3.1k · haiku · active 20s ago
2. [fork] Search docs
   ⏳ 2m · in 8.0k · out 1.2k · gemma4:31b · active 5s ago
```

Decisions:
- Tokens = sum of `usage.input_tokens + usage.output_tokens` over assistant records. Do not add cache fields (task says input+output). Show with compact format (`12.3k`).
- Elapsed per agent = `now - first record timestamp`. Sort running agents by start time, oldest first.
- Current model = model of the last assistant record. The gateway can remap, so do not use `meta.json.model` (that is the requested model).
- Uptime = `now - first transcript record timestamp`. After `/clear` the new transcript resets the uptime. This matches Claude session semantics.
- Main-chain token totals stay out of scope. Main transcripts can be many MB; only the tail is read.
- Constants in `src/status_report.js`: `RUNNING_WINDOW_MS = 5 * 60_000`, `MAX_LISTED_AGENTS = 10`, `TAIL_BYTES = 262_144`, `DESC_MAX = 48`.

## 4. Tasks

### Task 1 — Status module `src/status_report.js` + shared path helpers

1. `src/tmux/session_reader.js`: extract the bodies of `resolveProjectDir` and `findLatestSessionFile` into exported helpers `resolveClaudeProjectDir(claudeHome, projectPath)` and `findLatestJsonlFile(projectDir)`. The class methods delegate to them. No behavior change.
2. `src/config.js`: add `claudeHome: env.CLAUDE_HOME || path.join(os.homedir(), '.claude')` to the returned config (add `path`/`os` imports). This makes `/status` testable.
3. Create `src/status_report.js` (mirror the shape of `src/diagnostics.js`):
   - `async gatherSessionStatus({ claudeHome, projectPath, sessionId, now = Date.now() })`
     - Resolve the project dir with `resolveClaudeProjectDir`. Resolve the transcript: bound id → `<dir>/<id>.jsonl`; no id → `findLatestJsonlFile` (legacy). Effective id = bound id or the transcript basename.
     - Session start: open the transcript, read the first 8 KB, parse the first JSON line, read `timestamp`. Missing or broken → null.
     - Current model: read the last `TAIL_BYTES`, split into lines, scan from the end for the first parsed record with `type === 'assistant'` and `message.model`. Missing → null.
     - Last activity: `fs.stat` mtime of the transcript.
     - Sub-agents: list `<projectDir>/<effectiveId>/subagents/agent-*.jsonl`. For each file: `fs.stat`; if `now - mtime > RUNNING_WINDOW_MS`, count it as finished and do not parse it. Else parse all lines: first `timestamp` (start), last `timestamp`, sum input+output tokens from assistant records, last assistant `message.model`. Read `agent-<id>.meta.json` for the label: `description`, else `agentType`, else the `agentId` from the file name.
     - Return `{ transcriptFound, sessionStart, model, lastActivityMs, running: [...], finishedCount, totalCount }`.
   - `formatStatusMessage({ sessionName, alive, status, now })`
     - Sanitize labels: strip backticks and line breaks, truncate to `DESC_MAX`.
     - Compact numbers (`45.2k`), durations (`12m`, `2h 14m`), relative ages (`20s ago`).
     - List at most `MAX_LISTED_AGENTS` running agents, then one `…and N more` line. Keep the total under 3800 chars: if it still exceeds, shorten the label length first, then drop agents with the shortest run time.
   - Export `gatherSessionStatus`, `formatStatusMessage`, and the constants.
4. Verify: `npm test` stays green (reader behavior is unchanged).

### Task 2 — Wire `/status` in `src/index.js`

1. Pass the claude home into the reader: `new SessionReaderClass()` → `new SessionReaderClass({ claudeHome: config.claudeHome })` (`src/index.js:217`). The reader constructor already accepts `options.claudeHome`.
2. Track the bound project path: add a closure variable `activeProjectPath = null` next to the other state. In `switchActiveSession`: set it to `null` where `activeSessionName = sessionName;` runs, and set it to `resolvedProjectPath` inside the binding block. Orca projects pass real paths that differ from `projectsDir`, so reuse this value, do not recompute.
3. Replace the `bot.command('status')` handler:
   - No active session → keep the current reply.
   - Compute `exists` (keep the `tmux.hasSession` call).
   - Read the session id fresh: `await tmux.getSessionOption(activeSessionName, '@claude_session_id')` → fallback `activeSessionReader?.sessionId` → null. This stays correct after `/clear`.
   - Call `gatherSessionStatus({ claudeHome: config.claudeHome, projectPath: activeProjectPath || path.join(config.projectsDir, projectNameFromSession(activeSessionName)), sessionId, now: Date.now() })`.
   - Reply with `formatStatusMessage(...)`, `parse_mode: 'Markdown'`.
   - Wrap the gather step in try/catch. On error, fall back to the old one-line message plus a note. `/status` must never crash the daemon.
4. Verify: run the new tests from Task 3; run `npm test`.

### Task 3 — Tests

1. `test/config.test.js`: assert the `claudeHome` default and the `CLAUDE_HOME` override.
2. New `test/status_report.test.js` (follow `test/session_reader.test.js` fixture style: temp dir, hand-written JSONL):
   - Fixture with one running agent (fresh mtime, usage records, meta with description) and one finished agent (old mtime). With an injected `now`, assert: running filter, token sums (input+output only; cache fields ignored), elapsed math, model from the last assistant record, finished count.
   - Meta missing → label falls back to `agentType`, then file-name id.
   - No `subagents/` dir → zero running. Missing transcript → `transcriptFound: false`, null start and model, and the formatter still renders.
   - `formatStatusMessage`: 30 running agents → message under 3800 chars, contains `…and N more`; labels have no backticks.
3. `test/helpers.js`: make `makeBotMock` record command handlers (`handlers.commands[name] = handler`) instead of the current no-op. No existing test depends on the old no-op.
4. `test/integration.test.js`: new test for the enriched `/status`: `createBot` with `makeBotMock` + `makeTmuxMock` (`hasSession → true`, `getSessionOption → '<fixed-uuid>'`) + a stub `sessionReaderClass` and a temp `claudeHome` config; call `switchActiveSession`, dispatch the recorded `status` command with a reply-capturing ctx; assert the reply contains session name, uptime, model, and the running-agent line.

## 5. Verification

- `npm test` — all tests green, including the three changed suites and two new ones.
- Reader streaming behavior is unchanged (no regression in `session_reader.test.js`).
- Manual host smoke is out of scope here; the batch merge deploys through Coolify as usual.

## 6. Risks / Notes

- ⚠️ Freshness window tradeoff: an agent inside a long silent tool call (up to 10 min) can show as finished. The "active Xm ago" display limits the harm. The window is a named constant, so tune it in one place.
- ℹ️ `src/index.js` is also touched by 261005-mwt (/interrupt). The regions do not overlap; no ordering dependency. Merge conflicts should not occur.
- ℹ️ Telegram Markdown: all dynamic text passes through the sanitizer; the message stays under the 4096 limit.
- ℹ️ Uptime resets after `/clear` because Claude starts a new transcript. This is correct behavior.
---
quick_id: 261006-fgc
title: "/status card — thinking-effort line under the Model line"
depends_on: []
files_modified:
  - src/status_report.js
  - test/status_report.test.js
files_deleted: []
---

# Plan 261006-fgc: /status card — thinking-effort line under the Model line

## 1. Goal

The /status card gains one line directly under the Model line:

```
🤖 Model: `glm-5.3:cloud`
🧠 Effort: `high`
```

The level is that of the last `/effort <level>` prompt in the transcript tail. No such prompt exists → no Effort line at all (never a "unknown" row).

## 2. Current State (verified 2026-10-06)

| Piece | Location | State |
|---|---|---|
| /status gather | `src/status_report.js:187-246` (`gatherSessionStatus`) | ✅ returns `{transcriptFound, sessionStart, model, lastActivityMs, running, finishedCount, totalCount}`; the sole caller (`src/index.js:325-333`) passes the whole object to the renderer, so a new field needs no caller change |
| Tail-scan precedent | `src/status_report.js:42-71` (`readTailModel`) | ✅ reads the last `TAIL_BYTES` (line 17, 256 KiB), parses backwards from the end, skips malformed/chunk-cut lines — the exact pattern to mirror |
| Model line render | `src/status_report.js:338-340` (`renderStatusLines`) | ✅ `🤖 Model: \``…\``` via `sanitizeLabel`; the Effort line slots directly after this block |
| /effort level set | `src/skills/scanner.js:12` | ✅ builtin choices `['low', 'medium', 'high', 'xhigh', 'max']` — this is the valid level list; the picker (261005-qng) injects `/effort <level>` into the tmux session |
| `/effort` record shape in transcripts | `src/tmux/session_reader.js:150-152` | ✅ user records containing `<command-name>` markers are an observed transcript reality (the reader filters on them) |
| Tests | `test/status_report.test.js` | ✅ `makeFixture` builder with `writeTranscript`; no existing test writes an /effort record, so all current fixtures render without the new line — adding the field + optional line cannot break existing assertions |

Notes:

- A typed/injected `/effort high` reaches the transcript in one of two shapes, depending on whether Claude Code takes it as a local builtin command: the **command-marker record** (a `type:'user'` record whose content carries `<command-name>/effort</command-name>` and `<command-args>high</command-args>`, normally `isMeta: true`), or the **prompt record** (plain user content `/effort high`). Both must be matched; only a known level validates.
- `renderStatusLines` is a pure function of `status` (re-run by `fitMessage` shrinking passes) — the new line just follows the data.

## 3. Design

```
/status (src/index.js:325)
  └─> gatherSessionStatus → Promise.all gains readTailEffort(transcriptPath)
        └─> scan the last TAIL_BYTES backwards, user records only:
              ├─ marker form : <command-name>/effort</command-name> → args from <command-args>…</command-args>
              ├─ prompt form : line-anchored "/effort <level>"
              └─ normalized candidate ∈ {low,medium,high,xhigh,max} → return immediately (newest valid wins)
  └─> formatStatusMessage → renderStatusLines
        Model line ──► 🧠 Effort: `level`   (omitted entirely when effort is null)
```

Matcher spec (single module-local copy; the load-bearing shapes):

```js
// Command-marker form: args live in <command-args>
/<command-name>\s*\/effort\s*<\/command-name>/i   // identifies the record
/<command-args>([^<]*)<\/command-args>/           // captures the level candidate
// Prompt form: first token after a line-start "/effort"
/(?:^|\n)\/effort[ \t]+(\S+)/
// Normalize: String(candidate).trim().toLowerCase(); keep only if in EFFORT_LEVELS
```

Decisions:

- **Whitelist validation is the security control.** Transcript-sourced text cannot reach the Telegram card unless it equals one of the five builtin levels; `sanitizeLabel` is belt-and-braces on top (strips backticks/brackets, caps length) before the value enters the backticked segment.
- Records whose /effort args are unknown or empty (a custom project skill named `effort`, a bare `/effort`) are ignored and the backwards scan continues — the newest VALID level wins; none exists → `null` → no line.
- `EFFORT_LEVELS` is defined locally in `status_report.js`, mirroring `src/skills/scanner.js:12` choices; the status module stays free of the scanner import chain (gray-matter, projects/manager).
- No `isMeta` gate: the prompt-form fallback must keep working for non-meta records; the marker form identifies command records on its own.
- No caller change in `src/index.js` — the whole status object flows through.

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Claude transcript → Telegram card | Record content in the session JSONL (user- or machine-authored) is rendered into a Telegram Markdown message sent to the bot chat |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-261006-fgc-01 | Tampering — transcript content smuggled into the rendered card | `readTailEffort` → `renderStatusLines` Effort line | low | mitigate | The captured candidate must equal one of the five hardcoded `EFFORT_LEVELS`, else the record is ignored and the scan continues; `sanitizeLabel` additionally removes formatting characters and caps length before the value enters the backticked segment. Arbitrary transcript text cannot reach the card. Same containment pattern as the existing Model line (`status_report.js:339`). |
</threat_model>

## 4. Tasks

### Task 1 — Extract the last /effort level and render the Effort line (`src/status_report.js`)

1. Add `export const EFFORT_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'];` directly after `TAIL_BYTES` (`src/status_report.js:17`), with a one-line comment stating it mirrors the /effort builtin choices in `src/skills/scanner.js:12`.
2. Add `async function readTailEffort(filePath)` immediately after `readTailModel` (which ends at line 71), mirroring `readTailModel`'s structure exactly: `fs.stat` → read the last `TAIL_BYTES` → `split('\n')` → iterate from the **end** backwards → per-line `JSON.parse` inside try/catch (malformed and chunk-cut lines are skipped, same as readTailModel:60-63). For each parsed record:
   - Skip unless `record.type === 'user'` and `record.message && record.message.content` is present.
   - Normalize content to text exactly as `session_reader.js:144-150` does: a string stays as-is; an array becomes its `type: 'text'` blocks joined with `'\n'`; anything else is skipped.
   - Apply the marker form then the prompt form from the matcher spec above to the normalized text; normalize the captured candidate with `String(candidate).trim().toLowerCase()`.
   - The first backwards hit whose candidate is in `EFFORT_LEVELS` is returned immediately; an /effort record with unknown or empty args is ignored and the scan continues. Return `null` after the loop. Comment (one line): the current effort is the newest /effort prompt in the tail — same tail logic as `readTailModel`.
3. Wire the field into `gatherSessionStatus`:
   - The `empty` object (`src/status_report.js:188-196`) gains `effort: null` after `model: null`.
   - The `Promise.all` at lines 229-235 gains `readTailEffort(transcriptPath)` as the third task; the destructure becomes `const [sessionStart, model, effort, sub] = await Promise.all([...]`)` with the new call placed before `gatherSubAgents`.
   - The success return gains `effort,` after `model,` (line 240).
   - The missing-transcript early return (lines 221-227) already spreads `empty` — `effort` stays `null` there with no extra edit.
4. Render in `renderStatusLines`: directly after the Model push block (`src/status_report.js:338-340`) add:

   ```js
   if (status && status.effort) {
     lines.push(`🧠 Effort: \`${sanitizeLabel(status.effort, 24)}\``);
   }
   ```

   With a short comment noting the line is hidden until an /effort level exists in the transcript tail. Card order stays: name → Model → Effort → Uptime/Last activity → Sub-agents.
5. Verify: `npm test` — all existing suites stay green (no current fixture contains an /effort record, so the optional line never renders in old assertions).

### Task 2 — Tests for extraction, ordering, and absence (`test/status_report.test.js`)

Extend the fixture usage; import `EFFORT_LEVELS` alongside the existing imports if a test wants the list. Add three tests at the end of `test/status_report.test.js`:

1. `gatherSessionStatus reads the current effort level from the transcript tail`:
   - `fx.writeTranscript` with three records: `{ type: 'user', timestamp: '2026-10-05T10:00:00Z' }`; an assistant record with `message: { model: 'glm-5.3:cloud', usage: { input_tokens: 10, output_tokens: 5 } }`; then the command-marker record `{ type: 'user', isMeta: true, timestamp: '2026-10-05T10:05:00Z', message: { role: 'user', content: '<command-name>/effort</command-name>\n<command-message>effort</command-message>\n<command-args>high</command-args>' } }`.
   - Assert `status.effort === 'high'` and `status.model === 'glm-5.3:cloud'` (both fields survive side by side).
2. `the last /effort prompt wins, prompt-form text is recognized, and invalid args are skipped`:
   - Records in order: a plain-prompt user record with content `/effort medium`; a command-marker record with `<command-args>xhigh</command-args>`; a final command-marker record with `<command-args>banana</command-args>` LAST. Backwards scan skips banana and takes xhigh → assert `status.effort === 'xhigh'`.
   - A second fixture run with only a plain-prompt record `content: '/effort medium'` → assert `status.effort === 'medium'` (prompt form recognized without any markers).
   - A third fixture run with only `<command-args>banana</command-args>` → assert `status.effort === null`.
3. `formatStatusMessage renders the Effort line directly under the Model line and omits it without a level`:
   - Build a status object in the shape used by the existing formatter tests (all fields present; test/status_report.test.js:209-234 is the template) with `model: 'glm-5.3:cloud'` and `effort: 'high'`. Assert the message matches `/🧠 Effort:/`; then `message.split('\n')` — the index of the line matching `/Model:/` must be exactly one less than the index of the line matching `/🧠 Effort:/`, and the Effort line index must be less than the index of the line matching `/Uptime:/`.
   - The same object with `effort: null` → `assert.doesNotMatch(message, /Effort:/)`.
4. Verify: full `npm test` green.

## 5. Verification

- `npm test` (`node --test test/*.test.js`) — all suites green, including the three new tests.
- Coverage: marker-form extraction, prompt-form fallback, newest-valid-prompt-wins, invalid args skipped, line placement directly under Model and above the time line, and no Effort line when no level exists.

## 6. Risks / Notes

- ℹ️ No file overlap with sibling batch items: 261006-fgd (project-resources retitle) and 261006-fge (/diag → /resources) touch `src/diagnostics.js` / `src/index.js` / README / COOLIFY_DEPLOY.md / their tests — none touch `src/status_report.js` or `test/status_report.test.js`; 261006-fgf touches the /projects card code, not the /status card (the /status card already strips its own claude- prefix since 261005-qne). `depends_on` stays an honest empty array.
- ℹ️ Registry hooks self-checked: API-coverage (no external API integrated — local transcript parsing only), assumption-delta (no singular→plural identity change), schema-push (no ORM/schema files) — none fire.
- ⚠️ Matcher width discipline: if Claude Code's command-record format changes, the marker-form match misses but the prompt-form fallback keeps working. Do NOT widen the matcher to a bare content.includes('/effort') — model prose that merely mentions /effort would leak into the card. Line-anchored and marker-tagged shapes only.
- ℹ️ Effort levels are bridge-defined (low → max, `src/skills/scanner.js:12`). A future Claude Code level outside the whitelist renders no line rather than a wrong line — that is the whitelist containing as designed, not a bug.
- ℹ️ Deployment goes through the batch merge via Coolify as usual (no direct host commands).
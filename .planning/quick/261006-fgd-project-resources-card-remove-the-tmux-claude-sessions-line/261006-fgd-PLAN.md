---
plan_id: 261006-fgd
quick_id: 261006-fgd
title: "/project-resources card: remove the tmux sessions line and retitle the card to Resources"
depends_on: []
files_modified:
  - src/diagnostics.js
  - test/diagnostics.test.js
files_deleted: []
---

# Plan 261006-fgd — /project-resources card: drop the sessions row, retitle to Resources

## Goal

🎯 The `/project-resources` card is titled **Resources** and no longer shows the
`tmux claude sessions` line. Everything else on the card (active-session line,
four name-only skill/plugin sections) is unchanged.

## Ordering note (batch coordination)

⚠️ Sibling item 261006-fge (the `/diag` → `/resources` rename) also edits
`src/diagnostics.js` and `test/diagnostics.test.js` (command-name references in
code comments and the module-comment lines). This plan's edits are independent
of the rename — it does not need the rename to exist first. Canonical order
(mirrors the 261005-qnf → 261005-qnb precedent and the catalog order, where fgd
precedes fge): **this tiny card edit lands first; 261006-fge must declare
`depends_on: ["261006-fgd"]`**, then carry the retitle forward in its
comment/doc sweep and must NOT re-add the removed row. This plan must not touch
command registration in `src/index.js` or any command-name comment.

## Current behavior (verified)

- `src/diagnostics.js:121` — header entry: the card title string is composed
  with the two-word `Project Resources` label inside the `🗂️` bold span.
- `src/diagnostics.js:123-128` — active-session line (unchanged, out of scope).
- `src/diagnostics.js:129-132` — the sessions row: a `lines.push(...)` call that
  emits the 🖥️ row (label + each entry wrapped in backticks after
  `projectNameFromSession`) plus a trailing `''` blank buffer.
- `src/diagnostics.js:84-89, 108` — `gatherDiagnostics` still collects
  `tmuxSessions` and returns it; existing tests assert on the gathered data.
- `test/diagnostics.test.js:196` — asserts the current header text.
- No test asserts the sessions row itself.

## Design

💡 Display-only change inside `formatDiagnosticsMessage`. Keep the `🗂️` emoji
and the bold span (consistent with the card's other decorations: 🎯, 📁, 🧩).
Keep `gatherDiagnostics` untouched — its `tmuxSessions` data stays in the
contract, no consumer changes.

Card, before → after:

```
Before                          After
────────────────────────────    ────────────────────────────
🗂️ *Project Resources*          🗂️ *Resources*

🎯 *Active session:* `x`        🎯 *Active session:* `x` (🟢)
🖥️ *tmux claude sessions:* `x`
                                📁 *Local skills:*
                                • ...
📁 *Local skills:* ...
```

<assumption_delta_decision>
- Detector: not run (quick-batch item, no phase section; probe would skip).
- Reasoned verdict: `no-change`. This plan only edits displayed strings in an
  existing render function; no singular→plural seam, no field becomes optional,
  no constant becomes a parameter.
</assumption_delta_decision>

<api_coverage_check>
No external API integration: this plan edits Telegram message text only; no
new service, SDK, or HTTP surface is added. (Detector skipped — quick-batch
item with no phase section — reasoned opt-out recorded here instead.)
</api_coverage_check>

<schema_push_check>
No schema-relevant files in scope (no Prisma/Payload/Drizzle/Supabase/TypeORM
paths). Skip silently.
</schema_push_check>

<threat_model>
Security enforcement is active for this batch (ASVS 1, block on high). The
change is display-only: it REMOVES an information line and edits a title. No
new trust boundary, no new input surface, no untrusted data path is introduced;
session names already flow through `projectNameFromSession` inside the
authorized user chat.

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-261006-fgd-01 | Information Disclosure | `formatDiagnosticsMessage` card body | low | accept | Net-positive: dropping the sessions row reduces exposed host state; remaining rendering paths unchanged. No mitigation needed. |
| T-261006-fgd-SC | Tampering | npm/pip/cargo installs | high | accept | No package installs in this plan; package-legitimacy gate not applicable. |
</threat_model>

## Tasks

### Task 1 — Retitle the card and drop the sessions row

Files: `src/diagnostics.js`

1. In `formatDiagnosticsMessage`, line 121: change the header entry so the bold
   label reads `🗂️ *Resources*` — keep the emoji and the trailing `''` entry of
   that array untouched.
2. Lines 129-132: delete the sessions text entry from the `lines.push(...)`
   block (the 🖥️ row that renders `diag.tmuxSessions` through
   `projectNameFromSession`), keeping exactly one `''` buffer pushed at the end
   of that call — this preserves today's blank-line rhythm before the
   name-only sections.
3. Do NOT touch: the `activeSession`/`activeSessionAlive` block (lines 123-128),
   the section helper or the four name-only sections (lines 135-143),
   `gatherDiagnostics` (the `tmuxSessions` gather at lines 84-89 and its
   return at line 108 stays in the contract — tests assert on it), or the
   file-header/command-name comments on lines 2-4 and 22-23 (sibling 261006-fge
   sweeps those with the rename).

Verification:
- `node --test test/diagnostics.test.js` (from repo root) — passes. Before
  Task 2 lands this is expected RED only on the header assertion; after Task 2
  it is fully green.
- `grep -n "tmux claude sessions" src/diagnostics.js` → zero matches.
- `grep -n "Project Resources" src/diagnostics.js` → zero matches. Both gates
  are comment-safe as-is: the header comments carry only the lowercase
  hyphenated command name (`project-resources`), never the spaced title-case
  strings.

### Task 2 — Update the render tests

Files: `test/diagnostics.test.js`

1. Line 196 in the main render test
   (`renders four name-only lists from gathered state`): change the header
   assertion regex to expect `🗂️ \*Resources\*`.
2. In the same test (it feeds a real live tmux list on line 192, so an absence
   assertion is meaningful): add one absence assertion for the sessions-row
   label — the same literal the Task 1 gate greps for — alongside the existing
   absence asserts near line 204.
3. Do NOT change any `gatherDiagnostics` assertions (lines 73, 96 keep asserting
   the gathered `tmuxSessions` contract) and do NOT restructure the
   suffixed-session fixture at lines 257-270 (its `tmuxSessions` input becomes
   unused by the formatter and harmless to pass).

Verification:
- `node --test test/diagnostics.test.js` — all 11 tests pass, including the two
  touched ones.
- `npm test` — full suite stays green (baseline 162 passing; expect one added
  assertion, no new test count change required).

## Task order

Task 1 → Task 2 (tests assert Task 1's output).

## Out of scope

- ❌ `/diag` → `/resources` rename, hidden-alias removal, command menu, `/start`
  and `/help` text, README, COOLIFY_DEPLOY.md (261006-fge).
- ❌ Command-name comments in `src/diagnostics.js` / `test/diagnostics.test.js`
  headers (261006-fge sweeps them with the rename).
- ❌ `/status` thinking-effort line (261006-fgc).
- ❌ `/projects` card prefix strip (261006-fgf).
- ❌ Deploy to Coolify.

## Risks

⚠️ Merge overlap with 261006-fge in the same two files — coordinated via the
ordering note; fge must depend on this plan and leave the new header and the
absence of the row intact.

⚠️ Trailing blank line: keeping the single `''` buffer after removing the row
preserves spacing in the no-sections case; do not drop it and do not add extra
blanks.
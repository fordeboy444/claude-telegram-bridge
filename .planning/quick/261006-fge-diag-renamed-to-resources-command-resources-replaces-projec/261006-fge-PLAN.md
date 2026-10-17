---
phase: quick-261006-fge
plan: 01
type: execute
wave: 2
depends_on: ["261006-fgd"]
files_modified:
  - src/index.js
  - test/integration.test.js
  - README.md
  - COOLIFY_DEPLOY.md
  - src/diagnostics.js
  - test/diagnostics.test.js
autonomous: true
---

<objective>
Rename the project-resources diagnostic Telegram command to /resources and permanently remove the hidden /diag alias (item 261006-fge).

Purpose: /diag was already renamed once to /project-resources in batch 261005; this rename gives the command its final name and deletes the hidden legacy alias so exactly one command surfaces the resources card. Every user-facing mention and test contract moves to /resources; no hidden alias survives.
Purpose of depends_on: 261006-fgd edits src/diagnostics.js and test/diagnostics.test.js (card retitle + tmux-line removal); this plan also touches the stale command-name comments in those two files, so the plans must run on separate waves.
Output: src/index.js registers only /resources for the card, the Telegram menu / /start / /help texts, README.md, COOLIFY_DEPLOY.md and all comments reference /resources, and the rewritten integration test proves the alias is gone.
</objective>

## Diagram

```
Before:  /diag (hidden) ──────────┐
                                  ├──> handleProjectResources -> gatherDiagnostics -> formatDiagnosticsMessage -> Telegram card
/project-resources (menu) ────────┘

After:   /resources (menu, sole registration) -> handleResources -> gatherDiagnostics -> formatDiagnosticsMessage -> Telegram card
         (/diag and /project-resources: unregistered, removed from menu and docs)
```

<context>
@.planning/STATE.md

# Rename target: registration, command menu, /start, /help, comments
@src/index.js

# Test contract to rewrite; mock records handlers as handlers.commands[name]
@test/integration.test.js
@test/helpers.js

# Doc surfaces
@README.md
@COOLIFY_DEPLOY.md

# Stale command-name comments only (card content owned by 261006-fgd, already merged before this plan runs)
@src/diagnostics.js
@test/diagnostics.test.js
</context>

<tasks>

<!-- planner-discipline-allow: project-resources -->
<!-- planner-discipline-allow: command('diag') -->
<!-- planner-discipline-allow: /diag -->

These three literals are allowlisted because the plan must name the old forms to instruct the rename; the negative grep gates below apply only to code/docs, not to test/integration.test.js, which intentionally keeps them inside absence-assertions.

<task type="auto">
  <name>Task 1: Rewrite integration test contract for /resources (RED)</name>
  <files>test/integration.test.js</files>
  <action>In the test `createBot initializes Telegraf instance with middleware, setMyCommands, and handlers` (lines 12-46), replace ONLY the four command-name assertions at lines 36-42 with the post-rename contract. Keep every other assertion in this test unchanged (commandsSet.length === 6, commandsSet[0].command === 'projects', the interrupt entry assertion, and the all_private_chats scope assertion). New six assertions, in place:
  1. menu contains an entry whose command is `resources` — failure message: 'resources in the command menu'
  2. menu contains NO entry with command `diag` — message: 'removed /diag alias must not be in the command menu'
  3. menu contains NO entry with command `project-resources` — message: 'renamed /project-resources must not appear in the command menu'
  4. typeof mockBot.handlers.commands.resources === 'function' — message: 'resources handler registered'
  5. mockBot.handlers.commands.diag === undefined — message: 'hidden /diag alias removed'
  6. mockBot.handlers.commands['project-resources'] === undefined — message: 'project-resources registration replaced by resources'

  MakeBotMock records handlers via `command: (name, handler) => { handlers.commands[name] = handler; }` (test/helpers.js line 75), so the absence assertions on handlers.commands are the direct proof that the alias registration line no longer exists in src/index.js. Do not alter any other test in this file.</action>
  <verify>
    <automated>node --test test/integration.test.js</automated>
  </verify>
  <done>RED state: the createBot test fails specifically on the new /resources assertions (menu still carries the old name, handlers.commands.resources undefined, the alias handler still present) while every other test in the file still passes.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Register /resources in src/index.js and delete the /diag alias (GREEN)</name>
  <files>src/index.js</files>
  <behavior>
    - updateBotCommands defaultCommands (line 111-118): exactly 6 entries; the entry at line 116 `{ command: 'project-resources', description: 'Project resources: skills & plugins' }` becomes `{ command: 'resources', description: 'Project skills & plugin resources' }`.
    - Command routing: the card handler is bound via `bot.command('resources', ...)`, and neither the old hidden alias registration (`bot.command('diag', ...)`, line 386) nor the old-name registration (`bot.command('project-resources', ...)`, line 385) performs any handler registration — no hidden alias remains.
    - /start reply (line 269-282) lists the new bullet '• /resources - Project skills & plugin resources'.
    - /help reply (line 284-295) lists '• Use /resources to view the project's skills and plugins.'
  </behavior>
  <action>Five edits in src/index.js:
  1. Line 116 — replace the updateBotCommands menu entry so the list becomes `{ command: 'resources', description: 'Project skills & plugin resources' }` in the same position (between interrupt and help).
  2. Line 277 — in the /start reply, rename only the command token of that bullet to /resources; keep the dash text 'Project skills & plugin resources' unchanged so the bullet reads '• /resources - Project skills & plugin resources'.
  3. Line 291 — in the /help reply, rename only the command token so it reads '• Use /resources to view the project's skills and plugins.'; keep the sentence tail unchanged.
  4. Lines 369-386 — rename the handler function handleProjectResources to handleResources (also update the const at line 375 if desired but keep gatherDiagnostics / formatDiagnosticsMessage calls and the local diag variable untouched). Rewrite the block's leading comment to: 'Project resources card. Named /resources; typed commands map to tmux injection, so this slash form keeps it out of the pane (like /doctor).' and DELETE the sentence noting a hidden legacy alias that is not synced to the menu. Replace the two registration lines with one: register this handler under the new command name only — the line registering the old project-resources name (line 385) and the line registering the hidden alias starting with `bot.command('diag'` (line 386) are both deleted outright.
  5. Line 343 — in the /interrupt comment, remove the 'like /diag for /doctor' reference; keep the surrounding rationale intact (a slash typed by the user must never reach the pane as literal text).

  Do NOT rename internal JavaScript identifiers (gatherDiagnostics, formatDiagnosticsMessage, imports from './diagnostics.js', the local diag variable): items 261006-fgf/fgd and this item rename the Telegram command surface only, not the JS API. Do NOT re-add any hidden alias — the removed alias must not be kept anywhere.</action>
  <verify>
    <automated>node --test test/integration.test.js && ! grep -rn -e 'project-resources' -e "command('diag')" -e '/diag' src/index.js</automated>
  </verify>
  <done>GREEN state: the integration suite passes with the rewritten contract; src/index.js contains no old command name, no hidden alias registration, and no /diag comment reference; the card handler is reachable through the single new registration.</done>
</task>

<task type="auto">
  <name>Task 3: Point README, COOLIFY_DEPLOY and diagnostics-file comments at /resources</name>
  <files>README.md, COOLIFY_DEPLOY.md, src/diagnostics.js, test/diagnostics.test.js</files>
  <action>Four doc/comment edits:
  1. README.md line 119 — in the 'Commands & Interactions' table, change the row's command cell to `/resources`; keep the action text ('Lists the project's skills and plugins — name-only view of local and global skills, local and global plugins.') and the row's position between /interrupt and /help unchanged.
  2. COOLIFY_DEPLOY.md line 31 — replace check 2 with: '2. Verify that the /resources card reports the active session and lists project skills and plugins.'
  3. src/diagnostics.js — comments only: line 2, change the command name to /resources and drop the '(/diag is a hidden alias)' parenthetical so the sentence stays grammatical; line 22, change '/project-resources card' to '/resources card'. Do NOT touch gatherDiagnostics or formatDiagnosticsMessage bodies, signatures, or data fields — 261006-fgd owns this file's card content and has already landed when this task runs.
  4. test/diagnostics.test.js line 2 — header comment becomes '// /resources command internals: gathering live bridge state and formatting it // into a readable Telegram message.' (two lines, same shape as now). Leave the local diag variable names and the mkdtemp 'diag-' tmp prefixes untouched — they are internal literals, not the command surface.</action>
  <verify>
    <automated>npm test && ! grep -rn -e 'project-resources' -e "command('diag')" -e '/diag' src README.md COOLIFY_DEPLOY.md</automated>
  </verify>
  <done>README and the deploy guide reference the new command; the two diagnostics files carry no stale command-name comment; the full test suite (all test files, currently 162+ tests) is green; the only remaining mentions of the old names anywhere in the repo are the integration test's intentional absence-assertions.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Telegram user -> bot command routing | Untrusted command text reaches Telegraf routing; the global whitelist middleware (config.allowedUserIds via bot.use, src/index.js line 180) runs ahead of every command registration and covers the renamed command unchanged. |
| Bot -> Telegram setMyCommands sync | The renamed menu entry ships in the setMyCommands payload for the default and all_private_chats scopes; payload contents change by one label only, handler list unchanged. |

## STRIDE Threat Register

Threat IDs are item-scoped (T-261006-fge-NN); no other PLAN files exist for this batch item. Numbering starts at 01.

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-261006-fge-01 | Elevation of Privilege | bot.command resources registration | low | mitigate | No new reachable surface: the rename moves an existing handler inside the already-installed global whitelist middleware; Task 2 changes neither the middleware order nor the handler's Telegram side effects. |
| T-261006-fge-02 | Tampering | hidden /diag alias removal | low | accept | Deletion shrinks the reachable surface. Stale Telegram clients may keep showing cached old menu labels until updateBotCommands re-syncs at startup — cosmetic, self-healing. |

No npm/pip/cargo installs occur in this plan, so no package-legitimacy checkpoint row applies; this plan is fully autonomous (no blocking human checkpoints).
</threat_model>

<verification>
- `npm test` — full suite green (includes the rewritten createBot assertions and the untouched card-content tests from 261006-fgd).
- `! grep -rn -e 'project-resources' -e "command('diag')" -e '/diag' src README.md COOLIFY_DEPLOY.md` — zero stale command references in code and docs.
</verification>

<success_criteria>
- The Telegram command menu carries the renamed entry with description 'Project skills & plugin resources'; neither old name is registered as a handler or synced to the menu.
- Exactly one route to the resources card exists (the new command name); the hidden /diag alias is deleted, not kept; the old-name registration is removed.
- /start and /help list the new command; README.md and COOLIFY_DEPLOY.md reference it.
- Diagnostics-file comments mention only the new command; internal JS identifiers are untouched.
- Full test suite passes, proving the menu contract and the absence of the alias.
</success_criteria>

<output>
Create `.planning/quick/diag-renamed-to-resources-command-resources-replaces-projec/261006-fge-SUMMARY.md` when done
</output>
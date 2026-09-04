# CLAUDE.md

Guidance for Claude Code in this workspace.

Project-specific repo guidance lives in `claude-code-telegram-main/CLAUDE.md`.

## Workflow: Superpowers Plugin

This workspace uses the [Superpowers](https://github.com/obra/superpowers) plugin. Follow its skills:

- New feature / creative work → `superpowers:brainstorming` **before** planning or coding
- Bugs, test failures, unexpected behavior → `superpowers:systematic-debugging` **before** proposing fixes
- Plans → `superpowers:writing-plans`; execution → `superpowers:executing-plans` or `superpowers:subagent-driven-development`
- Before claiming anything works → `superpowers:verification-before-completion` (run the command, show the output)
- Invoke relevant skills before responding — including before clarifying questions

## Phase Handoff: /clear Between Phases

After finishing each phase, STOP and tell the user to run `/clear`, then give them the slash command that starts the next phase (include the plan/spec file path as the argument when one exists). Never continue into the next phase in the same session.

- Brainstorming done (spec saved) → `/clear` → `/superpowers:writing-plans <spec-path>`
- Plan written → `/clear` → `/superpowers:executing-plans <plan-path>` (or `/superpowers:subagent-driven-development <plan-path>`)
- Execution done → `/clear` → `/superpowers:requesting-code-review` (or `/superpowers:finishing-a-development-branch`)

## Plan & Spec File Naming (overrides plugin default)

Plugin default is date-only. Always include the **time alongside the date in the actual file name** so same-day artifacts sort chronologically and don't collide:

- Plans: `docs/superpowers/plans/YYYY-MM-DD-HHMM-<feature-name>.md`
- Specs / design docs: `docs/superpowers/specs/YYYY-MM-DD-HHMM-<topic>-design.md`

`HHMM` = 24-hour local time at creation. Example: `2026-09-04-1432-voice-retry-design.md`. State the date + time in the document header too.

## Explaining Plans & Specs to the User

The user prefers non-technical explanations. When presenting any plan, spec, or design:

- Use **emojis** as visual anchors (e.g. 🎯 goal, 🔍 analysis, 🏗️ architecture, 🚧 risks, ✅ done criteria)
- Include **diagrams** — ASCII/mermaid flow diagrams, before/after sketches, architecture pictures
- Avoid jargon; when a technical term is unavoidable, define it in one short phrase
- Lead with what the user gets ("the story"), then how it works
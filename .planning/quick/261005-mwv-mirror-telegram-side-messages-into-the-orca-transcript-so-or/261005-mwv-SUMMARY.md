---
quick_id: 261005-mwv
status: complete
branch_taken: B
date: 2026-10-05
---

# Summary 261005-mwv — Mirror Telegram-side messages into the Orca transcript

## Verdict

🅱 **Branch B — evidence close-out.** The bridge-side code fix is NOT needed. The Claude CLI already records every Telegram-typed prompt as a full user turn in the bound session JSONL, and Orca's session-history parser renders exactly that record shape. The two-way conversation already exists on disk.

## Task 1 evidence (live, read-only over SSH to 100.65.54.114)

Containers: bridge `z51mkfyd0o7dh7zbnkdolryx-105407018542`, orca `krno4lok0n60h987k6876wlw-085334508692`.

**Fact 1 — Telegram turns ARE in the JSONL.** One tmux session `claude-Main-Agent`, bound id `324df410-c8b8-4363-bdfc-2155cb66226c`. Its file `/home/orca/.claude/projects/-home-orca-Agents-Main-Agent/324df410-c8b8-4363-bdfc-2155cb66226c.jsonl` holds 6 `Telegram user:` matches, including typed user-turn records such as:

```json
{"parentUuid":"…","isSidechain":false,"promptId":"2b77f7d7-…","type":"user","message":{"role":"user","content":"Telegram user: yooo whats up"},"uuid":"983e7874-…","timestamp":"2026-10-05T14:20:53.715Z","permissionMode":"bypassPermissions","origin":{"kind":"human"},"promptSource":"typed","turnOrigin":"human","turnPosition":{"promptIndex":2,"turnIndex":2},"userType":"external","entrypoint":"cli","cwd":"/home/orca/Agents/Main Agent","sessionId":"324df410-…","version":"2.1.289"}
```

The CLI also writes a `last-prompt` record with `lastPrompt:"Telegram user: …"` per turn. The plan's unverified assumption (bridge echo suppression relies on tmux-typed text becoming JSONL user turns) is now verified TRUE.

**Fact 2 — all typed turns land in the SAME file.** The bound file holds 3 typed user turns: two `Telegram user:` injected turns and one bare `hi there` (no bridge prefix — typed outside the bridge path, e.g. a direct/resumed terminal on the same session id). Both kinds share the same session id and file. Orca-side typing on a resumed session (Orca Resume runs `claude --resume <id>`, same id, same file) lands here too. A brand-new Orca-run session gets a different file with a different session id — that is the only file a bridge view would not share, and the bridge must never write it.

**Fact 3 — Orca parser fields (from the orca container bundle, `/opt/orca/squashfs-root/resources/orcad-template/orcad.js`).**

- Session scan: `claude:{rootDirs:(e,t)=>pZi({claudeProjectsDir:e.claudeProjectsDir,wslHomeDirs:t}),extensions:[".jsonl"],directoryPredicate:e=>e!==K3e}` — it scans Claude's `~/.claude/projects` for `.jsonl` files. The bridge session file is at exactly that path and both containers mount `orca-home` at `/home/orca`.
- Turn parser (render path): records with `type === "user"` render their `message.content` (plain string or content-block array). Records are skipped only when `isMeta === true`, `isSynthetic === true`, `isCompactSummary === true`, or when user content is only tool-results. `promptSource`/`turnOrigin` are NOT required fields. The live Telegram records match: plain string content, none of the skip flags.
- `last-prompt` records feed the "First prompt" / preview text.

**Live render check (step 4): NOT directly observed.** The Agent Session History panel is UI-only; no REST endpoint for it exists in the onorca-api skill, and the runtime is a websocket+unix-socket protocol with an opaque wire format. I did not drive the panel headlessly. Confidence comes from the parser code + docs match instead — see "Residual unknowns".

## Branch decision

The plan's Branch B condition — "Telegram turns ARE present and DO render in the file-driven views" — is satisfied by facts 1+3 combined (present in file; parser renders plain-string user records from the very path Orca scans; no skip flags on those records). Branch A's premise (turns missing) is disproven by live data. Branch C (shape mismatch) is disproven since no parser-required field is missing. Per the orchestrator fallback rule, Branch B evidence close-out applies.

No code was changed. No commit. `npm test` still passes: 156/156 (checkout baseline after the three prior landed items).

## Branch B close-out record

- **Which file holds the full two-way conversation:** `/home/orca/.claude/projects/-home-orca-Agents-Main-Agent/324df410-c8b8-4363-bdfc-2155cb66226c.jsonl` — every Telegram-sent message appears as a `type:"user"` record with `message.content` = `Telegram user: <text>` (CLI-written, not bridge-written). Claude's replies appear as `type:"assistant"` records.
- **Which Orca view renders it:** the **Agent Session History** panel (right sidebar → Agents tab). Click the session row → details show message count, **First prompt** and **latest conversation turns** — user turns included; **Open log** shows the raw JSONL. Use **Refresh Session History** to force a scan after new turns. Scope toggle "All" shows it regardless of the active workspace.
- **Which view cannot show bridge-injected turns:** the **Chat UI (native chat)** — per Orca docs (agents/native-chat) it is a decoder over an Orca-run agent PTY; "the terminal remains the source of truth". The bridge tmux PTY lives in another container and is invisible to that view. No bridge-side file write can reach it — this is by design, not a bug.

## Residual unknowns (marked per orchestrator instruction)

- The panel render itself was not observed live (parser code is statically verified; no accessible API for the panel). Residual risk: the panel might apply an extra filter (e.g. agent-detection, session title heuristic) that hides this file. If the user reports the session row absent, first press Refresh Session History and check the view-options Agents toggle (Claude enabled), then re-investigate orcad's session-list metadata heuristics.
- Whether the user's original complaint was about looking at the Chat UI (PTY-bound, cannot show it) rather than the session-history panel is unconfirmed by evidence; the memory note addresses both.

## Deployment

None needed (no code change). Leave as-is: Coolify app `z51mkfyd0o7dh7zbnkdolryx`, branch `gsd-edition`, commit `efa64e7` — untouched.

## Files

- No source files modified. Only this summary + a memory note were written (docs artifacts not committed, per constraints).
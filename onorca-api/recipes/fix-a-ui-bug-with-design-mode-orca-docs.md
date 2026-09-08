# Fix a UI bug with Design Mode — Orca Docs

- **URL:** https://www.onorca.dev/docs/recipes/design-mode-fix
- **Summary:** Fix a UI bug with Design Mode — Orca documentation.

Search docs⌘K

Design Mode collapses the "that button looks wrong" → "fixed commit" loop to under a minute.

Steps
-----

1.  Open the worktree's browser pane. Navigate to the page with the bug.
2.  Toggle [Design Mode](https://www.onorca.dev/docs/browser/design-mode)
     on.
3.  Click the broken element. It lands in the agent chat as a rich attachment.
4.  Type what you want fixed: "this padding is too tight, increase to match the cards above."
5.  The agent edits the source. Hot reload refreshes the browser.
6.  Click the element again to verify — if still wrong, repeat.
7.  When it's right, commit.

Why it's fast
-------------

No screenshot, no DOM hunting, no selector copying. The agent gets the HTML, computed CSS, and a cropped image of the exact element you pointed at — the same context a human reviewer would want.

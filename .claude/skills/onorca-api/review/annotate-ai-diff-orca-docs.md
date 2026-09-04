# Annotate AI Diff — Orca Docs

- **URL:** https://www.onorca.dev/docs/review/annotate-ai-diff
- **Summary:** Annotate AI Diff — Orca documentation.

Search docs⌘K

Annotate AI Diff is Orca's inline review loop for agent-generated code. You leave comments on any line of any AI-generated hunk, then send them back to the agent as a single batch for revision — no copying line numbers, no context-switching.

![Annotate AI Diff — inline comments pinned to diff lines](https://www.onorca.dev/whats-new/posters/annotate-ai-diff.jpg)

Annotate AI Diff — inline comments pinned to diff lines

Leave a comment
---------------

1.  Hover any line in the diff. A **+** appears in the gutter.
2.  Click it (or press `c` with the cursor on the line).
3.  Type your feedback — markdown supported.
4.  Press `Cmd-Enter` to save, `Esc` to cancel.

Comments pin to the exact line; Orca tracks them across edits so they follow the line if the diff shifts.

Send the batch
--------------

When your review is done, click **Send to agent** at the top of the diff. Orca composes a single prompt with all your comments, line-anchored, then opens a **Send notes to** menu for the worktree's available agents. Pick the agent that should revise the change, or start a new agent from the same menu.

**Send Review Notes to Agent** is unbound by default so it won't collide with other chords. Assign it under [Settings → Shortcuts](https://www.onorca.dev/docs/settings)
 to open that send menu from the keyboard (works even while the editor is focused).

Why batch?
----------

Sending comments one at a time causes the agent to swing back and forth. Batching keeps the feedback coherent: one round of thinking, one revision pass, and a much higher hit rate.

Reply, resolve, re-review
-------------------------

*   Comments stay pinned after the agent revises — use them to verify the fix.
*   Click **Resolve** to collapse a thread.
*   Unresolved comments are part of the next batch if you hit **Send** again.

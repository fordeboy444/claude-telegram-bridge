# Jump between 10 worktrees — Orca Docs

- **URL:** https://www.onorca.dev/docs/recipes/jump-worktrees
- **Summary:** Jump between 10 worktrees — Orca documentation.

Search docs⌘K

Ten worktrees is a lot to juggle. The Jump Palette + Restart chip + agent state dots are built for this exact scale.

Steps
-----

1.  `Cmd-J` opens the jump palette. Type a fragment of the task name. Enter jumps; Shift-Enter opens in a split. Press **Tab** to filter by host or project when the list is large.
2.  Scan the sidebar — worktrees with active agents have a green dot. Go to the ones that need input (yellow) first.
3.  In each worktree, the **Restart** chip relaunches any agent that exited. Great for mass-resuming after a laptop sleep.
4.  Use the [persistent bell](https://www.onorca.dev/docs/notifications)
     to drain the "agent finished" queue — click a notification, it jumps you to the worktree.

Hygiene
-------

Delete merged worktrees aggressively. Orca makes this cheap — one click, worktree and branch both gone. Leaving dozens of merged worktrees around just slows down the palette.

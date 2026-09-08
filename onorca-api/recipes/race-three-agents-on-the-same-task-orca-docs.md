# Race three agents on the same task — Orca Docs

- **URL:** https://www.onorca.dev/docs/recipes/parallel-agents
- **Summary:** Race three agents on the same task — Orca documentation.

Search docs⌘K

Running the same task across multiple agents in parallel is Orca's killer move. Same prompt, three branches, pick the winner.

Steps
-----

1.  Create three worktrees from the same start-from ref. Name them `fix-bug`, `fix-bug-2`, `fix-bug-3`.
2.  Launch a different agent in each — Claude Code, Codex, Cursor CLI.
3.  Paste the same prompt into all three.
4.  Split the panes so you can see them work — drag tabs to edges.
5.  When they finish, review each diff. Use [Annotate AI Diff](https://www.onorca.dev/docs/review/annotate-ai-diff)
     on the winner.
6.  Commit, push, open PR from the winning worktree.
7.  Delete the two losers — one click removes the worktree and branch.

Why it works
------------

Different agents make different mistakes. Running the same task in parallel is cheaper than sequential retries and surfaces disagreement as a signal. Where three agents agree, the answer is probably right. Where they split, you've found the hard part.

# Cursor CLI in Orca — Orca Docs

- **URL:** https://www.onorca.dev/docs/agents/cursor-cli
- **Summary:** Cursor CLI in Orca — Orca documentation.

Search docs⌘K

Cursor CLI is Cursor's command-line agent. Orca runs it with first-class support — launch from the combobox, full OSC state detection, and restart chip on exit.

Setup
-----

1.  Install Cursor CLI per [Cursor's docs](https://cursor.com/cli)
    .
2.  Log in once.
3.  Orca auto-detects the CLI on `PATH`.

Launching
---------

Pick **Cursor** from the combobox. Orca launches the CLI scoped to the worktree. Cursor's TUI emits the state events Orca needs for agent state dots.

Model selection
---------------

Model selection is driven by Cursor's own settings. Orca doesn't override it — configure inside the CLI.

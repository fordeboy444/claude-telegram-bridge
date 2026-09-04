# Hot-swap Codex accounts — Orca Docs

- **URL:** https://www.onorca.dev/docs/agents/codex-hot-swap
- **Summary:** Hot-swap Codex accounts — Orca documentation.

Search docs⌘K

Running multiple Codex accounts to maximize tokens is common. Orca lets you hot-swap the active account in one click, with no re-login and no config editing. The same flow works for Claude Code accounts.

![Codex account switcher dropdown in the status bar](https://www.onorca.dev/whats-new/posters/codex-account-switcher.jpg)

Codex account switcher dropdown in the status bar

Add accounts
------------

1.  Log into each Codex account from a terminal at least once, so the auth sits under `~/.codex`.
2.  Open [Settings → Agents → Codex Accounts](https://www.onorca.dev/docs/settings)
    .
3.  Orca lists all detected accounts with their usage and current limit.
4.  Give each one a friendly label — "personal", "work", etc.

Swap accounts
-------------

Click the Codex chip in the status bar to open the account switcher. Pick an account; any new Codex session launched after that uses it. Sessions already running keep their original account until restarted.

System default
--------------

The **System default** row is your current host Codex login under `~/.codex`. Managed accounts (added in Orca) do not rewrite that login; they run in isolated homes. Select System default when you want launches to match a terminal `codex` outside Orca.

When config edits seem ignored
------------------------------

For managed Codex accounts, Orca mirrors settings from your real `~/.codex/config.toml` into the active runtime home. If that source file is missing, empty (e.g. cloud-sync still downloading), or unreadable, Accounts shows a warning: Codex keeps the **last successfully synced** settings until the source is healthy again. Fix the file at the path named in the banner, then relaunch or reselect the account.

Rules & gotchas
---------------

*   Swapping is instant — Orca rewrites the active credential pointer, it does not re-authenticate.
*   Existing Codex processes keep their current account until restart.
*   Usage readouts in the status bar follow the currently-active account.
*   The restart chip preserves the active account at the time of restart.

Claude Code accounts
--------------------

The Claude account switcher works identically — different data directory (`~/.claude`), same UX.

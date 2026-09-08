# Ways to run Orca — Orca Docs

- **URL:** https://www.onorca.dev/docs/ways-to-run
- **Summary:** Local desktop, SSH hosts, self-hosted Orca servers, and on-demand per-workspace VMs — pick the right compute for each task.

Search docs⌘K

Orca is not locked to your laptop. Every worktree runs somewhere — on the machine in front of you, on a box you already own, on a shared always-on server, or on a fresh cloud VM spun up for that one workspace.

This page is the map. Deep dives live on the linked pages.

At a glance
-----------

| Mode | Where files and agents live | Who owns the machine | Best for |
| --- | --- | --- | --- |
| **Local** | Your desktop | You | Day-to-day coding, fast iteration |
| **SSH target** | A remote host you connect to over SSH | You (or your team) | Dev boxes, GPU hosts, always-on VPS |
| **Remote Orca Server** | A machine running Orca desktop or `orca serve` | You (or your team) | Persistent shared runtime, mobile, automation |
| **Cloud VM / per-workspace environment** | A disposable VM/sandbox per workspace | Your cloud account (BYO provider) | Isolated, ephemeral agent compute |

Orca does **not** sell managed VPS hosting. Remote modes always use machines and cloud accounts you control.

1\. Local desktop
-----------------

Install Orca, open a project, create worktrees. Agents, terminals, and the browser run on the same machine as the UI.

![Sidebar worktrees on Local Mac — each card is a worktree with its own agents and branch.](https://www.onorca.dev/docs/ways-to-run-local-sidebar.png)

Sidebar worktrees on Local Mac — each card is a worktree with its own agents and branch.

This is the default path for most people. See [Your first 3-agent session](https://www.onorca.dev/docs/first-session)
 and [Worktrees](https://www.onorca.dev/docs/model/worktrees)
.

2\. SSH targets
---------------

Point Orca at any SSH host — a beefier Mac mini, a Linux VPS, a GPU box, a cloud sandbox with SSH. When you create a worktree, pick that host under **Run on**. Agents and `git worktree` run on the remote; the editor, diff, and UI stay on your laptop.

![Create worktree → Run on — choose Local or a configured remote host (here: openclaw over SSH).](https://www.onorca.dev/docs/ways-to-run-run-on.png)

Create worktree → Run on — choose Local or a configured remote host (here: openclaw over SSH).

**Good fit when:** the remote already has your repo, tools, and credentials, and you want one laptop Orca to drive many boxes.

**Setup sketch:**

1.  Add the host under [Settings → SSH](https://www.onorca.dev/docs/settings)
    .
2.  Test the connection (git must be available on the host for repo worktrees).
3.  Create a worktree and select the SSH target under **Run on**. The type-ahead lists ready hosts and, for hosts that are connected but not yet set up for this project, non-selectable **setup-needed** rows.

SSH worktrees can open in VS Code Remote-SSH, download remote folders when SFTP allows it, and stay usable for files/git even when the remote cannot compile terminal natives (install build tools for shells). Details: [SSH worktrees](https://www.onorca.dev/docs/ssh)
 and the recipe [Work on a remote machine over SSH](https://www.onorca.dev/docs/recipes/remote-worktrees)
.

3\. Remote Orca Servers
-----------------------

Keep Orca running on a machine you control—an old laptop, Mac mini, home server, cloud VPS, or team box. Pair your laptop, browser client, or phone to that runtime. The **server** owns projects, worktrees, terminals, and agent processes; clients are the UI.

**Good fit when:**

*   You want agents to keep running after your laptop sleeps
*   Mobile should reconnect to the same sessions
*   Automation or a backend should start sessions on a stable host

**Easiest setup:** install Orca and Tailscale on both computers. On the server, open **Settings → Remote Orca Servers → Advertise this app as a server → New Link**, choose its Tailscale address, and generate an access link. On the client, choose **Add Server** and paste that link.

For a headless Linux server or service-managed VM, use `orca serve` as the alternative:

    orca serve --pairing-address <reachable-tailscale-ip-or-hostname>

Full detail: [Remote Orca Servers](https://www.onorca.dev/docs/remote-servers)
.

### SSH vs Remote Orca Server

|     | SSH worktrees | Remote Orca Server |
| --- | --- | --- |
| Runtime owner | Laptop Orca | Remote machine (Orca desktop or `orca serve`) |
| Disconnect | Agents keep running on the host; laptop reattaches | Full session state lives on the server |
| Multi-client | One laptop drives the host | Laptop, web, mobile, and automation can share the same runtime |
| Typical setup | Import SSH config, pick **Run on** | Share the server app or run `orca serve`, then pair with a URL |

4\. Cloud VMs (per-workspace environments)

Each worktree can boot its own on-demand environment — a cloud sandbox, VM, or local Docker container — from a **recipe** checked into the repo (`orca.yaml` + lifecycle scripts). Create spins it up; suspend/resume/destroy tear it down. Orca is a thin wrapper: your provider account, images, and billing stay yours.

In the product UI this surface is labeled **Cloud VM** under [Settings → Experimental](https://www.onorca.dev/docs/settings)
. Recipes still create per-workspace environments.

Providers people wire today include Vercel Sandbox, Fly, Modal, plain SSH hosts, and local Docker. Connection is either **Orca server** (recipe starts `orca serve` and returns a pairing URL) or **SSH** (recipe returns connection details Orca dials).

![Settings → Experimental → Cloud VM — enable the skill, then have an agent set up a recipe for the repo.](https://www.onorca.dev/docs/ways-to-run-per-workspace-env.png)

Settings → Experimental → Cloud VM — enable the skill, then have an agent set up a recipe for the repo.

**Good fit when:** you want clean isolation per task, disposable compute, or a standard environment every agent boots into.

**Setup sketch:**

1.  Enable **Cloud VM** under [Settings → Experimental](https://www.onorca.dev/docs/settings)
    . The pane includes a short **Create a Cloud VM** guide and recipe/runtime controls.
    
2.  Install/update the Cloud VM / per-workspace environment skill if needed.
    
3.  In any workspace, ask your agent:
    
        Use the orca-per-workspace-env skill to set up a per-workspace environment for this repo.
    
4.  The skill walks prerequisites → base snapshot → agent auth → `orca.yaml` recipe → doctor validation.
    
5.  When a recipe appears under **Recipes**, create a worktree and choose it under **Run on**.
    

Recipes only show up for workspace create once the `environmentRecipes` entry is on the project's **primary** checkout of `orca.yaml` (not only a feature branch). Doctor and live provision can still run from any branch while you iterate on scripts.

How to choose
-------------

*   **Stay local** if the laptop is fast enough and agents are short-lived.
*   **SSH** if you already have a VPS or dev box and want agents there without installing a second Orca runtime.
*   **Remote Orca Server** if you want one always-on Orca runtime for mobile, browser, and automation.
*   **Cloud VM / per-workspace environments** if each task should get a fresh, recipe-defined sandbox that dies with the worktree.

You can mix modes in one install: local worktrees for quick edits, SSH for a GPU box, and a recipe for CI-like isolation.

Related
-------

*   [SSH worktrees](https://www.onorca.dev/docs/ssh)
    
*   [Remote Orca Servers](https://www.onorca.dev/docs/remote-servers)
    
*   [Worktrees](https://www.onorca.dev/docs/model/worktrees)
    
*   [Mobile](https://www.onorca.dev/docs/mobile)
    
*   [Settings reference](https://www.onorca.dev/docs/settings)

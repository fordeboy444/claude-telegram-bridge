---
name: telegram-bridge-setup
description: Configure the claude-telegram-bridge daemon, verify environment settings, and guide bot token creation.
---

# Telegram Bridge Setup

This skill configures the `claude-telegram-bridge` daemon and verifies dependencies. The daemon lives at the repository root (`src/index.js`, `package.json`).

## Quick Automated Setup

Run the setup helper script:
```bash
bash "$CLAUDE_SKILL_DIR/scripts/setup.sh"
```
*(Or `./scripts/setup.sh` inside the skill directory).*

This script will:
1. Locate the bridge repo root.
2. Generate `.env` from `.env.example` if missing.
3. Automatically configure `TMUX_PATH` (`wsl tmux` on Windows, `tmux` on Linux/macOS).
4. Install npm dependencies.
5. Check if your bot token and user ID are configured.

## Creating a Bot Token and User ID

For the canonical walkthrough, see the **Prerequisites** section of `README.md`.

1. **Bot token:** message **@BotFather**, send `/newbot`, and copy your HTTP API token.
2. **Your Telegram user ID:** message **@userinfobot** and copy your numeric ID.

## Step 1: Configure the Bridge Environment

Edit `.env` in the repo root:
- `TELEGRAM_BOT_TOKEN`: Your bot token from @BotFather.
- `ALLOWED_USER_IDS`: Your numeric ID (comma-separated if multiple).
- `PROJECTS_DIR`: Path to your projects root directory.
- `TMUX_PATH`: Path to tmux (set automatically by setup script).
- `POLL_INTERVAL_MS`: Polling interval in milliseconds (default: `1000`).

## Step 2: Verify and Start

1. Verify tests from the repo root:
   ```bash
   npm test
   ```
2. Start the daemon from the repo root with `npm start`, or deploy it as a Docker service (see `COOLIFY_DEPLOY.md`).
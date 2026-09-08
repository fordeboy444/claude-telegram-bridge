---
name: telegram-bridge-setup
description: Configure the claude-telegram-bridge daemon, verify environment settings, and guide bot token creation.
---

# Telegram Bridge Setup

This skill configures the `claude-telegram-bridge` daemon and verifies dependencies.

## Quick Automated Setup

Run the setup helper script:
```bash
bash "$CLAUDE_SKILL_DIR/scripts/setup.sh"
```
*(Or `./scripts/setup.sh` inside the skill directory).*

This script will:
1. Locate `claude-telegram-bridge/`.
2. Generate `.env` from `.env.example` if missing.
3. Automatically configure `TMUX_PATH` (`wsl tmux` on Windows, `tmux` on Linux/macOS).
4. Install npm dependencies.
5. Check if your bot token and user ID are configured.

## Step 1: Create a Telegram Bot

1. Open Telegram and message **@BotFather**.
2. Send: `/newbot`.
3. Choose a name and username.
4. Copy your HTTP API bot token.

## Step 2: Obtain your Telegram User ID

1. In Telegram, start the bot **@userinfobot**.
2. Copy your numeric user ID (for example: `123456789`).

## Step 3: Configure the Bridge Environment

Edit `claude-telegram-bridge/.env`:
- `TELEGRAM_BOT_TOKEN`: Your bot token from @BotFather.
- `ALLOWED_USER_IDS`: Your numeric ID (comma-separated if multiple).
- `PROJECTS_DIR`: Path to your projects root directory.
- `TMUX_PATH`: Path to tmux (set automatically by setup script).
- `POLL_INTERVAL_MS`: Polling interval in milliseconds (default: `1000`).

## Step 4: Verify and Start

1. Verify tests:
   ```bash
   cd claude-telegram-bridge && npm test
   ```
2. The bridge daemon starts automatically via session hooks when you launch Claude Code.

# Deploying claude-telegram-bridge on Coolify

## 1. Application Creation
- In Coolify, create a new Application from your GitHub repository.
- Build pack: `Dockerfile`
- Base directory: `/claude-telegram-bridge` (or `/` if deploying from a dedicated repo)
- Dockerfile path: `/Dockerfile`

## 2. Persistent Storage (Volume)
Attach the existing Orca volume:
- Volume Name: `orca-home`
- Destination Path: `/home/orca`

## 3. Environment Variables
Add the following environment variables in Coolify:
- `TELEGRAM_BOT_TOKEN`: `<your-telegram-bot-token>`
- `ALLOWED_USER_IDS`: `<your-telegram-numeric-user-id>`
- `ANTHROPIC_BASE_URL`: `http://100.65.54.114:4000`
- `ANTHROPIC_AUTH_TOKEN`: `<your-litellm-master-key>`
- `ANTHROPIC_MODEL`: `glm-5.3-flash:cloud`
- `HOME`: `/home/orca`
- `PROJECTS_DIR`: `/home/orca`
- `TMUX_PATH`: `tmux`
- `POLL_INTERVAL_MS`: `1000`

## 4. Verification
After deploying:
1. Open Telegram and message your bot with `/status`.
2. Verify that the diagnostics card reports the active directory and `tmux` status.
3. Use `/projects` to list workspaces configured in Orca.

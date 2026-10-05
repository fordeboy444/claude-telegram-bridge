# Deploying claude-telegram-bridge on Coolify

## 1. Application Creation
- In Coolify, create a new Application from your GitHub repository.
- Build pack: `Dockerfile`
- Base directory: `/` (the daemon lives at the repo root)
- Dockerfile path: `/Dockerfile`

## 2. Persistent Storage (Volume)
Attach the existing Orca volume:
- Volume Name: `orca-home`
- Destination Path: `/home/orca`

## 3. Environment Variables
Add the following environment variables in Coolify:
- `TELEGRAM_BOT_TOKEN`: `<your-telegram-bot-token>`
- `ALLOWED_USER_IDS`: `<your-telegram-numeric-user-id>`
- `ANTHROPIC_BASE_URL`: `https://ollama.com`
- `ANTHROPIC_AUTH_TOKEN`: `<your-ollama.com-api-token>`
- `HOME`: `/home/orca`
- `PROJECTS_DIR`: `/home/orca`
- `TMUX_PATH`: `tmux`
- `POLL_INTERVAL_MS`: `1000`

The daemon calls Ollama Cloud directly over the Anthropic protocol; the old LiteLLM gateway is decommissioned.
For the full token and user-id walkthrough, see the **Prerequisites** section of `README.md`.

## 4. Verification
After deploying:
1. Open Telegram and message your bot with `/status`.
2. Verify that the /project-resources card reports the active session and `tmux` status.
3. Use `/projects` to list workspaces configured in Orca.

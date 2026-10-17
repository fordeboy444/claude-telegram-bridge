---
last_mapped_commit: e9e6d103c3f0fd409b3ef0bccf515ab9c64500a4
last_mapped_at: 2026-10-05
---
# External Integrations

**Analysis Date:** 2026-10-05

## APIs & External Services

**Messaging:**
- Telegram Bot API - Primary interface for user interaction
  - SDK/Client: `telegraf`
  - Auth: `TELEGRAM_BOT_TOKEN`

## Data Storage

**Databases:**
- Not detected (The bridge is a stateless daemon tracking active sessions in memory)

**File Storage:**
- Local filesystem - Used for project directories and reading Claude Code session transcripts
  - Path: `PROJECTS_DIR` (defaulting to `process.cwd()` or `/home/orca`)

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- Custom Whitelist
  - Implementation: `src/auth.js` checks `ctx.from.id` against `ALLOWED_USER_IDS` provided in environment configuration.

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Console output (Standard out/err)

## CI/CD & Deployment

**Hosting:**
- Coolify (Self-hosted PaaS)

**CI Pipeline:**
- Not detected (Deployment is handled via Coolify Docker build)

## Environment Configuration

**Required env vars:**
- `TELEGRAM_BOT_TOKEN`: Bot token from BotFather
- `ALLOWED_USER_IDS`: Comma-separated list of permitted Telegram user IDs
- `PROJECTS_DIR`: Root directory where Claude Code project folders are located
- `TMUX_PATH`: Path to the tmux binary (defaults to `tmux`)
- `POLL_INTERVAL_MS`: Interval for polling session transcripts (defaults to `1000`)

**Secrets location:**
- `.env` file (local) or Coolify Environment Variables (production)

## Webhooks & Callbacks

**Incoming:**
- Telegram Bot API (Polling mode used via `bot.launch()`)

**Outgoing:**
- Telegram API calls for sending messages and chat actions (`typing`)

---

*Integration audit: 2026-10-05*

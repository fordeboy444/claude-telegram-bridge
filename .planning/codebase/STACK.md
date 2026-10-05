---
last_mapped_commit: e9e6d103c3f0fd409b3ef0bccf515ab9c64500a4
last_mapped_at: 2026-10-05
---
# Technology Stack

**Analysis Date:** 2026-10-05

## Languages

**Primary:**
- JavaScript (Node.js) - All application logic in `src/`

## Runtime

**Environment:**
- Node.js 22 (Bookworm Slim) - Specified in `Dockerfile`

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Telegraf ^4.16.3 - Telegram Bot API framework for the bridge daemon

**Testing:**
- Node.js built-in test runner - Configured in `package.json` scripts (`node --test test/*.test.js`)

**Build/Dev:**
- Docker - Containerization for deployment via Coolify

## Key Dependencies

**Critical:**
- `telegraf` - Handles all Telegram communication and command routing
- `dotenv` - Manages environment variables for bot tokens and allowed users
- `gray-matter` - Used for parsing skill metadata (likely in `src/skills/scanner.js`)

**Infrastructure:**
- `tmux` - External system dependency used for controlling Claude Code sessions (`src/tmux/controller.js`)
- `@anthropic-ai/claude-code` - Global CLI tool installed in the container to provide the underlying agent capability

## Configuration

**Environment:**
- Configured via `.env` and loaded in `src/config.js`
- Key configs required: `TELEGRAM_BOT_TOKEN`, `ALLOWED_USER_IDS`, `PROJECTS_DIR`, `TMUX_PATH`, `POLL_INTERVAL_MS`

**Build:**
- `Dockerfile` defines the build process, including system dependencies (tmux, git, curl) and global npm packages.

## Platform Requirements

**Development:**
- Node.js 22+
- npm

**Production:**
- Dockerized deployment on Coolify
- Linux environment with `tmux` support
- Volume mount for projects directory (e.g., `/home/orca`)

---

*Stack analysis: 2026-10-05*

# 🤖 Claude Code Telegram Remote Bridge

A lightweight Node.js daemon that connects your personal Telegram bot to live Claude Code CLI sessions running inside `tmux` on a host computer or remote VPS.

It gives you full bidirectional terminal interaction on your smartphone: send prompts directly to Claude, watch terminal outputs stream back in real-time, browse installed skills via interactive paginated buttons, and launch or manage project sessions effortlessly.

---

## 🎯 What You Get

- 🔄 **Live Terminal Mirroring:** Read Claude Code's responses as they appear in the terminal, automatically cleaned of messy ANSI codes, debounced, and neatly formatted.
- 📱 **Remote Control Anywhere:** Send instructions, questions, and replies from Telegram directly into Claude's prompt.
- 🛠️ **Interactive Skills Browser:** Browse, inspect, and trigger built-in commands (`/clear`, `/compact`, `/doctor`, `/help`) and custom skills with single taps or argument prompts.
- 📁 **Project Workspace Dashboard:** View project directories, inspect active sessions, launch fresh sessions, or terminate them with clean status badges (🟢 running / ⚪ idle).
- 🛡️ **Whitelist Security:** Only authorized Telegram user IDs can interact with your machine; unauthorized messages are dropped silently.

---

## 🏗️ Architecture & How It Works

```
 📱 Telegram App (Phone / Desktop)
        │
        │  [ HTTPS Long-Polling ]
        ▼
 🤖 Node.js Bridge Daemon (claude-telegram-bridge)
   ├── 🛡️ Whitelist Auth Guard (allowed IDs check)
   ├── ⌨️ User Message Handler -> tmux send-keys
   ├── 🛠️ Skills Scanner & Paginated Menu Generator
   ├── 📁 Project Manager (discover & start sessions)
   └── 🔄 Output Monitor (tmux capture-pane -> clean ANSI -> debounce -> chunk)
        │
        │  [ Native child_process ]
        ▼
 🖥️ Tmux Terminal Multiplexer
   └── Session: "claude-<project>"
        └── Active Claude Code CLI Process
```

---

## 📋 Prerequisites

1. **Node.js** (v18.0.0 or later)
2. **tmux** (`sudo apt install tmux` on Ubuntu/Debian, or `brew install tmux` on macOS)
3. **Claude Code CLI** installed and logged in (`npm install -g @anthropic-ai/claude-code`)
4. **Telegram Bot Token**: Created in 1 minute by messaging [@BotFather](https://t.me/BotFather) on Telegram (`/newbot`).
5. **Your Telegram User ID**: Discovered by messaging [@userinfobot](https://t.me/userinfobot) on Telegram.

---

## 🚀 Quickstart Guide

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd claude-code-telegram/claude-telegram-bridge
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
ALLOWED_USER_IDS=123456789
PROJECTS_DIR=/home/user/projects
TMUX_PATH=tmux
POLL_INTERVAL_MS=1000
```

### 3. Verify Setup

Run the verification test suite:

```bash
npm test
```

### 4. Start the Bridge

```bash
npm start
```

Open your Telegram bot and send `/start`!

---

## ⚙️ Configuration Reference

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `TELEGRAM_BOT_TOKEN` | **Yes** | — | Bot token received from `@BotFather`. |
| `ALLOWED_USER_IDS` | **Yes** | — | Comma-separated list of numeric Telegram User IDs authorized to use the bot. |
| `PROJECTS_DIR` | No | `process.cwd()` | Root directory containing your project folders. |
| `TMUX_PATH` | No | `tmux` | Path to `tmux` executable on your system. |
| `POLL_INTERVAL_MS` | No | `1000` | Terminal pane capture polling frequency in milliseconds. |

---

## 🎮 Telegram Commands & Interactions

| Command | Action |
|---|---|
| `/start` | Welcome overview and quick usage instructions. |
| `/projects` | Opens the Project Dashboard showing all workspaces and active tmux session status badges. |
| `/skills` | Opens the paginated Skills Browser to inspect details, execute skills, or run with arguments. |
| `/status` | Displays currently focused project session and online/offline status. |
| `/help` | Detailed help and button action explanations. |
| `<any text>` | Sends text directly into Claude Code in the active tmux pane as if typed on your keyboard! |
| `/cancel` | Aborts a pending "Run with Arguments" prompt. |

---

## 🐧 Run as a Linux Systemd Background Service

To keep your bridge running 24/7 on your server or home lab:

1. Create a service file `/etc/systemd/system/claude-bridge.service`:

```ini
[Unit]
Description=Claude Code Telegram Remote Bridge Daemon
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/claude-code-telegram/claude-telegram-bridge
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

2. Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable claude-bridge
sudo systemctl start claude-bridge
```

3. Check status:

```bash
sudo systemctl status claude-bridge
```

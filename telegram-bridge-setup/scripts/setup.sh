#!/bin/bash
set -e

echo "=========================================="
echo "🤖 Telegram Bridge Setup Helper"
echo "=========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRIDGE_DIR="$(cd "$SCRIPT_DIR/../../../../claude-telegram-bridge" 2>/dev/null && pwd || true)"

if [ ! -d "$BRIDGE_DIR" ]; then
  echo "❌ Error: Bridge directory not found at $BRIDGE_DIR"
  exit 1
fi

ENV_FILE="$BRIDGE_DIR/.env"
EXAMPLE_FILE="$BRIDGE_DIR/.env.example"

# Detect platform and set appropriate TMUX_PATH default
TMUX_PATH_DEFAULT="tmux"
if command -v wsl >/dev/null 2>&1 && wsl which tmux >/dev/null 2>&1; then
  TMUX_PATH_DEFAULT="wsl tmux"
fi

# Detect projects root directory default
WORKSPACE_DIR="$(cd "$BRIDGE_DIR/.." 2>/dev/null && pwd || true)"

if [ ! -f "$ENV_FILE" ]; then
  echo "📋 Creating .env from .env.example..."
  if [ -f "$EXAMPLE_FILE" ]; then
    cp "$EXAMPLE_FILE" "$ENV_FILE"
    # Set platform-specific tmux path
    sed -i -e "s|^TMUX_PATH=.*|TMUX_PATH=${TMUX_PATH_DEFAULT}|g" "$ENV_FILE"
    # Set default projects directory to workspace root
    sed -i -e "s|^PROJECTS_DIR=.*|PROJECTS_DIR=${WORKSPACE_DIR}|g" "$ENV_FILE"
  else
    cat <<EOF > "$ENV_FILE"
TELEGRAM_BOT_TOKEN=
ALLOWED_USER_IDS=
PROJECTS_DIR=${WORKSPACE_DIR}
TMUX_PATH=${TMUX_PATH_DEFAULT}
POLL_INTERVAL_MS=1000
EOF
  fi
  echo "✅ Created $ENV_FILE"
else
  echo "ℹ️ Existing .env found: $ENV_FILE"
fi

echo ""
echo "📦 Installing npm dependencies in claude-telegram-bridge..."
(cd "$BRIDGE_DIR" && npm install --silent)
echo "✅ Dependencies installed."

echo ""
echo "🔍 Validating configuration..."
TOKEN="$(grep -E '^TELEGRAM_BOT_TOKEN=' "$ENV_FILE" | cut -d '=' -f2- | tr -d ' \r\n')"
USERS="$(grep -E '^ALLOWED_USER_IDS=' "$ENV_FILE" | cut -d '=' -f2- | tr -d ' \r\n')"

if [ -z "$TOKEN" ] || [ "$TOKEN" = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz" ]; then
  echo "⚠️ TELEGRAM_BOT_TOKEN is not configured."
  echo "   1. Open Telegram and message @BotFather"
  echo "   2. Run /newbot and paste your token into: $ENV_FILE"
else
  echo "✅ TELEGRAM_BOT_TOKEN is present."
fi

if [ -z "$USERS" ] || [ "$USERS" = "123456789,987654321" ]; then
  echo "⚠️ ALLOWED_USER_IDS is not configured."
  echo "   1. Open Telegram and message @userinfobot"
  echo "   2. Paste your numeric ID into: $ENV_FILE"
else
  echo "✅ ALLOWED_USER_IDS is configured."
fi

echo ""
echo "=========================================="
echo "✅ Setup finished."
echo "The bridge daemon starts automatically via session hooks when you start Claude Code."
echo "=========================================="

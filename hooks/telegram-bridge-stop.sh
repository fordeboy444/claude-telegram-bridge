#!/bin/bash
# SessionEnd hook: stop the daemon THIS session started (single-owner PID file).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/../telegram-bridge.pid"

# No PID file: this session did not start the daemon; another session owns it.
if [ ! -f "$PID_FILE" ]; then
  exit 0
fi

PID="$(tr -d ' \r\n' < "$PID_FILE")"
if [ -n "$PID" ]; then
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "Stop-Process -Id $PID -Force -ErrorAction SilentlyContinue" 2>/dev/null || true
  else
    kill "$PID" 2>/dev/null || true
  fi
fi
rm -f "$PID_FILE"
exit 0

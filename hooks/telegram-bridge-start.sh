#!/bin/bash
# SessionStart hook: the bridge daemon starts with Claude Code.
# Single-owner PID file records which session started it (ponytail ceiling:
# with two concurrent Claude Code sessions, the first session's exit stops
# the daemon; upgrade to a refcount file if concurrent sessions get routine).

# The hook inherits the Claude Code environment; without this the marker
# leaks down the wsl -> tmux -> claude chain and disables transcript saving.
unset CLAUDE_CODE_CHILD_SESSION

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BRIDGE_DIR="$WORKSPACE_DIR/claude-telegram-bridge"
PID_FILE="$WORKSPACE_DIR/.claude/telegram-bridge.pid"

# First-time workspaces have no .env yet: stay silent, the setup skill
# handles configuration.
if [ ! -f "$BRIDGE_DIR/.env" ]; then
  exit 0
fi

# Is a bridge daemon already running? (same check the removed connect.sh used)
IS_RUNNING=0
if command -v powershell.exe >/dev/null 2>&1; then
  DAEMON_COUNT="$(powershell.exe -NoProfile -Command 'Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and ($_.CommandLine -like "*src/index.js*" -or $_.CommandLine -like "*claude-telegram-bridge*") } | Measure-Object | Select-Object -ExpandProperty Count' 2>/dev/null || echo "0")"
  if [ "${DAEMON_COUNT//[!0-9]/}" -gt 0 ] 2>/dev/null; then
    IS_RUNNING=1
  fi
else
  if pgrep -f "node.*(src/index\.js|claude-telegram-bridge)" >/dev/null 2>&1; then
    IS_RUNNING=1
  fi
fi

# Another session owns the running daemon: leave the PID file untouched.
if [ "$IS_RUNNING" -eq 1 ]; then
  exit 0
fi

# Start the daemon hidden and record the new process id.
if command -v powershell.exe >/dev/null 2>&1; then
  WIN_BRIDGE_DIR="$(cygpath -w "$BRIDGE_DIR" 2>/dev/null || echo "$BRIDGE_DIR")"
  PID="$(powershell.exe -NoProfile -Command "\$p = Start-Process -FilePath 'node.exe' -ArgumentList 'src/index.js' -WorkingDirectory '$WIN_BRIDGE_DIR' -WindowStyle Hidden -PassThru; Write-Output \$p.Id" 2>/dev/null | tr -d '\r\n')"
  if [ -n "$PID" ]; then
    echo "$PID" | tr -d '\r' > "$PID_FILE"
  fi
else
  ( cd "$BRIDGE_DIR" && nohup node src/index.js >/dev/null 2>&1 & echo $! > "$PID_FILE" )
fi
exit 0

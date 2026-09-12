#!/bin/sh
# Publish the live Claude session id onto the tmux session that runs this claude.
[ -n "$TMUX" ] || exit 0
input=$(cat)
sid=$(printf '%s' "$input" | node -e '
  let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
    try { console.log(JSON.parse(d).session_id || "") } catch {}
  })')
[ -n "$sid" ] && tmux set-option @claude_session_id "$sid"
exit 0
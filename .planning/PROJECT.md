# Project: Claude Telegram Bridge (GSD edition)

## Overview

Telegram bot bridge that runs tmux-hosted Claude Code sessions on the Hetzner
VPS host. Telegram users talk to Claude sessions; the bridge streams responses
back, offers slash-command browsers (skills, projects), and mirrors chat
transcripts. Deployed on Coolify as the `claude-telegram-bridge` app.

## Core Value

Reliable Telegram ↔ Claude Code conversations on the Hetzner host.

## Current Focus

Bridge UX batch v1.1: status dashboard, interrupt control, local skills
visibility, and Orca transcript parity.

## Key Decisions

- 2026-09-23: opencode install handled by Coolify pre/post-deploy (not baked image).
- 2026-10-05: engine routes direct to ollama.com (Anthropic protocol), not LiteLLM.
- 2026-10-05: GSD-edition branch is the deploy source (commit efa64e7 baseline).
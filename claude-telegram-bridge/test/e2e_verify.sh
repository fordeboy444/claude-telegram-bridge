#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "🧪 Running Claude Telegram Bridge test suite..."
node --test test/*.test.js

echo "✅ All tests passed successfully!"

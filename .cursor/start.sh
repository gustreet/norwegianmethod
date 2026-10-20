#!/usr/bin/env bash
set -euo pipefail
SESSION_NAME="norwegianmethod-dev-4317"
PORT=4317

if tmux -f /exec-daemon/tmux.portal.conf has-session -t "$SESSION_NAME" 2>/dev/null; then
  exit 0
fi

tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_NAME" -c /workspace -- \
  "${SHELL:-bash}" -lc "npm run dev -- --hostname 127.0.0.1 --port ${PORT}"

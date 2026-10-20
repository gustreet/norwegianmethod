#!/usr/bin/env bash
set -euo pipefail
# Push main to gustreet/norwegianmethod using GITHUB_PERSONAL_ACCESS_TOKEN (Cloud secret or local env).

if [[ -z "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]]; then
  echo "Missing GITHUB_PERSONAL_ACCESS_TOKEN. See docs/GITHUB-MCP.md" >&2
  exit 1
fi

OWNER="${GITHUB_OWNER:-gustreet}"
REPO="${GITHUB_REPO:-norwegianmethod}"
BRANCH="${1:-main}"

REMOTE_URL="https://x-access-token:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/${OWNER}/${REPO}.git"

git remote remove github 2>/dev/null || true
git remote add github "$REMOTE_URL"
git push -u github "$BRANCH"

echo "Pushed ${BRANCH} to https://github.com/${OWNER}/${REPO}"

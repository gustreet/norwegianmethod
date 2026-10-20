#!/usr/bin/env bash
# Runs during environment install when GITHUB_PERSONAL_ACCESS_TOKEN is injected.
set -euo pipefail

TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN:-${GH_TOKEN:-${GITHUB_TOKEN:-}}}"
if [[ -z "$TOKEN" ]]; then
  echo "setup-github-remote: no GitHub token in env; skip GitHub publish"
  exit 0
fi

export GH_TOKEN="$TOKEN"
OWNER="${GITHUB_OWNER:-gustreet}"
REPO="${GITHUB_REPO:-norwegianmethod}"

if ! command -v gh >/dev/null 2>&1; then
  echo "setup-github-remote: gh CLI missing" >&2
  exit 1
fi

if gh repo view "${OWNER}/${REPO}" >/dev/null 2>&1; then
  echo "setup-github-remote: ${OWNER}/${REPO} exists"
else
  if ! gh repo create "${REPO}" --public --description "Norwegian Singles / Bakken track TCX analysis" 2>/dev/null; then
    echo "setup-github-remote: cannot create repo (PAT needs Administration or classic repo scope)."
    echo "setup-github-remote: create empty https://github.com/new?name=${REPO} then re-run install or push."
    exit 0
  fi
fi

git remote remove github 2>/dev/null || true
git remote add github "https://x-access-token:${TOKEN}@github.com/${OWNER}/${REPO}.git"
if git push -u github HEAD:main 2>/dev/null || git push -u github main; then
  echo "setup-github-remote: pushed to https://github.com/${OWNER}/${REPO}"
else
  echo "setup-github-remote: push failed (repo missing or token lacks contents write)"
  exit 0
fi

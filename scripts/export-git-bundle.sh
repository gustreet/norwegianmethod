#!/usr/bin/env bash
# One-file export you can clone locally and push to GitHub with your own credentials.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/norwegianmethod-main.bundle"
cd "$ROOT"
git bundle create "$OUT" main
echo "Created ${OUT}"
echo "On your machine:"
echo "  git clone norwegianmethod-main.bundle norwegianmethod"
echo "  cd norwegianmethod && git remote add github https://github.com/gustreet/norwegianmethod.git"
echo "  git push -u github main"

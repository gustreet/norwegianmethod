#!/usr/bin/env bash
# Fail fast with a clear message when the injected PAT cannot push to GitHub.
set -euo pipefail

TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN:-${GH_TOKEN:-${GITHUB_TOKEN:-}}}"
OWNER="${GITHUB_OWNER:-gustreet}"
REPO="${GITHUB_REPO:-norwegianmethod}"

if [[ -z "$TOKEN" ]]; then
  echo "verify-github-pat: no token (set GITHUB_PERSONAL_ACCESS_TOKEN or GH_TOKEN)"
  exit 1
fi

export GH_TOKEN="$TOKEN"

echo "verify-github-pat: account $(gh api user -q .login 2>/dev/null || echo '?')"

if ! gh repo view "${OWNER}/${REPO}" >/dev/null 2>&1; then
  echo "verify-github-pat: repo ${OWNER}/${REPO} not visible to this token"
  echo "  → Fine-grained PAT: add this repo under Repository access"
  exit 1
fi

PROBE="verify-pat-$(date +%s).txt"
B64="$(printf '%s' 'ok' | base64 -w0 2>/dev/null || printf '%s' 'ok' | base64)"
HTTP="$(curl -s -o /tmp/verify-pat-body -w '%{http_code}' \
  -X PUT \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${OWNER}/${REPO}/contents/${PROBE}" \
  -d "{\"message\":\"verify\",\"content\":\"${B64}\"}")"

if [[ "$HTTP" == "201" ]]; then
  echo "verify-github-pat: OK — Contents write works (removed probe file)"
  SHA="$(jq -r .content.sha </tmp/verify-pat-body)"
  curl -s -X DELETE \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${OWNER}/${REPO}/contents/${PROBE}" \
    -d "{\"message\":\"cleanup verify\",\"sha\":\"${SHA}\"}" >/dev/null || true
  exit 0
fi

echo "verify-github-pat: FAIL — cannot write repository contents (HTTP ${HTTP})"
if [[ -f /tmp/verify-pat-body ]]; then
  jq -r .message </tmp/verify-pat-body 2>/dev/null || cat /tmp/verify-pat-body
fi
cat <<'EOF'

GitHub often returns repo "permissions.push: true" for read tokens; git push and
Contents API need an explicit fine-grained permission:

  Settings → Developer settings → Fine-grained tokens → your token
    Repository access: All repositories (or add norwegianmethod)
    Permissions → Repository permissions → Contents: Read and write

Or use a classic token with scope: repo

Then update Cursor:
  Plugins → GitHub → personal access token
  Cloud environment secret GITHUB_PERSONAL_ACCESS_TOKEN
Start a NEW agent run (secrets do not reload on a running VM).

EOF
exit 1

#!/usr/bin/env bash
# One-time push to GitHub. Requires a classic PAT with "repo" scope:
# https://github.com/settings/tokens
#
# Usage (do NOT paste the token into chat — only in your terminal):
#   export GITHUB_TOKEN=ghp_xxxxxxxx
#   bash scripts/push-to-github.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Set GITHUB_TOKEN first, e.g.:"
  echo "  export GITHUB_TOKEN=ghp_xxxxxxxx"
  echo "  bash scripts/push-to-github.sh"
  exit 1
fi

REPO="juleapechnikova-ai/hebrew-trainer"
AUTH_URL="https://${GITHUB_TOKEN}@github.com/${REPO}.git"

git push -u "$AUTH_URL" main

# Clear token from shell history suggestion (user should run unset after)
echo "Done. Run: unset GITHUB_TOKEN"

#!/bin/bash

# Build the web app and deploy it to Vercel.
# Usage: ./scripts/deploy-vercel.sh            # production (https://re-mamoney.vercel.app)
#        ./scripts/deploy-vercel.sh --preview  # preview deployment
#
# Needs .env.vercel.local with VERCEL_TOKEN=... (gitignored).
# Env vars (Firebase) come from the Vercel project via `vercel pull`, not from .env.local,
# so local-only secrets such as EXPO_PUBLIC_GITHUB_TOKEN never get bundled.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="re-mamoney"
PROD_URL="https://re-mamoney.vercel.app"
TOKEN_FILE=".env.vercel.local"
ENV_LOCAL=".env.local"
ENV_BACKUP=".env.deploy-backup.local" # matches .env.*.local in .gitignore
VERCEL="npx --yes vercel@latest"

step() { echo -e "${BLUE}▶ $1${NC}"; }
ok() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}" >&2; exit 1; }

# --- Args ---
TARGET="production"
PROD_FLAG="--prod"
case "${1:-}" in
  "") ;;
  --preview) TARGET="preview"; PROD_FLAG="" ;;
  -h|--help) sed -n '3,9p' "$0"; exit 0 ;;
  *) fail "Unknown option: $1 (use --preview or no option)" ;;
esac

# --- Recover from a previous interrupted run ---
if [ -f "$ENV_BACKUP" ] && [ ! -f "$ENV_LOCAL" ]; then
  mv "$ENV_BACKUP" "$ENV_LOCAL"
  echo -e "${YELLOW}Restored $ENV_LOCAL from an interrupted run${NC}"
fi

# --- Token ---
[ -f "$TOKEN_FILE" ] || fail "$TOKEN_FILE not found. Create it with: VERCEL_TOKEN=<your token>"
set -a
# shellcheck disable=SC1090
source "$TOKEN_FILE"
set +a
[ -n "$VERCEL_TOKEN" ] || fail "VERCEL_TOKEN is empty in $TOKEN_FILE"
TOKEN_ARGS=(--token "$VERCEL_TOKEN")

# --- Hide .env.local during the build so its secrets can't be bundled ---
restore_env() {
  if [ -f "$ENV_BACKUP" ]; then
    mv -f "$ENV_BACKUP" "$ENV_LOCAL"
  fi
}
trap restore_env EXIT
trap 'exit 130' INT TERM

echo -e "${BLUE}Deploying MaMoney web → Vercel (${TARGET})${NC}"

# --- Link ---
if [ ! -f .vercel/project.json ]; then
  step "Linking Vercel project $PROJECT_NAME"
  $VERCEL link --yes --project "$PROJECT_NAME" "${TOKEN_ARGS[@]}"
  restore_env # link may touch .env.local; make sure it's back in place
fi

# --- Pull env + settings ---
step "Pulling $TARGET env vars and project settings"
$VERCEL pull --yes --environment="$TARGET" "${TOKEN_ARGS[@]}" >/dev/null
ok "Env pulled"

# --- Build ---
if [ -f "$ENV_LOCAL" ]; then
  mv "$ENV_LOCAL" "$ENV_BACKUP"
fi
step "Building web app (npm run build:web)"
# shellcheck disable=SC2086
$VERCEL build $PROD_FLAG "${TOKEN_ARGS[@]}"
restore_env
ok "Build done"

# --- Deploy ---
step "Uploading prebuilt output"
# shellcheck disable=SC2086
DEPLOY_URL=$($VERCEL deploy --prebuilt $PROD_FLAG --yes "${TOKEN_ARGS[@]}" \
  | grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' | head -1)
[ -n "$DEPLOY_URL" ] || fail "Deploy finished but no URL was returned. Run: $VERCEL ls"

ok "Deployed: $DEPLOY_URL"
if [ "$TARGET" = "production" ]; then
  echo -e "${GREEN}🌐 Live at: $PROD_URL${NC}"
fi

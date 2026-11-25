#!/bin/bash

# Share the Expo web app publicly via ngrok so it can be opened on a phone.
# Usage: ./scripts/share-web.sh   (or: npm run share:web)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
METRO_PORT=8081
NGROK_API="http://localhost:4040/api/tunnels"
NGROK_LOG="/tmp/mamoney-ngrok.log"

log_info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }

# 1. Make sure Expo is running and serving a fresh bundle
"$SCRIPT_DIR/reload-app.sh"

# 2. Find an existing ngrok tunnel to the Metro port
get_tunnel_url() {
    curl -s --max-time 5 "$NGROK_API" 2>/dev/null | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(1)
for t in d.get('tunnels', []):
    if t.get('config', {}).get('addr', '').endswith(':$METRO_PORT') or 'localhost:$METRO_PORT' in t.get('config', {}).get('addr', ''):
        print(t['public_url'])
        sys.exit(0)
sys.exit(1)
" 2>/dev/null
}

TUNNEL_URL="$(get_tunnel_url || true)"

# 3. Start ngrok if no tunnel exists yet
if [ -z "$TUNNEL_URL" ]; then
    if ! command -v ngrok > /dev/null 2>&1; then
        log_error "ngrok not found on PATH (~/.local/bin/ngrok expected)"
        exit 1
    fi

    log_info "Starting ngrok tunnel to localhost:$METRO_PORT ..."
    nohup ngrok http "$METRO_PORT" --log=stdout > "$NGROK_LOG" 2>&1 &
    disown || true

    for _ in $(seq 1 20); do
        sleep 1
        TUNNEL_URL="$(get_tunnel_url || true)"
        [ -n "$TUNNEL_URL" ] && break
    done
fi

if [ -z "$TUNNEL_URL" ]; then
    log_error "Tunnel did not come up. Check $NGROK_LOG"
    exit 1
fi

log_success "Public URL: $TUNNEL_URL"
echo ""
echo "Open this URL on your iPhone (Safari)."
echo "First visit shows an ngrok notice page - tap 'Visit Site' to continue."
echo "The link stays live while this machine and the Expo server are running."
echo ""
echo "Local dev tools:  ngrok inspect --all   |   logs: $NGROK_LOG"

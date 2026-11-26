#!/bin/bash

# Start (or reuse) the MaMoney Expo web app for verification.
# Ensures Metro/Expo is running via scripts/reload-app.sh, then waits until
# the web bundle is being served at http://localhost:8081.
#
# Usage: ./scripts/verify/start-app.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
APP_URL="http://localhost:8081"

log_info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }

log_info "Ensuring Expo/Metro is running..."
"$PROJECT_DIR/scripts/reload-app.sh"

log_info "Waiting for $APP_URL to serve the app..."
for _ in $(seq 1 90); do
    if curl -s --max-time 3 "$APP_URL" | grep -qi "<html"; then
        log_success "App is ready: $APP_URL"
        exit 0
    fi
    sleep 2
done

log_error "App did not respond at $APP_URL within 180s"
exit 1

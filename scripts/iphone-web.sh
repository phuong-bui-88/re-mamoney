#!/bin/bash

# Open the MaMoney web build in Chrome as an iPhone, with DevTools open.
# Apple's iOS Simulator only runs on macOS. This uses react-native-web, not real iOS rendering.
#
# Usage: ./scripts/iphone-web.sh            (or: npm run iphone)
#        DEVICE=se|15|15pm ./scripts/iphone-web.sh
#        CHROME_PATH=/path/to/chrome ./scripts/iphone-web.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
METRO_PORT=8081
APP_URL="http://localhost:$METRO_PORT"
DEVICE="${DEVICE:-15pm}"

log_info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }

case "$DEVICE" in
    se)   DEVICE_NAME="iPhone SE";         WIDTH=375; HEIGHT=667 ;;
    15)   DEVICE_NAME="iPhone 15";         WIDTH=393; HEIGHT=852 ;;
    15pm) DEVICE_NAME="iPhone 15 Pro Max"; WIDTH=430; HEIGHT=932 ;;
    *) log_error "Unknown DEVICE '$DEVICE' (use: se, 15, 15pm)"; exit 1 ;;
esac

IPHONE_UA="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"

is_wsl() { grep -qi microsoft /proc/version 2>/dev/null; }

# 1. Make sure Expo/Metro is running and serving a fresh bundle
"$SCRIPT_DIR/reload-app.sh"

# 2. Wait for the web page to be served
log_info "Waiting for $APP_URL ..."
for _ in $(seq 1 60); do
    if curl -s --max-time 2 "$APP_URL" | grep -qi "<html"; then
        break
    fi
    sleep 2
done
if ! curl -s --max-time 2 "$APP_URL" | grep -qi "<html"; then
    log_error "Web app is not responding at $APP_URL (check: tmux attach -t expo)"
    exit 1
fi

# 3. Find Chrome
if [ -n "$CHROME_PATH" ]; then
    CHROME="$CHROME_PATH"
elif is_wsl; then
    CHROME="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
    PROFILE_DIR='C:\Temp\mamoney-iphone-profile'
else
    CHROME="$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || true)"
fi
PROFILE_DIR="${PROFILE_DIR:-$HOME/.cache/mamoney-iphone-profile}"

if [ -z "$CHROME" ] || { [ ! -x "$CHROME" ] && [ ! -f "$CHROME" ]; }; then
    log_error "Chrome not found. Set CHROME_PATH=/path/to/chrome"
    exit 1
fi

# 4. Launch Chrome: own profile (keeps DevTools device mode between runs), iPhone UA, DevTools open.
#    The window is device width + room for DevTools docked on the right.
log_info "Opening $DEVICE_NAME view (${WIDTH}x${HEIGHT}) in Chrome..."
nohup "$CHROME" \
    --user-data-dir="$PROFILE_DIR" \
    --no-first-run \
    --no-default-browser-check \
    --auto-open-devtools-for-tabs \
    --user-agent="$IPHONE_UA" \
    --window-size=$((WIDTH + 900)),$((HEIGHT + 120)) \
    --new-window "$APP_URL" > /dev/null 2>&1 &

log_success "Chrome opened at $APP_URL"
echo
echo "  First run only: in DevTools press Ctrl+Shift+M and pick \"$DEVICE_NAME\""
echo "  (Dimensions dropdown at the top). This profile remembers it next time."
echo
echo "  Debug: Console = logs, Sources = breakpoints (Ctrl+P to find a file),"
echo "         Network = Firebase calls. After code edits: ./scripts/reload-app.sh"
echo
echo "  Note: this is react-native-web, not real iOS. Native-only modules,"
echo "        fonts and safe areas can differ on a real iPhone."

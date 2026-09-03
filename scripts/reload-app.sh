#!/bin/bash

# Auto-Reload Expo App Script
# Sends reload command to Metro bundler via WebSocket.
# Usage: ./scripts/reload-app.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
METRO_PORT=8081

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in WSL
is_wsl() {
    grep -qi microsoft /proc/version 2>/dev/null
}

# Check if Metro bundler is running
check_metro_running() {
    if curl -s "http://localhost:$METRO_PORT/status" > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Kill any existing Expo processes
kill_expo_processes() {
    local pids
    pids=$(pgrep -f "expo start" 2>/dev/null)
    if [ -n "$pids" ]; then
        log_warning "Killing existing Expo processes: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Check if Expo process is running, start it if not
ensure_expo_running() {
    if pgrep -f "expo start --tunnel" > /dev/null 2>&1; then
        if is_wsl && tmux has-session -t expo 2>/dev/null; then
            log_info "Expo is running - sending reload..."
            tmux send-keys -t expo r
            log_success "Reload sent"
        fi
        return 0
    fi

    # Kill any existing Expo processes that might block
    kill_expo_processes

    log_warning "Expo is not running. Opening new terminal with: npx expo start --tunnel"

    local project_dir
    project_dir="$(cd "$SCRIPT_DIR/.." && pwd)"

    if is_wsl; then
        log_info "WSL detected - creating new tmux session"
        if ! tmux has-session -t expo 2>/dev/null; then
            tmux new-session -d -s expo -n "Expo" "cd $project_dir && npx expo start --tunnel"
            log_success "Expo session created"
        else
            log_info "Expo session exists, opening new window"
            tmux new-window -t expo -n "Expo" "cd $project_dir && npx expo start --tunnel"
        fi
        log_info "Attach with: tmux attach -t expo"
    elif command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd \"$project_dir\" && npx expo start --tunnel; exec bash" &
    elif command -v xterm &> /dev/null; then
        xterm -e bash -c "cd \"$project_dir\" && npx expo start --tunnel" &
    else
        log_warning "No terminal emulator found. Starting in background."
        cd "$project_dir" && nohup npx expo start --tunnel > /dev/null 2>&1 &
    fi

    log_info "Waiting for Expo to start..."

    local max_wait=30
    local waited=0
    while [ $waited -lt $max_wait ]; do
        if check_metro_running; then
            log_success "Metro bundler is ready"
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done

    log_error "Expo failed to start within ${max_wait}s"
    return 1
}

# Send reload via Metro WebSocket
send_reload() {
    log_info "Sending reload to Metro (ws://localhost:$METRO_PORT/hot)..."

    node -e "
        const WebSocket = require('ws');
        const ws = new WebSocket('ws://localhost:$METRO_PORT/hot');
        const timeout = setTimeout(() => { console.error('WebSocket timeout'); process.exit(1); }, 5000);
        ws.on('open', () => {
            ws.send(JSON.stringify({type:'reload'}));
            clearTimeout(timeout);
            setTimeout(() => { ws.close(); process.exit(0); }, 500);
        });
        ws.on('error', (err) => {
            clearTimeout(timeout);
            console.error('WebSocket error: ' + err.message);
            process.exit(1);
        });
    "
}

# Capture and display Expo QR code from tmux pane
capture_expo_qr() {
    if ! is_wsl || ! tmux has-session -t expo 2>/dev/null; then
        return 0
    fi

    log_info "Expo QR code:"
    echo ""

    # Capture pane content and extract QR code lines (only lines with block chars + spaces)
    local qr_lines
    qr_lines=$(tmux capture-pane -t expo -p | grep -E '^[ ▄█▀]+$' | head -25)
    
    if [ -n "$qr_lines" ]; then
        # Calculate width from first line
        local width
        width=$(echo "$qr_lines" | head -1 | wc -c)
        width=$((width - 1))  # Remove newline
        
        # Print top border
        printf "╔"
        printf '═%.0s' $(seq 1 $((width + 2)))
        printf "╗\n"
        
        # Print QR lines with side borders
        echo "$qr_lines" | while IFS= read -r line; do
            printf "║ %-${width}s ║\n" "$line"
        done
        
        # Print bottom border
        printf "╚"
        printf '═%.0s' $(seq 1 $((width + 2)))
        printf "╝\n"
    fi

    echo ""
    log_info "Scan with Expo Go app"
}

# Main function
main() {
    echo "=========================================="
    echo "  Expo Auto-Reload Script"
    echo "=========================================="
    echo ""

    # Step 1: Ensure Expo is running (start if needed)
    if ! ensure_expo_running; then
        log_error "Could not start Expo"
        log_info "Start Expo manually with: npm start"
        exit 1
    fi
    log_success "Expo process is running"

    # Step 2: Check Metro is ready
    if ! check_metro_running; then
        log_error "Metro bundler not ready on port $METRO_PORT"
        log_info "Wait for Metro to start, then try again"
        exit 1
    fi
    log_success "Metro bundler ready"

    # Step 2.5: Display QR code if available
    capture_expo_qr

    # Step 3: Send reload
    if send_reload; then
        log_success "Reload sent successfully"
    else
        log_error "Failed to send reload"
        exit 1
    fi

    echo ""
    if is_wsl && tmux ls 2>/dev/null; then
        echo ""
    fi
    echo "=========================================="
    log_success "Done! Check your device."
    log_info "Attach with: tmux attach -t expo"
    echo "=========================================="
}

# Run main function
main "$@"

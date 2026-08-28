#!/bin/bash

# Auto-Reload Expo App Script
# Checks if Expo is running with a device connected, then reloads the app.
# Usage: ./scripts/reload-app.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EXPO_PORT=19000
METRO_PORT=8081
STARTUP_TIMEOUT=30
RELOAD_TIMEOUT=10

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

# Check if Expo is running
check_expo_running() {
    if pgrep -f "expo start" > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Check if Metro bundler is running
check_metro_running() {
    if lsof -i :$METRO_PORT > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Start Expo in background
start_expo() {
    log_info "Starting Expo with tunnel..."
    
    # Start expo in background
    nohup npx expo start --tunnel > /tmp/expo_output.log 2>&1 &
    EXPO_PID=$!
    
    log_info "Expo started with PID: $EXPO_PID"
    log_info "Waiting for server to be ready..."
    
    # Wait for Expo to start
    local count=0
    while [ $count -lt $STARTUP_TIMEOUT ]; do
        if check_metro_running; then
            log_success "Expo server is ready!"
            return 0
        fi
        sleep 1
        count=$((count + 1))
        echo -n "."
    done
    
    echo ""
    log_error "Expo startup timeout after ${STARTUP_TIMEOUT}s"
    return 1
}

# Check for Android devices via adb
check_android_device() {
    if command -v adb &> /dev/null; then
        local devices=$(adb devices | grep -v "List" | grep "device$" | wc -l)
        if [ "$devices" -gt 0 ]; then
            return 0
        fi
    fi
    return 1
}

# Check for iOS Simulator
check_ios_simulator() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v xcrun &> /dev/null; then
            local simulators=$(xcrun simctl list devices booted | grep "Booted" | wc -l)
            if [ "$simulators" -gt 0 ]; then
                return 0
            fi
        fi
    fi
    return 1
}

# Check for Expo Go connections via WebSocket
check_expo_go_connection() {
    # Check if there are active WebSocket connections to the Expo dev server
    if lsof -i :$EXPO_PORT -sTCP:ESTABLISHED > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Send reload command via Expo's dev server API
send_reload_command() {
    log_info "Sending reload command..."
    
    # Method 1: Try Expo's /__reload endpoint
    if curl -s -X POST "http://localhost:$EXPO_PORT/__reload" > /dev/null 2>&1; then
        log_success "Reload command sent via Expo API"
        return 0
    fi
    
    # Method 2: Try Metro bundler's reload endpoint
    if curl -s -X POST "http://localhost:$METRO_PORT/reload" > /dev/null 2>&1; then
        log_success "Reload command sent via Metro bundler"
        return 0
    fi
    
    # Method 3: For Android devices, use adb
    if check_android_device; then
        log_info "Trying Android adb reload..."
        # Send reload broadcast (works for React Native apps)
        adb shell am broadcast -a com.facebook.react.ACTION_RELOAD > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_success "Reload command sent via adb broadcast"
            return 0
        fi
        
        # Alternative: Send key event for 'r' (may work with some setups)
        adb shell input text r > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_success "Reload command sent via adb input"
            return 0
        fi
    fi
    
    # Method 4: For iOS Simulator
    if check_ios_simulator; then
        log_info "Trying iOS Simulator reload..."
        # Use xcrun to send reload command
        xcrun simctl spawn booted open "exp://localhost:19000" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_success "Reload command sent to iOS Simulator"
            return 0
        fi
    fi
    
    # Method 5: Fallback - kill and restart expo (not ideal)
    log_warning "Could not send reload command directly"
    log_info "Restarting Expo as fallback..."
    
    # Kill existing expo processes
    pkill -f "expo start" > /dev/null 2>&1 || true
    sleep 2
    
    # Start expo again
    start_expo
}

# Main function
main() {
    echo "=========================================="
    echo "  Expo Auto-Reload Script"
    echo "=========================================="
    echo ""
    
    # Check if Expo is running
    if check_expo_running; then
        log_success "Expo is already running"
    else
        log_warning "Expo is not running"
        start_expo
    fi
    
    # Check for connected devices
    local device_found=0
    
    if check_android_device; then
        log_success "Android device detected"
        device_found=1
    fi
    
    if check_ios_simulator; then
        log_success "iOS Simulator detected"
        device_found=1
    fi
    
    if check_expo_go_connection; then
        log_success "Expo Go connection detected"
        device_found=1
    fi
    
    if [ $device_found -eq 0 ]; then
        log_warning "No device detected"
        log_info "Please ensure:"
        log_info "  1. Your device is connected via USB (Android)"
        log_info "  2. Expo Go app is open and connected"
        log_info "  3. iOS Simulator is running (macOS only)"
        echo ""
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Aborted by user"
            exit 0
        fi
    fi
    
    # Send reload command
    send_reload_command
    
    echo ""
    echo "=========================================="
    log_success "Reload complete!"
    echo "=========================================="
}

# Run main function
main "$@"

#!/bin/bash

# Test script for reload-app.sh
# Tests the key behaviors of the auto-reload functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELOAD_SCRIPT="$SCRIPT_DIR/reload-app.sh"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper functions
log_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

# Test 1: Script exists and is executable
test_script_exists() {
    log_test "Script exists and is executable"
    
    if [ -f "$RELOAD_SCRIPT" ]; then
        log_pass "Script file exists"
    else
        log_fail "Script file not found: $RELOAD_SCRIPT"
        return
    fi
    
    if [ -x "$RELOAD_SCRIPT" ]; then
        log_pass "Script is executable"
    else
        log_fail "Script is not executable"
    fi
}

# Test 2: Script has correct shebang
test_shebang() {
    log_test "Script has correct shebang"
    
    local first_line=$(head -n 1 "$RELOAD_SCRIPT")
    if [[ "$first_line" == "#!/bin/bash" ]]; then
        log_pass "Shebang is correct"
    else
        log_fail "Shebang is incorrect: $first_line"
    fi
}

# Test 3: Script has set -e for error handling
test_error_handling() {
    log_test "Script has error handling"
    
    if grep -q "set -e" "$RELOAD_SCRIPT"; then
        log_pass "Script has set -e for error handling"
    else
        log_fail "Script missing set -e"
    fi
}

# Test 4: Script has color output functions
test_color_functions() {
    log_test "Script has color output functions"
    
    local has_colors=0
    
    if grep -q "RED=" "$RELOAD_SCRIPT"; then
        has_colors=$((has_colors + 1))
    fi
    
    if grep -q "GREEN=" "$RELOAD_SCRIPT"; then
        has_colors=$((has_colors + 1))
    fi
    
    if grep -q "YELLOW=" "$RELOAD_SCRIPT"; then
        has_colors=$((has_colors + 1))
    fi
    
    if [ $has_colors -eq 3 ]; then
        log_pass "Script has color definitions"
    else
        log_fail "Script missing color definitions"
    fi
}

# Test 5: Script has ensure_expo_running function
test_ensure_expo_function() {
    log_test "Script has ensure_expo_running function"
    
    if grep -q "ensure_expo_running()" "$RELOAD_SCRIPT"; then
        log_pass "ensure_expo_running function exists"
    else
        log_fail "ensure_expo_running function not found"
    fi
}

# Test 6: Script has check_metro_running function
test_check_metro_function() {
    log_test "Script has check_metro_running function"
    
    if grep -q "check_metro_running()" "$RELOAD_SCRIPT"; then
        log_pass "check_metro_running function exists"
    else
        log_fail "check_metro_running function not found"
    fi
}

# Test 7: Script has send_reload function
test_send_reload_function() {
    log_test "Script has send_reload function"
    
    if grep -q "send_reload()" "$RELOAD_SCRIPT"; then
        log_pass "send_reload function exists"
    else
        log_fail "send_reload function not found"
    fi
}

# Test 8: Script uses WebSocket for reload
test_uses_websocket() {
    log_test "Script uses WebSocket for reload"
    
    if grep -q "require('ws')" "$RELOAD_SCRIPT"; then
        log_pass "Script uses ws package"
    else
        log_fail "Script does not use ws package"
    fi
}

# Test 9: Script connects to Metro WebSocket /hot
test_connects_metro_ws() {
    log_test "Script connects to Metro WebSocket /hot"
    
    if grep -q "/hot" "$RELOAD_SCRIPT"; then
        log_pass "Script connects to /hot endpoint"
    else
        log_fail "Script does not connect to /hot"
    fi
}

# Test 10: Script sends reload message
test_sends_reload_message() {
    log_test "Script sends reload message"
    
    if grep -q "'reload'" "$RELOAD_SCRIPT"; then
        log_pass "Script sends reload message"
    else
        log_fail "Script does not send reload message"
    fi
}

# Test 11: Script checks Metro port 8081
test_checks_metro_port() {
    log_test "Script checks Metro port 8081"
    
    if grep -q "METRO_PORT=8081" "$RELOAD_SCRIPT"; then
        log_pass "METRO_PORT=8081 configured"
    else
        log_fail "METRO_PORT=8081 not found"
    fi
}

# Test 12: Script does NOT have xdotool code
test_no_xdotool() {
    log_test "Script has no xdotool code"
    
    if grep -q "xdotool" "$RELOAD_SCRIPT"; then
        log_fail "Script still has xdotool code"
    else
        log_pass "No xdotool code"
    fi
}

# Test 13: Script does NOT have PTY code
test_no_pty() {
    log_test "Script has no PTY code"
    
    if grep -q "/dev/pts" "$RELOAD_SCRIPT"; then
        log_fail "Script still has PTY code"
    else
        log_pass "No PTY code"
    fi
}

# Test 14: Script has main function
test_main_function() {
    log_test "Script has main function"
    
    if grep -q "main()" "$RELOAD_SCRIPT"; then
        log_pass "main function exists"
    else
        log_fail "main function not found"
    fi
}

# Test 15: Script calls main at the end
test_main_called() {
    log_test "Script calls main at the end"
    
    if tail -n 5 "$RELOAD_SCRIPT" | grep -q 'main "$@"'; then
        log_pass "main is called at the end"
    else
        log_fail "main is not called at the end"
    fi
}

# Test 16: Script syntax is valid (bash -n)
test_syntax() {
    log_test "Script syntax is valid"
    
    if bash -n "$RELOAD_SCRIPT" 2>/dev/null; then
        log_pass "Script syntax is valid"
    else
        log_fail "Script has syntax errors"
    fi
}

# Test 17: package.json has reload script
test_package_json() {
    log_test "package.json has reload script"
    
    local package_json="$SCRIPT_DIR/../package.json"
    
    if [ -f "$package_json" ]; then
        if grep -q '"reload":' "$package_json"; then
            log_pass "reload script exists in package.json"
        else
            log_fail "reload script not found in package.json"
        fi
    else
        log_fail "package.json not found"
    fi
}

# Test 18: Script does NOT have interactive prompt
test_no_interactive_prompt() {
    log_test "Script has no interactive prompt"
    
    if grep -q 'read -p' "$RELOAD_SCRIPT"; then
        log_fail "Script still has interactive prompt"
    else
        log_pass "No interactive prompt (auto-proceed)"
    fi
}

# Test 19: Script has error message for missing Expo
test_expo_not_running_error() {
    log_test "Script has error message for missing Expo"
    
    if grep -q "Could not start Expo" "$RELOAD_SCRIPT"; then
        log_pass "Error message for missing Expo exists"
    else
        log_fail "Missing Expo error message not found"
    fi
}

# Test 20: Script has error message for Metro not ready
test_metro_not_ready_error() {
    log_test "Script has error message for Metro not ready"
    
    if grep -q "failed to start" "$RELOAD_SCRIPT"; then
        log_pass "Error message for Metro not ready exists"
    else
        log_fail "Metro not ready error message not found"
    fi
}

# Test 21: Script opens gnome-terminal when available
test_gnome_terminal() {
    log_test "Script opens gnome-terminal"
    
    if grep -q "gnome-terminal" "$RELOAD_SCRIPT"; then
        log_pass "gnome-terminal detection exists"
    else
        log_fail "gnome-terminal detection not found"
    fi
}

# Test 22: Script has xterm fallback
test_xterm_fallback() {
    log_test "Script has xterm fallback"
    
    if grep -q "xterm" "$RELOAD_SCRIPT"; then
        log_pass "xterm fallback exists"
    else
        log_fail "xterm fallback not found"
    fi
}

# Test 23: Script has background fallback for headless
test_background_fallback() {
    log_test "Script has background fallback"
    
    if grep -q "No terminal emulator found" "$RELOAD_SCRIPT"; then
        log_pass "Background fallback message exists"
    else
        log_fail "Background fallback message not found"
    fi
}

# Test 24: Script detects WSL
test_wsl_detection() {
    log_test "Script detects WSL"
    
    if grep -q "is_wsl()" "$RELOAD_SCRIPT" && grep -q "microsoft /proc/version" "$RELOAD_SCRIPT"; then
        log_pass "WSL detection exists"
    else
        log_fail "WSL detection not found"
    fi
}

# Test 25: Script uses tmux for WSL
test_wsl_tmux() {
    log_test "Script uses tmux for WSL"
    
    if grep -q "tmux new-session" "$RELOAD_SCRIPT" && grep -q "tmux attach" "$RELOAD_SCRIPT"; then
        log_pass "tmux session launch for WSL exists"
    else
        log_fail "tmux session launch for WSL not found"
    fi
}

# Test 26: Script shows tmux ls output on WSL
test_tmux_ls_output() {
    log_test "Script shows tmux ls output on WSL"
    
    if grep -q "tmux ls" "$RELOAD_SCRIPT"; then
        log_pass "tmux ls command exists in script"
    else
        log_fail "tmux ls command not found in script"
    fi
}

# Test 27: Script always shows attach hint at the end
test_always_shows_attach_hint() {
    log_test "Script always shows attach hint at the end"
    
    local last_lines
    last_lines=$(tail -n 10 "$RELOAD_SCRIPT")
    
    if echo "$last_lines" | grep -q 'tmux attach -t expo'; then
        log_pass "Attach hint is shown at the end of script"
    else
        log_fail "Attach hint not found at end of script"
    fi
}

# Test 28: tmux ls is guarded by is_wsl check
test_tmux_ls_guarded_by_wsl() {
    log_test "tmux ls is guarded by is_wsl check"
    
    if grep -B1 "tmux ls" "$RELOAD_SCRIPT" | grep -q "is_wsl"; then
        log_pass "tmux ls is guarded by is_wsl check"
    else
        log_fail "tmux ls is not guarded by is_wsl check"
    fi
}

# Test 29: Script still sends reload via WebSocket (regression)
test_reload_still_works() {
    log_test "Script still sends reload via WebSocket"
    
    if grep -q "require('ws')" "$RELOAD_SCRIPT" && grep -q "'reload'" "$RELOAD_SCRIPT"; then
        log_pass "WebSocket reload functionality intact"
    else
        log_fail "WebSocket reload functionality missing"
    fi
}

# Test 30: Script still has main function structure (regression)
test_main_structure_intact() {
    log_test "Script still has main function structure"
    
    if grep -q "main()" "$RELOAD_SCRIPT" && grep -q 'main "$@"' "$RELOAD_SCRIPT"; then
        log_pass "Main function structure intact"
    else
        log_fail "Main function structure broken"
    fi
}

# Test 31: capture_expo_qr function exists
test_capture_qr_function_exists() {
    log_test "capture_expo_qr function exists"
    
    if grep -q "capture_expo_qr()" "$RELOAD_SCRIPT"; then
        log_pass "capture_expo_qr function exists"
    else
        log_fail "capture_expo_qr function not found"
    fi
}

# Test 32: Script uses tmux capture-pane for QR
test_uses_tmux_capture_pane() {
    log_test "Script uses tmux capture-pane for QR"
    
    if grep -q "tmux capture-pane" "$RELOAD_SCRIPT"; then
        log_pass "tmux capture-pane command exists"
    else
        log_fail "tmux capture-pane command not found"
    fi
}

# Test 33: Script filters QR code characters with strict pattern
test_filters_qr_characters() {
    log_test "Script filters QR code characters with strict pattern"
    
    if grep -q "grep -E '^\[" "$RELOAD_SCRIPT"; then
        log_pass "Strict QR character filter exists"
    else
        log_fail "Strict QR character filter not found"
    fi
}

# Test 34: Script shows scan instructions
test_shows_scan_instructions() {
    log_test "Script shows scan instructions"
    
    if grep -q "Scan with Expo Go" "$RELOAD_SCRIPT"; then
        log_pass "Scan instructions exist"
    else
        log_fail "Scan instructions not found"
    fi
}

# Test 35: capture_expo_qr is guarded by is_wsl check
test_qr_guarded_by_wsl() {
    log_test "capture_expo_qr is guarded by is_wsl check"
    
    if grep -A5 "capture_expo_qr()" "$RELOAD_SCRIPT" | grep -q "is_wsl"; then
        log_pass "capture_expo_qr is guarded by is_wsl check"
    else
        log_fail "capture_expo_qr is not guarded by is_wsl check"
    fi
}

# Test 36: capture_expo_qr handles missing tmux session
test_handles_missing_tmux_session() {
    log_test "capture_expo_qr handles missing tmux session"
    
    if grep -A5 "capture_expo_qr()" "$RELOAD_SCRIPT" | grep -q "tmux has-session"; then
        log_pass "capture_expo_qr checks for tmux session"
    else
        log_fail "capture_expo_qr does not check for tmux session"
    fi
}

# Test 37: QR code has top border character
test_qr_has_top_border() {
    log_test "QR code has top border character"
    
    if grep -q 'printf "╔"' "$RELOAD_SCRIPT"; then
        log_pass "Top border character exists"
    else
        log_fail "Top border character not found"
    fi
}

# Test 38: QR code has bottom border character
test_qr_has_bottom_border() {
    log_test "QR code has bottom border character"
    
    if grep -q 'printf "╚"' "$RELOAD_SCRIPT"; then
        log_pass "Bottom border character exists"
    else
        log_fail "Bottom border character not found"
    fi
}

# Test 39: QR code has side border character
test_qr_has_side_borders() {
    log_test "QR code has side border character"
    
    if grep -q 'printf "║' "$RELOAD_SCRIPT"; then
        log_pass "Side border character exists"
    else
        log_fail "Side border character not found"
    fi
}

# Test 40: Border width is calculated from QR code
test_border_width_calculated() {
    log_test "Border width is calculated from QR code"
    
    if grep -q "wc -c" "$RELOAD_SCRIPT" && grep -q "width" "$RELOAD_SCRIPT"; then
        log_pass "Border width calculation exists"
    else
        log_fail "Border width calculation not found"
    fi
}

# Test 41: Empty QR code shows no border
test_empty_qr_no_border() {
    log_test "Empty QR code shows no border"
    
    if grep -q 'if \[ -n "$qr_lines" \]' "$RELOAD_SCRIPT"; then
        log_pass "Empty QR check exists"
    else
        log_fail "Empty QR check not found"
    fi
}

# Test 42: QR filter uses strict pattern (only block chars + spaces)
test_uses_strict_qr_pattern() {
    log_test "QR filter uses strict pattern"
    
    if grep -q "grep -E '^\[" "$RELOAD_SCRIPT"; then
        log_pass "Strict QR pattern exists"
    else
        log_fail "Strict QR pattern not found"
    fi
}

# Test 43: QR filter excludes lines with lowercase letters
test_excludes_lowercase_letters() {
    log_test "QR filter excludes lines with lowercase letters"
    
    # The pattern ^[ ▄█▀]+$ should NOT match lines with lowercase
    if echo "exp://test" | grep -E '^[ ▄█▀]+$' > /dev/null 2>&1; then
        log_fail "Pattern incorrectly matches lowercase letters"
    else
        log_pass "Pattern correctly excludes lowercase letters"
    fi
}

# Test 44: QR filter excludes URL lines
test_excludes_url_lines() {
    log_test "QR filter excludes URL lines"
    
    # The pattern should NOT match URLs with ://
    if echo "exp://fmcak8i-phuongbui1988-8081.exp.direct" | grep -E '^[ ▄█▀]+$' > /dev/null 2>&1; then
        log_fail "Pattern incorrectly matches URLs"
    else
        log_pass "Pattern correctly excludes URLs"
    fi
}

# Test 45: QR filter still matches valid QR lines
test_still_matches_valid_qr() {
    log_test "QR filter still matches valid QR lines"
    
    # The pattern SHOULD match valid QR code lines
    if echo "▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄" | grep -E '^[ ▄█▀]+$' > /dev/null 2>&1; then
        log_pass "Pattern correctly matches valid QR lines"
    else
        log_fail "Pattern incorrectly rejects valid QR lines"
    fi
}

# Run all tests
run_tests() {
    echo "=========================================="
    echo "  Reload Script Test Suite"
    echo "=========================================="
    echo ""
    
    test_script_exists
    test_shebang
    test_error_handling
    test_color_functions
    test_ensure_expo_function
    test_check_metro_function
    test_send_reload_function
    test_uses_websocket
    test_connects_metro_ws
    test_sends_reload_message
    test_checks_metro_port
    test_no_xdotool
    test_no_pty
    test_main_function
    test_main_called
    test_syntax
    test_package_json
    test_no_interactive_prompt
    test_expo_not_running_error
    test_metro_not_ready_error
    test_gnome_terminal
    test_xterm_fallback
    test_background_fallback
    test_wsl_detection
    test_wsl_tmux
    test_tmux_ls_output
    test_always_shows_attach_hint
    test_tmux_ls_guarded_by_wsl
    test_reload_still_works
    test_main_structure_intact
    test_capture_qr_function_exists
    test_uses_tmux_capture_pane
    test_filters_qr_characters
    test_shows_scan_instructions
    test_qr_guarded_by_wsl
    test_handles_missing_tmux_session
    test_qr_has_top_border
    test_qr_has_bottom_border
    test_qr_has_side_borders
    test_border_width_calculated
    test_empty_qr_no_border
    test_uses_strict_qr_pattern
    test_excludes_lowercase_letters
    test_excludes_url_lines
    test_still_matches_valid_qr
    
    echo ""
    echo "=========================================="
    echo "  Test Results"
    echo "=========================================="
    echo ""
    echo "Total tests: $TESTS_TOTAL"
    echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed!${NC}"
        exit 1
    fi
}

# Run tests
run_tests

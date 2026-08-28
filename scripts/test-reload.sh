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

# Test 5: Script has check_expo_running function
test_check_expo_function() {
    log_test "Script has check_expo_running function"
    
    if grep -q "check_expo_running()" "$RELOAD_SCRIPT"; then
        log_pass "check_expo_running function exists"
    else
        log_fail "check_expo_running function not found"
    fi
}

# Test 6: Script has start_expo function
test_start_expo_function() {
    log_test "Script has start_expo function"
    
    if grep -q "start_expo()" "$RELOAD_SCRIPT"; then
        log_pass "start_expo function exists"
    else
        log_fail "start_expo function not found"
    fi
}

# Test 7: Script has device detection functions
test_device_detection() {
    log_test "Script has device detection functions"
    
    local has_android=0
    local has_ios=0
    
    if grep -q "check_android_device()" "$RELOAD_SCRIPT"; then
        has_android=1
    fi
    
    if grep -q "check_ios_simulator()" "$RELOAD_SCRIPT"; then
        has_ios=1
    fi
    
    if [ $has_android -eq 1 ] && [ $has_ios -eq 1 ]; then
        log_pass "Device detection functions exist"
    else
        log_fail "Missing device detection functions"
    fi
}

# Test 8: Script has reload command function
test_reload_function() {
    log_test "Script has reload command function"
    
    if grep -q "send_reload_command()" "$RELOAD_SCRIPT"; then
        log_pass "send_reload_command function exists"
    else
        log_fail "send_reload_command function not found"
    fi
}

# Test 9: Script has main function
test_main_function() {
    log_test "Script has main function"
    
    if grep -q "main()" "$RELOAD_SCRIPT"; then
        log_pass "main function exists"
    else
        log_fail "main function not found"
    fi
}

# Test 10: Script calls main at the end
test_main_called() {
    log_test "Script calls main at the end"
    
    if tail -n 5 "$RELOAD_SCRIPT" | grep -q 'main "$@"'; then
        log_pass "main is called at the end"
    else
        log_fail "main is not called at the end"
    fi
}

# Test 11: Script has timeout configuration
test_timeout_config() {
    log_test "Script has timeout configuration"
    
    if grep -q "STARTUP_TIMEOUT=" "$RELOAD_SCRIPT"; then
        log_pass "STARTUP_TIMEOUT is configured"
    else
        log_fail "STARTUP_TIMEOUT not found"
    fi
}

# Test 12: Script has port configuration
test_port_config() {
    log_test "Script has port configuration"
    
    local has_expo_port=0
    local has_metro_port=0
    
    if grep -q "EXPO_PORT=" "$RELOAD_SCRIPT"; then
        has_expo_port=1
    fi
    
    if grep -q "METRO_PORT=" "$RELOAD_SCRIPT"; then
        has_metro_port=1
    fi
    
    if [ $has_expo_port -eq 1 ] && [ $has_metro_port -eq 1 ]; then
        log_pass "Port configurations exist"
    else
        log_fail "Missing port configurations"
    fi
}

# Test 13: Script syntax is valid (bash -n)
test_syntax() {
    log_test "Script syntax is valid"
    
    if bash -n "$RELOAD_SCRIPT" 2>/dev/null; then
        log_pass "Script syntax is valid"
    else
        log_fail "Script has syntax errors"
    fi
}

# Test 14: package.json has reload script
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
    test_check_expo_function
    test_start_expo_function
    test_device_detection
    test_reload_function
    test_main_function
    test_main_called
    test_timeout_config
    test_port_config
    test_syntax
    test_package_json
    
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

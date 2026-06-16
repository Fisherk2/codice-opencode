#!/bin/bash
#===============================================================================
# Códice — E2E Test Shared Library
#
# Provides common utilities for E2E test scripts:
#   - Temp directory management with automatic cleanup
#   - Binary resolution (compiled or fallback to bun run)
#   - Assertion helpers with colored output
#   - Mock server lifecycle management
#
# Usage:
#   source "$(dirname "$0")/common.sh"
#===============================================================================

set -Eeuo pipefail

# ---------------------------------------------------------------------------
# Colors for output
# ---------------------------------------------------------------------------

readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_RESET='\033[0m'

# ---------------------------------------------------------------------------
# Globals
# ---------------------------------------------------------------------------

# Root of the repository (assumes common.sh is at tests/e2e/common.sh)
readonly CODICE_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)"

# Platform-detected binary name (matches Justfile naming convention)
readonly CODICE_UNAME_S="$(uname -s | tr '[:upper:]' '[:lower:]')"
case "$CODICE_UNAME_S" in
    linux*)  CODICE_PLATFORM="linux" ;;
    darwin*) CODICE_PLATFORM="macos" ;;
    *)       CODICE_PLATFORM="windows.exe" ;;
esac
readonly CODICE_BINARY_NAME="codice-${CODICE_PLATFORM}"

# Path to the compiled binary (used by setup_binary)
CODICE_BINARY=""

# Track PIDs for mock server cleanup
_MOCK_SERVER_PID=""

# Track temp dirs for cleanup
_TEMP_DIRS=()

# ---------------------------------------------------------------------------
# Cleanup handler
# ---------------------------------------------------------------------------

_cleanup_all() {
    local exit_code=$?

    # Stop mock server if running
    stop_mock_server 2>/dev/null || true

    # Remove all tracked temp directories
    for tmpdir in "${_TEMP_DIRS[@]}"; do
        if [[ -d "$tmpdir" ]]; then
            rm -rf -- "$tmpdir" 2>/dev/null || true
        fi
    done

    exit "$exit_code"
}

trap _cleanup_all EXIT

# ---------------------------------------------------------------------------
# Logging helpers
# ---------------------------------------------------------------------------

log_info() {
    echo -e "${COLOR_CYAN}[INFO]${COLOR_RESET} $*" >&2
}

log_pass() {
    echo -e "${COLOR_GREEN}[PASS]${COLOR_RESET} $*" >&2
}

log_fail() {
    echo -e "${COLOR_RED}[FAIL]${COLOR_RESET} $*" >&2
}

log_warn() {
    echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $*" >&2
}

log_step() {
    echo "" >&2
    echo -e "${COLOR_CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}" >&2
    echo -e "${COLOR_CYAN}  $*${COLOR_RESET}" >&2
    echo -e "${COLOR_CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}" >&2
}

# ---------------------------------------------------------------------------
# Temp directory management
# ---------------------------------------------------------------------------

# Create a temporary directory for a test and register it for cleanup.
# Usage: mydir="$(create_temp_dir)"
create_temp_dir() {
    local tmpdir
    tmpdir="$(mktemp -d)" || {
        log_fail "Failed to create temporary directory"
        return 1
    }
    _TEMP_DIRS+=("$tmpdir")
    echo "$tmpdir"
}

# ---------------------------------------------------------------------------
# Binary setup
# ---------------------------------------------------------------------------

# Resolve the codice binary path.
# If CODICE_BINARY is already set, use it.
# Otherwise, check if the compiled binary exists in dist/.
# If it's on a no-exec filesystem (e.g., NTFS fuse), copy to /tmp first.
# If neither works, fall back to "bun run" for development.
# Returns the command string to invoke codice.
setup_binary() {
    if [[ -n "$CODICE_BINARY" ]]; then
        echo "$CODICE_BINARY"
        return 0
    fi

    local binary_path="$CODICE_ROOT/dist/$CODICE_BINARY_NAME"

    if [[ -f "$binary_path" ]]; then
        # Check if binary is executable; if not, it may be on a no-exec filesystem
        if [[ -x "$binary_path" ]]; then
            CODICE_BINARY="$binary_path"
            echo "$CODICE_BINARY"
            return 0
        fi

        # Try to copy to a temp location on a proper filesystem
        local tmp_binary
        tmp_binary="$(mktemp -p /tmp codice-XXXXXX)" || {
            log_warn "Could not create temp binary path. Using bun run fallback."
            echo "bun run $CODICE_ROOT/src/cli/main.ts"
            return 0
        }
        if cp "$binary_path" "$tmp_binary" && chmod +x "$tmp_binary"; then
            CODICE_BINARY="$tmp_binary"
            log_info "Copied binary to $tmp_binary (exec permissions on /tmp)"
            echo "$CODICE_BINARY"
            return 0
        fi
    fi

    local fallback_binary="$CODICE_ROOT/dist/codice"
    if [[ -f "$fallback_binary" ]]; then
        if [[ -x "$fallback_binary" ]]; then
            CODICE_BINARY="$fallback_binary"
            echo "$CODICE_BINARY"
            return 0
        fi
        # Also try to copy fallback
        local tmp_fallback
        tmp_fallback="$(mktemp -p /tmp codice-XXXXXX)" || true
        if [[ -n "${tmp_fallback:-}" ]] && cp "$fallback_binary" "$tmp_fallback" && chmod +x "$tmp_fallback"; then
            CODICE_BINARY="$tmp_fallback"
            log_info "Copied fallback binary to $tmp_fallback"
            echo "$CODICE_BINARY"
            return 0
        fi
    fi

    # Fall back to bun run for development
    log_warn "No compiled binary found at dist/$CODICE_BINARY_NAME. Using 'bun run src/cli/main.ts' as fallback."
    echo "bun run $CODICE_ROOT/src/cli/main.ts"
}

# ---------------------------------------------------------------------------
# Assertion helpers
# ---------------------------------------------------------------------------

# Assert that a file exists and is a regular file.
# Usage: assert_file_exists "/path/to/file"
assert_file_exists() {
    local path="$1"
    if [[ ! -f "$path" ]]; then
        log_fail "Expected file to exist: $path"
        return 1
    fi
    log_pass "File exists: $path"
}

# Assert that a file does NOT exist.
# Usage: assert_file_missing "/path/to/file"
assert_file_missing() {
    local path="$1"
    if [[ -f "$path" ]]; then
        log_fail "Expected file to be missing but it exists: $path"
        return 1
    fi
    log_pass "File is missing (expected): $path"
}

# Assert that a string contains a substring.
# Usage: assert_contains "$haystack" "$needle"
assert_contains() {
    local haystack="$1"
    local needle="$2"
    if [[ "$haystack" != *"$needle"* ]]; then
        log_fail "Expected string to contain: $needle"
        echo "    Actual: $haystack" >&2
        return 1
    fi
    log_pass "String contains: $needle"
}

# Assert that a directory exists.
# Usage: assert_dir_exists "/path/to/dir"
assert_dir_exists() {
    local path="$1"
    if [[ ! -d "$path" ]]; then
        log_fail "Expected directory to exist: $path"
        return 1
    fi
    log_pass "Directory exists: $path"
}

# Assert that two files have the same content.
# Usage: assert_file_equals "$expected" "$actual"
assert_file_equals() {
    local expected="$1"
    local actual="$2"
    if ! diff -q "$expected" "$actual" >/dev/null 2>&1; then
        log_fail "Files differ:"
        diff "$expected" "$actual" >&2 || true
        return 1
    fi
    log_pass "Files match: $(basename "$expected")"
}

# Run a command and assert its exit code equals the expected value.
# Usage: assert_exit_code 0 command arg1 arg2
assert_exit_code() {
    local expected_code="$1"
    shift
    local actual_code=0
    "$@" 2>/dev/null || actual_code=$?
    if [[ "$actual_code" -ne "$expected_code" ]]; then
        log_fail "Expected exit code $expected_code, got $actual_code"
        echo "    Command: $*" >&2
        return 1
    fi
    log_pass "Exit code $expected_code: $*"
}

# ---------------------------------------------------------------------------
# Mock server lifecycle
# ---------------------------------------------------------------------------

# Default mock server port
readonly MOCK_SERVER_PORT=4567

# Start the GitHub API mock server using Bun on MOCK_SERVER_PORT.
# Sets CODICE_GITHUB_API_URL environment variable for the test process.
# Usage: start_mock_server
start_mock_server() {
    local mock_script="$CODICE_ROOT/tests/e2e/mock-server.ts"

    if [[ ! -f "$mock_script" ]]; then
        log_fail "Mock server script not found: $mock_script"
        return 1
    fi

    export CODICE_GITHUB_API_URL="http://localhost:${MOCK_SERVER_PORT}"

    # Start in background
    bun run "$mock_script" "$MOCK_SERVER_PORT" &
    _MOCK_SERVER_PID=$!

    # Wait for server to be ready (poll with curl, max 5 seconds)
    local max_wait=25
    local waited=0
    while [[ "$waited" -lt "$max_wait" ]]; do
        if curl -sf "http://localhost:${MOCK_SERVER_PORT}" >/dev/null 2>&1; then
            log_info "Mock server started on port $MOCK_SERVER_PORT (PID $_MOCK_SERVER_PID)"
            return 0
        fi
        sleep 0.2
        waited=$((waited + 1))
    done

    log_fail "Mock server failed to start within $((max_wait * 2 / 10))s"
    return 1
}

# Stop the mock server.
# Usage: stop_mock_server
stop_mock_server() {
    if [[ -n "$_MOCK_SERVER_PID" ]]; then
        if kill -0 "$_MOCK_SERVER_PID" 2>/dev/null; then
            kill -TERM "$_MOCK_SERVER_PID" 2>/dev/null || true
            wait "$_MOCK_SERVER_PID" 2>/dev/null || true
            log_info "Mock server stopped (PID $_MOCK_SERVER_PID)"
        fi
        _MOCK_SERVER_PID=""
    fi
    unset CODICE_GITHUB_API_URL
    return 0
}

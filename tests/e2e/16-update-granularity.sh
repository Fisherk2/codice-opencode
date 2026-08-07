#!/bin/bash
#===============================================================================
# FEV4-T1: Update Granularity — Tree-Level Diff E2E
#
# Scenario: Pre-populate destination with SOME files in a standard directory
#           but NOT all files, plus a v2.0.0 .codice-version. Run --update.
#
# Scenario: the local installation matches the bundled template version
# (equal), so the bundled comparison reports "already up to date" and no
# merge happens:
#   - exit code 0
#   - docs/README.md + docs/ARCHITECTURE.md + specs/README.md PRESERVED
#   - opencode.json (mandatory) NOT overwritten (nothing merges)
#   - scripts/build.sh (opcional) PRESERVED
#   - NO new files created in docs/ (no merge → NEW_FILES_FOUND == 0)
#   - no security warnings in stderr
#   - stdout/stderr contains "already up to date"
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV4-T1: Update Granularity — Tree-Level Diff E2E"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# Pre-populate docs/ with SOME files (simulating an existing project)
# docs/ exists but is missing some template files
mkdir -p "$TEMP_DIR/docs"
# Create a custom file that should be PRESERVED
echo "# Custom Project Documentation" > "$TEMP_DIR/docs/README.md"
# Create another custom file — these should be preserved
echo "# Custom Architecture" > "$TEMP_DIR/docs/ARCHITECTURE.md"

# Pre-populate specs/ completely (simulating a fully populated dir)
mkdir -p "$TEMP_DIR/specs"
echo "# Custom Specs" > "$TEMP_DIR/specs/README.md"

# Pre-populate an obligatorio file with custom content (must NOT be overwritten)
echo '{"custom": true, "version": "0.9.0"}' > "$TEMP_DIR/opencode.json"

# Pre-populate an opcional file (should be preserved)
mkdir -p "$TEMP_DIR/scripts"
echo "# Custom Script — Preserved" > "$TEMP_DIR/scripts/build.sh"

# Write version file in the v2.0 format with a version EQUAL to the
# bundled template (2.0.0) so the bundled comparison reports "up to date".
echo '{"version":"2.0.0","installedPacks":["software-development"],"installedAt":"2026-01-01T00:00:00.000Z","optionalSelections":["scripts/build.sh"]}' > "$TEMP_DIR/.codice-version"

log_info "Pre-populated project with partial standard directory content"

# Start mock server for version check
start_mock_server
log_info "Mock GitHub API pointing to $CODICE_GITHUB_API_URL"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_CLI --update --force in $TEMP_DIR"
EXIT_CODE=0
STDERR_FILE="$TEMP_DIR/stderr.log"
STDOUT_FILE="$TEMP_DIR/stdout.log"
(cd "$TEMP_DIR" && CODICE_GITHUB_API_URL="http://localhost:4567" CODICE_BYPASS_URL_VALIDATION="true" NODE_ENV="test" $CODICE_CLI --update --force) >"$STDOUT_FILE" 2>"$STDERR_FILE" || EXIT_CODE=$?

# Stop mock server
stop_mock_server

if [[ "$EXIT_CODE" -ne 0 ]]; then
	log_fail "CLI exited with code $EXIT_CODE (expected 0)"
	exit 1
fi
log_pass "CLI exited with code 0"

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

# Combined output for message assertions (TUI messages emit on stdout via clack)
COMBINED_OUTPUT=$(cat "$STDOUT_FILE" "$STDERR_FILE" 2>/dev/null || echo "")

# 1. Existing standard files should be PRESERVED
log_info "Checking that existing files in standard dirs are PRESERVED..."

PRESERVED_DOCS_README=$(head -1 "$TEMP_DIR/docs/README.md" 2>/dev/null || echo "")
if [[ "$PRESERVED_DOCS_README" != "# Custom Project Documentation" ]]; then
	log_fail "docs/README.md was OVERWRITTEN! Expected existing standard file to be preserved."
	echo "    Actual first line: $PRESERVED_DOCS_README" >&2
	exit 1
fi
log_pass "docs/README.md preserved (existing file in standard dir)"

PRESERVED_DOCS_ARCH=$(head -1 "$TEMP_DIR/docs/ARCHITECTURE.md" 2>/dev/null || echo "")
if [[ "$PRESERVED_DOCS_ARCH" != "# Custom Architecture" ]]; then
	log_fail "docs/ARCHITECTURE.md was OVERWRITTEN! Expected existing standard file to be preserved."
	echo "    Actual first line: $PRESERVED_DOCS_ARCH" >&2
	exit 1
fi
log_pass "docs/ARCHITECTURE.md preserved (existing file in standard dir)"

# 2. NO new template files in docs/ should be created (no merge happened)
log_info "Checking that NO new template files were created in docs/ (no merge)..."

# These are all files in template/estandar/docs/ that were NOT pre-populated.
# With the bundled comparison reporting "already up to date", none may appear.
NEW_FILES_FOUND=0
for f in CODE_STYLE.md PRD.md SECURITY.md TECH_DEBT.md TRD.md WORKFLOW.md APPFLOW.md; do
	if [[ -f "$TEMP_DIR/docs/$f" ]]; then
		NEW_FILES_FOUND=$((NEW_FILES_FOUND + 1))
	fi
done
if [[ "$NEW_FILES_FOUND" -ne 0 ]]; then
	log_fail "$NEW_FILES_FOUND new files created in docs/ — expected NO merge (workspace already up to date)"
	exit 1
fi
log_pass "No new files created in docs/ (NEW_FILES_FOUND=0 — no merge happened)"

# 3. Obligatorio files should NOT be overwritten (no merge)
log_info "Checking that obligatorio file was NOT overwritten..."

PRESERVED_OPENCODE=$(head -1 "$TEMP_DIR/opencode.json" 2>/dev/null || echo "")
if [[ "$PRESERVED_OPENCODE" != '{"custom": true, "version": "0.9.0"}' ]]; then
	log_fail "opencode.json was modified! Expected it to stay untouched (no merge)."
	echo "    Actual first line: $PRESERVED_OPENCODE" >&2
	exit 1
fi
log_pass "opencode.json untouched (no merge — workspace already up to date)"

# 4. Opcional file should be PRESERVED
log_info "Checking that opcional file was PRESERVED..."

PRESERVED_SCRIPT=$(head -1 "$TEMP_DIR/scripts/build.sh" 2>/dev/null || echo "")
if [[ "$PRESERVED_SCRIPT" != "# Custom Script — Preserved" ]]; then
	log_fail "scripts/build.sh was modified! Expected opcional to be preserved."
	echo "    Actual first line: $PRESERVED_SCRIPT" >&2
	exit 1
fi
log_pass "scripts/build.sh preserved (opcional not updated)"

# 5. specs/ directory should still exist with original content
log_info "Checking that specs/ directory still has original content..."

PRESERVED_SPECS=$(head -1 "$TEMP_DIR/specs/README.md" 2>/dev/null || echo "")
if [[ "$PRESERVED_SPECS" != "# Custom Specs" ]]; then
	log_fail "specs/README.md was overwritten!"
	echo "    Actual first line: $PRESERVED_SPECS" >&2
	exit 1
fi
log_pass "specs/README.md preserved"

# 6. No security warnings in stderr
log_info "Checking stderr for security warnings..."
if [[ -f "$STDERR_FILE" ]]; then
	STDERR_CONTENT=$(cat "$STDERR_FILE" 2>/dev/null || echo "")
	if echo "$STDERR_CONTENT" | grep -qiE "traversal|escape|denied|EPERM"; then
		log_fail "Security warning detected in stderr: $STDERR_CONTENT"
		exit 1
	fi
fi
log_pass "No security warnings in stderr"

# 7. CLI reports the workspace is already up to date
log_info "Checking output for 'already up to date' message..."
assert_contains "$COMBINED_OUTPUT" "already up to date"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV4-T1: All assertions passed"

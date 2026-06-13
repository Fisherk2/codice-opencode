# Códice — Opencode Workspace Installer
# Justfile — Development task runner
# See SPEC.md §Commands for full documentation

# ─── Settings ────────────────────────────────────────────────────────────────

set positional-arguments := true
set shell := ["bash", "-uc"]

# Detect platform for build artifacts
arch := `uname -m`
platform := `uname -s | tr '[:upper:]' '[:lower:]'`
codice_binary := "codice-" + platform
codice_version := `bun --eval "const p = require('./package.json'); console.log(p.version)"`

# ─── Development Commands ────────────────────────────────────────────────────

# Bootstrap development environment
setup:
    @echo "🔧 Setting up development environment..."
    @command -v bun >/dev/null 2>&1 || { echo "❌ bun is required (>= 1.1.x). Install from https://bun.sh"; exit 1; }
    bun --version | awk -F. '{ if ($1 < 1 || ($1 == 1 && $2 < 1)) { print "❌ bun >= 1.1.x required, found " $0; exit 1 } }'
    bun install
    mkdir -p dist tests/fixtures
    @echo "✅ Setup complete"

# Run CLI in development mode with verbose logging
dev:
    bun run src/cli/main.ts --verbose

# Run static analysis (Biome check)
lint:
    bunx @biomejs/biome check src/ tests/

# Format source code with Biome
format:
    bunx @biomejs/biome format --write src/ tests/

# Full CI check: lint + format + import sorting (read-only)
format-check:
    bunx @biomejs/biome ci src/ tests/

# Pre-flight validation: lint + format-check + typecheck
check: lint format-check
    bun run tsc --noEmit

# ─── Testing Commands ────────────────────────────────────────────────────────

# Run full test suite (unit + integration)
test:
    bun test

# Run unit tests only
test-unit:
    bun test tests/unit/

# Run integration tests only
test-integration:
    bun test tests/integration/

# Run end-to-end tests (compiles binary first)
test-e2e:
    bun build --compile src/cli/main.ts --outfile ./dist/{{codice_binary}}
    bash tests/e2e/run-e2e.sh

# Run tests with coverage report
test-coverage:
    bun test --coverage

# ─── Build Commands ──────────────────────────────────────────────────────────

# Compile native binary for current platform
build:
    mkdir -p dist
    bun build --compile src/cli/main.ts --outfile ./dist/{{codice_binary}}
    @echo "✅ Binary built: dist/{{codice_binary}}"

# Trigger cross-platform compilation (CI workflow only)
build-all:
    @echo "ℹ️  Cross-platform builds run via GitHub Actions on release"
    @echo "   See .github/workflows/ci.yml for details"
    @echo "   To trigger: git tag vX.Y.Z && git push --tags"

# ─── Release Commands ────────────────────────────────────────────────────────

# Create GitHub Release with attached binaries
release:
    @echo "📦 Creating GitHub Release..."
    gh release create {{codice_version}} \
        --title "v{{codice_version}}" \
        --notes-file CHANGELOG.md \
        --generate-notes \
        dist/codice-linux dist/codice-macos dist/codice-windows.exe
    @echo "✅ Release v{{codice_version}} created"

# ─── Utility Commands ────────────────────────────────────────────────────────

# Show all available tasks (default)
default:
    @just --list

# Clean build artifacts
clean:
    rm -rf dist/*
    @echo "✅ Build artifacts cleaned"

# ─── Help ─────────────────────────────────────────────────────────────────────

help:
    @echo "Códice — Development Tasks"
    @echo ""
    @just --list
    @echo ""
    @echo "Quick Start:"
    @echo "  just setup   → Install dependencies and verify toolchain"
    @echo "  just dev     → Run CLI in development mode"
    @echo "  just check   → Pre-flight validation before commit"
    @echo "  just build   → Compile native binary"
    @echo ""
    @echo "See SPEC.md §Commands for full documentation"

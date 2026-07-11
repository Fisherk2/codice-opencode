# Códice — Just command runner

setup:
    bun install

dev:
    mkdir -p tests/fixtures/workspace
    bun run src/cli/main.ts --verbose --dest tests/fixtures/workspace

lint:
    bunx @biomejs/biome check src/ tests/

format:
    bunx @biomejs/biome format --write src/ tests/

format-check:
    bunx @biomejs/biome ci src/ tests/

check:
    bunx @biomejs/biome ci src/ tests/ && bun run tsc --noEmit

# Exclude template/obligatorio/skills/ and skills/ — external code with own test deps
IGNORE_PATTERNS := "--path-ignore-patterns=template/obligatorio/skills/**,skills/**"

test:
    bun test tests/ {{IGNORE_PATTERNS}}

test-unit:
    bun test tests/unit/ {{IGNORE_PATTERNS}}

test-integration:
    bun test tests/integration/ {{IGNORE_PATTERNS}}

test-coverage:
    bun test tests/ --coverage {{IGNORE_PATTERNS}}

# Build for current platform (auto-detects OS)
build:
    #!/usr/bin/env bash
    set -euo pipefail
    case "$(uname -s)" in
        Linux*)  binary="./dist/codice-linux" ;;
        Darwin*) binary="./dist/codice-macos" ;;
        *)       binary="./dist/codice-windows.exe" ;;
    esac
    echo "=== Building $binary ==="
    mkdir -p dist
    bun build --compile src/cli/main.ts --outfile "$binary"

# Cross-compile for all 3 platforms (requires Bun cross-compilation support)
build-all:
    #!/usr/bin/env bash
    set -euo pipefail
    failures=0
    mkdir -p dist
    echo "=== Building codice-linux (x64) ==="
    bun build --compile --target=bun-linux-x64 src/cli/main.ts --outfile ./dist/codice-linux \
        || { echo "FAILED: codice-linux" >&2; ((failures++)); }
    echo "=== Building codice-macos (x64) ==="
    bun build --compile --target=bun-darwin-x64 src/cli/main.ts --outfile ./dist/codice-macos \
        || { echo "FAILED: codice-macos" >&2; ((failures++)); }
    echo "=== Building codice-windows.exe (x64) ==="
    bun build --compile --target=bun-windows-x64 src/cli/main.ts --outfile ./dist/codice-windows.exe \
        || { echo "FAILED: codice-windows.exe" >&2; ((failures++)); }
    if [ "$failures" -gt 0 ]; then
        echo "FAILED: $failures build(s) failed" >&2
        exit 1
    fi
    echo "All builds succeeded"

test-watch:
    bun test tests/ --watch {{IGNORE_PATTERNS}}

test-packaging:
    bun test tests/integration/packaging/ {{IGNORE_PATTERNS}}

# Skip packaging tests when offline (no npm pack):
#   SKIP_NETWORK_TESTS=1 just test-packaging
test-packaging-skip:
    SKIP_NETWORK_TESTS=1 bun test tests/integration/packaging/ {{IGNORE_PATTERNS}}

test-e2e:
    just build && SKIP_BUILD=1 bash tests/e2e/run-e2e.sh

clean:
    rm -rf dist/*

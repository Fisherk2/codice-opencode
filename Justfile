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

test-watch:
    bun test tests/ --watch {{IGNORE_PATTERNS}}

test-packaging:
    bun test tests/integration/packaging/ {{IGNORE_PATTERNS}}

# Skip packaging tests when offline (no npm pack):
#   SKIP_NETWORK_TESTS=1 just test-packaging
test-packaging-skip:
    SKIP_NETWORK_TESTS=1 bun test tests/integration/packaging/ {{IGNORE_PATTERNS}}

test-e2e:
    bash tests/e2e/run-e2e.sh

clean:
    rm -rf dist

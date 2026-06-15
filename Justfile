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

test:
    bun test

test-unit:
    bun test tests/unit/

test-integration:
    bun test tests/integration/

test-coverage:
    bun test --coverage

build:
    bun build --compile src/cli/main.ts --outfile ./dist/codice-linux

test-e2e:
    bun build --compile src/cli/main.ts --outfile ./dist/codice-linux && bash tests/e2e/run-e2e.sh

clean:
    rm -rf dist/*

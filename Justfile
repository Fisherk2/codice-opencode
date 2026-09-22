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

# Exclude template/obligatorio/core/skills/ and skills/ — external code with own test deps
IGNORE_PATTERNS := "--path-ignore-patterns=template/obligatorio/core/skills/**,skills/**"

test:
    bun test tests/ {{IGNORE_PATTERNS}}

test-unit:
    bun test tests/unit/ {{IGNORE_PATTERNS}}

test-setup:
    bun test tests/setup/ {{IGNORE_PATTERNS}}

test-integration:
    bun test tests/integration/ {{IGNORE_PATTERNS}}

test-coverage:
    bun test tests/ --coverage {{IGNORE_PATTERNS}}

# Generate lcov coverage report and enforce minimum threshold (default: 95%)
# Usage: just coverage-check [threshold]
coverage-check threshold="95":
    bash scripts/coverage-check.sh {{threshold}}

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

# Remove legacy dist/ directory (binary compilation removed in v1.2.0; kept for cleanup of old artifacts)
clean:
    rm -rf dist

# ─── Performance Benchmarks ────────────────────────────────────────────────────

# Run installation performance benchmarks with hyperfine.
# Requires: cargo install hyperfine (or download from GitHub releases)
bench:
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p tests/fixtures/bench
    echo "Benchmarking Clean Install..."
    hyperfine \
        --warmup 1 \
        --runs 5 \
        --export-json tests/fixtures/bench/clean-install.json \
        --command-name "clean-install" \
        "bun run src/cli/main.ts --mode clean --dest tests/fixtures/bench/clean --force"
    echo "Benchmarking Project Install..."
    hyperfine \
        --warmup 1 \
        --runs 5 \
        --export-json tests/fixtures/bench/project-install.json \
        --command-name "project-install" \
        "bun run src/cli/main.ts --mode project --dest tests/fixtures/bench/project --force"
    echo "Benchmarking Update Workspace..."
    hyperfine \
        --warmup 1 \
        --runs 5 \
        --export-json tests/fixtures/bench/update-workspace.json \
        --command-name "update-workspace" \
        "bun run src/cli/main.ts --mode update --dest tests/fixtures/bench/update --force"

# ─── Release ───────────────────────────────────────────────────────────────────
# Tag-driven releases. Pushing a `v*` tag triggers .github/workflows/release.yml.
# Full checklist, dist-tag semantics and rollback runbook: docs/RELEASE.md.

# Create an annotated release tag after validating format, package.json alignment
# and local/remote uniqueness. Annotation only — never signed (gpg may be absent).
# Does NOT push; the next step is printed. See docs/RELEASE.md.
# Usage: just tag v2.1.3-beta.1
tag version:
    #!/usr/bin/env bash
    set -euo pipefail
    TAG="{{version}}"
    if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-beta\.[0-9]+|-rc\.[0-9]+)?$ ]]; then
        echo "ERROR: version must match vX.Y.Z, vX.Y.Z-beta.N or vX.Y.Z-rc.N (got: $TAG)" >&2
        exit 1
    fi
    PKG_VERSION="$(jq -r .version package.json)"
    if [ "${TAG#v}" != "$PKG_VERSION" ]; then
        echo "ERROR: tag version (${TAG#v}) does not match package.json version ($PKG_VERSION)" >&2
        exit 1
    fi
    if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
        echo "ERROR: tag $TAG already exists locally" >&2
        exit 1
    fi
    if ! REMOTE_TAG="$(git ls-remote --tags origin "refs/tags/$TAG" 2>/dev/null)"; then
        echo "ERROR: could not query origin for existing tags (network or remote unreachable). Aborting before creating $TAG." >&2
        exit 1
    fi
    if [ -n "$REMOTE_TAG" ]; then
        echo "ERROR: tag $TAG already exists on origin" >&2
        exit 1
    fi
    git tag -a "$TAG" -m "Códice $TAG"
    echo "✔ Created annotated tag $TAG"
    echo "Next step: just release $TAG   (runs gates, then pushes the tag → CI publish)"

# Run the local quality gates, then push the release tag. Pushing the tag triggers
# .github/workflows/release.yml (quality matrix → npm publish → GitHub Release).
# The tag must already exist locally — create it with `just tag <version>`.
# Set RELEASE_CONFIRM=yes to skip the interactive prompt (automation only).
# Usage: just release v2.1.3-beta.1
release version:
    #!/usr/bin/env bash
    set -euo pipefail
    TAG="{{version}}"
    if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-beta\.[0-9]+|-rc\.[0-9]+)?$ ]]; then
        echo "ERROR: invalid release tag: $TAG (expected vX.Y.Z[-beta.N|-rc.N])" >&2
        exit 1
    fi
    if ! git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
        echo "ERROR: tag $TAG does not exist locally. Create it first: just tag $TAG" >&2
        exit 1
    fi
    echo "▶ Gate 1/2: just check"
    just check
    echo "▶ Gate 2/2: just test"
    just test
    echo ""
    echo "⚠️  Pushing $TAG triggers .github/workflows/release.yml:"
    echo "    quality matrix → npm publish --provenance (--tag beta|rc|latest) → GitHub Release."
    if [ "${RELEASE_CONFIRM:-}" != "yes" ]; then
        read -r -p "Push tag $TAG to origin now? [y/N] " reply || reply=""
        if [[ ! "$reply" =~ ^[Yy]$ ]]; then
            echo "Aborted — tag not pushed."
            exit 1
        fi
    fi
    git push origin "$TAG"
    echo "✔ Pushed $TAG. Watch the run with: gh run watch   (see docs/RELEASE.md)"

# Verify a published release is live on npm and runnable. Retries 5×15s to ride
# out registry propagation lag after release.yml publishes.
# Usage: just verify-release 2.1.3-beta.1
verify-release version:
    #!/usr/bin/env bash
    set -euo pipefail
    PKG="@fisherk2-dev/codice"
    VERSION="{{version}}"
    VERSION="${VERSION#v}"
    for attempt in 1 2 3 4 5; do
        echo "Verify attempt $attempt/5: ${PKG}@${VERSION}"
        if npm view "${PKG}@${VERSION}" version && bunx "${PKG}@${VERSION}" --help >/dev/null; then
            echo "✔ ${PKG}@${VERSION} is published and the CLI runs."
            exit 0
        fi
        if [ "$attempt" -lt 5 ]; then
            echo "  not ready yet — retrying in 15s..." >&2
            sleep 15
        fi
    done
    echo "ERROR: ${PKG}@${VERSION} not verified after 5 attempts. Check the release workflow run." >&2
    exit 1

# Roll back a bad publish. Prints every step and asks for confirmation before each
# destructive command (never silent). npm unpublish is restricted >72h after publish —
# this recipe deprecates + moves the dist-tag back instead of unpublishing.
# Usage: just rollback v2.1.3-beta.1 2.1.2 beta
#   DRY_RUN=1 just rollback ...   — print the plan, execute nothing
rollback version prev_version dist_tag:
    #!/usr/bin/env bash
    set -euo pipefail
    PKG="@fisherk2-dev/codice"
    TAG="{{version}}"
    PREV_RAW="{{prev_version}}"
    DIST_TAG="{{dist_tag}}"
    PREV="${PREV_RAW#v}"
    if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-beta\.[0-9]+|-rc\.[0-9]+)?$ ]]; then
        echo "ERROR: bad tag: $TAG (expected vX.Y.Z[-beta.N|-rc.N])" >&2
        exit 1
    fi
    if [[ ! "$PREV" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-beta\.[0-9]+|-rc\.[0-9]+)?$ ]]; then
        echo "ERROR: bad previous version: $PREV_RAW" >&2
        exit 1
    fi
    case "$DIST_TAG" in
        latest|beta|rc) ;;
        *) echo "ERROR: dist_tag must be latest, beta or rc (got: $DIST_TAG)" >&2; exit 1 ;;
    esac
    if [ "${TAG#v}" = "$PREV" ]; then
        echo "ERROR: previous version equals the bad version ($PREV); nothing to roll back to." >&2
        exit 1
    fi
    echo "Rollback plan for a bad ${PKG} publish"
    echo "  bad version : ${PKG}@${TAG#v}"
    echo "  good version: ${PKG}@${PREV}"
    echo "  dist-tag    : ${DIST_TAG}"
    if [ "${DRY_RUN:-0}" = "1" ]; then
        echo "DRY_RUN=1 — printing the plan only; no command will run."
    fi
    echo ""
    run_step() {
        local description="$1"
        shift
        echo "▶ ${description}"
        echo "   \$ $*"
        if [ "${DRY_RUN:-0}" = "1" ]; then
            echo "   [dry-run] skipped"
            return 0
        fi
        read -r -p "   Execute this step? [y/N] " reply || reply=""
        if [[ ! "$reply" =~ ^[Yy]$ ]]; then
            echo "   Declined — aborting rollback. No further steps executed." >&2
            exit 1
        fi
        "$@"
    }
    run_step "1/4 Deprecate the bad version" \
        npm deprecate "${PKG}@${TAG#v}" "broken, use ${PREV}"
    run_step "2/4 Move the ${DIST_TAG} dist-tag back to ${PREV}" \
        npm dist-tag add "${PKG}@${PREV}" "${DIST_TAG}"
    run_step "3/4 Delete the GitHub release for ${TAG}" \
        gh release delete "$TAG" --yes
    run_step "4/4 Delete the remote tag ${TAG}" \
        git push --delete origin "$TAG"
    echo ""
    echo "✔ Rollback steps complete."
    echo "Note: never rely on npm unpublish (>72h restricted); deprecate + dist-tag is the"
    echo "      supported path. See docs/RELEASE.md for triggers, RTO and --cleanup-tag."

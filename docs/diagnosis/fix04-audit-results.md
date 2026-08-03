# Audit Results: Binary-Related Code (FEV-11)

**Date:** 2026-07-28
**Phase:** FEV-11, Task 1.1
**Issue:** [#46](https://github.com/fisherk2/codice-opencode/issues/46)
**Method:** Comprehensive grep search across codebase

---

## Summary

Comprehensive search for `bun build --compile`, `./codice`, `dist/codice`, `binary`, and `compile` references. Results organized by file category.

**Total locations to modify:** 36 files (excluding `node_modules/`, `.git/`, `~/.bun/`)

---

## 1. Build System & Recipes

| File | Line(s) | Reference | Action |
|------|---------|-----------|--------|
| `Justfile` | 42-44 | `binary="./dist/codice-{linux,macos,windows.exe}"` | Remove |
| `Justfile` | 46-48 | `echo "=== Building $binary ==="`, `bun build --compile src/cli/main.ts --outfile "$binary"` | Remove |
| `Justfile` | 50 | `# Cross-compile for all 3 platforms` | Remove |
| `Justfile` | 57-63 | `bun build --compile --target=bun-{linux,darwin,windows}-x64` (3 lines) | Remove |
| `Justfile` | (recipe defs) | `build`, `build-all`, `release` recipes | Remove recipes |

### Justfile Recipes to Remove:
- `build` — Compile native binary
- `build-all` — Cross-compile for all platforms
- `release` — Draft release (was for binary releases)

### Justfile Recipes to Update:
- `test-e2e` — Remove dependency on `build` recipe, use `bun run src/cli/main.ts` directly

---

## 2. E2E Test Infrastructure

### 2.1 `tests/e2e/run-e2e.sh`

| Line | Reference | Action |
|------|-----------|--------|
| 5 | `# Compiles the binary (if needed) and runs all E2E test scenarios.` | Update comment |
| 12 | `# SKIP_BUILD=1    — Skip binary compilation (use existing dist/ binary)` | Remove |
| 41 | `# Build binary` | Remove section |
| 50 | `echo -e "${CYAN}[BUILD]${RESET} Compiling binary for $PLATFORM..."` | Remove |
| 52 | `# Build the binary` | Remove |
| 54 | `if ! bun build --compile "$CODICE_ROOT/src/cli/main.ts"` | Remove |
| 55 | `echo -e "${RED}[BUILD]${RESET} Failed to compile binary!"` | Remove |
| 59 | `# Verify binary exists` | Remove |
| 65 | `echo -e "${GREEN}[BUILD]${RESET} Binary compiled: ...` | Remove |
| 67 | `echo -e "${YELLOW}[BUILD]${RESET} SKIP_BUILD=1 — using existing binary"` | Remove |

### 2.2 `tests/e2e/common.sh`

| Line | Reference | Action |
|------|-----------|--------|
| 7 | `#   - Binary resolution (compiled or fallback to bun run)` | Update |
| 34 | `# Platform-detected binary name (matches Justfile naming convention)` | Remove |
| 43 | `# Path to the compiled binary (used by setup_binary)` | Remove |
| 121 | `# Resolve the codice binary path.` | Simplify function |
| 123 | `# Otherwise, check if the compiled binary exists in dist/.` | Remove |
| 127 | `setup_binary() {` | Simplify or replace |
| 133-177 | Entire binary resolution logic (fallback detection, temp copy, exec check) | Replace with `bun run src/cli/main.ts` |

### 2.3 E2E Test Scripts (15 files)

All 15 E2E scripts in `tests/e2e/` use `CODICE_BINARY="$(setup_binary)"` and `log_info "Using binary: $CODICE_BINARY"`. These must be replaced with `CODICE_BINARY="bun run $CODICE_ROOT/src/cli/main.ts"`.

Files: `01-clean-install.sh` through `15-update-workspace-existing-project.sh`

---

## 3. CI/CD Workflows

### 3.1 `.github/workflows/ci.yml`

| Lines | Step | Action |
|-------|------|--------|
| 60 | `Build binary` | Remove |
| 68 | `Smoke test binary (macOS)` | Remove |
| 72-73 | `./dist/codice-macos --version`, `./dist/codice-macos --help` | Remove |
| 75 | `Smoke test binary (Windows)` | Remove |
| 79-80 | `./dist/codice-windows.exe --version`, `./dist/codice-windows.exe --help` | Remove |
| 82 | `Set artifact binary name` | Remove |
| 92 | `Upload binary artifact` | Remove |

### 3.2 `.github/workflows/release.yml`

| Lines | Step | Action |
|-------|------|--------|
| 44 | `Build binary` | Remove |
| 57 | `Upload binary artifact` | Remove |
| 75 | `Download all binary artifacts` | Remove |
| 83 | sha256sum check | Remove |

---

## 4. Source Code Comments

The following files contain comments referencing "binary" or "compiled" mode but contain **no actual compilation logic**. Comments serve as architectural documentation:

| File | Lines | Reference | Action |
|------|-------|-----------|--------|
| `src/application/use-cases/UpdateWorkspaceUseCase.ts` | 42, 171 | `bundled in this binary`, `compile-time constant` | Update comments |
| `src/cli/output.ts` | 12, 14 | `Compiled-in binary version`, `compiled binary mode` | Update comments |
| `src/cli/version.ts` | 2, 5 | `Compiled-in binary version`, `compiled binary mode` | Update comments |
| `src/infrastructure/adapters/GitHubRestClient.ts` | 2 | `bundle-friendly (Bun includes package.json at compile time)` | Update comment |
| `src/infrastructure/adapters/TemplateResolver.ts` | 39-73 | Compiled mode path resolution, `process.argv[0]` binary path | Update — compiled mode is no longer relevant |
| `src/infrastructure/adapters/TemplateResolver.ts` | 133 | `fs.access() cannot read embedded files in compiled` | Update comment |

---

## 5. Configuration Files

| File | Line | Reference | Action |
|------|------|-----------|--------|
| `package.json` | 27 | `"build": "bun build --compile src/cli/main.ts --outfile ./dist/codice-linux"` | Remove |
| `package.json` | 36 | `"clean": "rm -rf dist/*"` | Update (remove dist/) |

---

## 6. Documentation Files

### 6.1 README.md

| Lines | Reference | Action |
|-------|-----------|--------|
| 185 | `If you don't have Bun installed or prefer a standalone binary...` | Remove section |
| 190 | `# Download the latest binary for your platform:` | Remove |
| 198 | `./codice` | Remove |
| 204 | `# Download the latest binary:` | Remove |
| 222 | `via compiled binary (standalone)` | Remove |
| 224 | `./codice` | Remove |
| 228 | `./codice --force` | Remove |
| 229 | `./codice --version` | Remove |
| 240 | `Print binary version and exit` | Update |
| 294 | `Permission denied (binary)` | Remove |
| 295 | `Binary not found after install` | Remove |

### 6.2 CONTRIBUTING.md

| Lines | Reference | Action |
|-------|-----------|--------|
| 54 | `just test:e2e       # Compiled binary against isolated directories` | Update |
| 61 | `E2E tests: Compiled binary` | Update |
| 202 | `release.yml (tag → build → npm publish)` | Update |

### 6.3 SPEC.md

| Lines | Reference | Action |
|-------|-----------|--------|
| 21 | `single binary, zero external dependencies` | Update |
| 37 | `Native binary compilation` | Update |
| 47 | `The compiled binary must run on Linux/macOS/Windows` | Remove |
| 74 | `Compile binary` | Update |
| 81 | `Compile native binary` | Remove |
| 90 | `Print current binary version` | Update |
| 161 | `fixtures for binary validation` | Update |
| 167 | `Compiled binaries (gitignored, populated by CI)` | Remove |
| 302-308 | E2E binary compilation | Update |
| 312-322 | Binary-related scenarios | Update |
| 406 | SC-15: `Compiled binaries are produced for ...` | Remove |
| 407 | SC-16: update description | Update |
| 437 | `Embed template files into the binary` | Update |

### 6.4 TECH_DEBT.md

| Line | Reference | Action |
|------|-----------|--------|
| 143 | Section 7.1: `Binary Size Reduction — RESOLVED in v1.2.0` | Already marked resolved |

### 6.5 Wiki Pages

| File | Line | Reference | Action |
|------|------|-----------|--------|
| `docs/wiki-source/Getting-Started.md` | 12 | `Códice does not require Bun, Node.js, or any runtime` | Update |
| `docs/wiki-source/Troubleshooting.md` | 282 | `How you ran the installer (bunx, npx, or binary)` | Update |

### 6.6 ADR Documents

| File | Lines | Reference | Action |
|------|-------|-----------|--------|
| `specs/adr/adr-002-bun-compilation.md` | 7, 12 | `single binary with zero runtime`, `bun build --compile` | Update (binary is now alternative) |
| `specs/adr/adr-006-npm-publication.md` | 27, 34, 56-58, 68 | Various binary references | Update (binary removed) |

---

## 7. Test Files

### 7.1 Unit/Integration Tests

| File | Reference | Action |
|------|-----------|--------|
| `tests/integration/TemplateResolver.test.ts` | May test compiled mode resolution | Verify and update if needed |
| `tests/unit/adapters/template-resolver.test.ts` | May test compiled mode resolution | Verify and update if needed |

### 7.2 Packaging Tests

| File | Reference | Action |
|------|-----------|--------|
| `tests/integration/packaging/npm-pack.test.ts` | Tests npm package structure | Verify — should still pass |

---

## 8. Files Requiring No Changes (Verified)

The following files matched grep patterns but contain only architectural documentation, approved content, or false positives:

| File | Reason |
|------|--------|
| `docs/WORKFLOW.md` | Planning doc, will be updated in documentation phase |
| `tasks/plan.md`, `tasks/todo.md` | Task tracking — will be updated as completed |
| `docs/diagnosis/fix04-v1.2-phase1-binary-removal.md` | Diagnosis document — intentionally references binary |
| Template files in `template/`, `tests/fixtures/` | Template content, not project logic |
| Agent files in `agents/` | Agent definitions using "compile" in different context |
| Skill files in `skills/` | Skills using "build", "binary", "compile" in generic context |

---

## 9. Change Inventory by File

| # | File | Action | Effort |
|---|------|--------|--------|
| 1 | `Justfile` | Remove build/build-all/release recipes, update test-e2e | S |
| 2 | `tests/e2e/run-e2e.sh` | Remove binary compilation section | S |
| 3 | `tests/e2e/common.sh` | Replace setup_binary with bun run | M |
| 4 | `tests/e2e/*.sh` (15 files) | Replace CODICE_BINARY=setup_binary with bun run | M |
| 5 | `.github/workflows/ci.yml` | Remove binary build/smoke test steps | S |
| 6 | `.github/workflows/release.yml` | Remove binary build/upload/download steps | M |
| 7 | `package.json` | Remove scripts.build, scripts.build:all, update clean | XS |
| 8 | `README.md` | Remove binary install section | S |
| 9 | `CONTRIBUTING.md` | Remove binary build instructions | S |
| 10 | `SPEC.md` | Remove SC-15, update SC-16, update runtime constraints | S |
| 11 | `docs/TECH_DEBT.md` | Section 7.1 already marked RESOLVED | XS |
| 12 | `docs/wiki-source/Getting-Started.md` | Remove binary mention | XS |
| 13 | `docs/wiki-source/Troubleshooting.md` | Remove binary mention | XS |
| 14 | `CHANGELOG.md` | Add v1.2.0 entry | XS |
| 15 | `src/infrastructure/adapters/TemplateResolver.ts` | Update compiled mode comments | S |
| 16 | `src/cli/version.ts` | Update compile-time comments | XS |
| 17 | `src/cli/output.ts` | Update compile-time comments | XS |
| 18 | `src/application/use-cases/UpdateWorkspaceUseCase.ts` | Update binary comments | XS |
| 19 | `src/infrastructure/adapters/GitHubRestClient.ts` | Update compile-time comments | XS |
| 20 | `specs/adr/adr-002-bun-compilation.md` | Update binary references | S |
| 21 | `specs/adr/adr-006-npm-publication.md` | Update binary references | S |
| 22 | `specs/adr/adr-011-binary-removal.md` | New ADR | S |
| 23 | `docs/ARCHITECTURE.md` | Add ADR-011 to table | XS |

---

## Verification Commands

```bash
# After all changes:
grep -rn "bun build --compile" src/ tests/ docs/ --include="*.ts" --include="*.sh" --include="*.md" 2>/dev/null
# Expected: 0 results

grep -rn "\./codice\|dist/codice" src/ tests/ docs/ --include="*.ts" --include="*.sh" --include="*.md" 2>/dev/null
# Expected: 0 results (except archived docs/diagnosis)

grep -rn "bun build --compile\|\./codice\|dist/codice" Justfile .github/workflows/ package.json
# Expected: 0 results

bun run tsc --noEmit
# Expected: passes

bun test
# Expected: ≥585 pass, 0 fail
```

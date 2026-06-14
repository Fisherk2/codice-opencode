# Plan: F1 – Infrastructure (Adapters)

## Overview

Implement the three concrete infrastructure adapters that bridge the application ports to Bun's runtime APIs. This phase does **not** add domain logic — it only makes the stubs functional. The adapters are independent of each other and can be developed in parallel after the template directory setup.

**Goal:** Three production-ready adapters + their integration tests, all passing.

---

## Architecture Decisions

| # | Decision | Rationale |
|---|----------|------------|
| F1-A1 | BunFileSystem reads template files via `Bun.file()` at runtime | Template embedded at compile time per SPEC.md Decision #1, but read via Bun runtime API |
| F1-A2 | Constructor injection for destination/template/staging roots | Allows the CLI to specify where to install; keeps adapters stateless |
| F1-A3 | Path normalization to forward slashes internally | Per SPEC.md Decision #4 — simplifies Path Traversal prevention |
| F1-A4 | AbortController for GitHub API timeout (3s) | Precise timeout control, no setTimeout leakage |
| F1-A5 | ClackPromptsAdapter uses singleton-free design | Each method is stateless; instance created per CLI invocation |

---

## Dependency Graph

```
F1-T0: Setup template dir (organize flat template → subdirs)
         │
         └──▶ F1-T1: BunFileSystem  (reads from template/)
         └──▶ F1-T2: GitHubRestClient (no template dep — parallel with T1)
         └──▶ F1-T3: ClackPromptsAdapter (no template dep — parallel with T1)
                   │
                   └──▶ F1-T4: Integration tests (tests all 3)
```

T1.0 must complete before T1.1 (BunFileSystem reads from the organized template dir). T1.2, T1.3 can start in parallel with T1.0. T1.4 (tests) runs after all three adapters.

---

## Task List

### Phase 1: Template Setup

#### Task F1-T0: Setup template directory structure

**Description:** Reorganize the flat `template/` directory into the three-category subdirectory structure defined in `spec-file-rules.md`. Create `obligatorio/`, `estandar/`, and `opcional/` subdirectories and move existing files accordingly.

**Acceptance criteria:**
- [ ] `template/obligatorio/` contains: `opencode.json`, `skills-lock.json`, `agents/`, `commands/`, `.opencode/`, `skills/`, `references/`
- [ ] `template/estandar/` contains: `AGENTS.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `LICENSE`, `README.md`, `SPEC.md`, `.env.example`, `scripts/`, `tasks/`, `docs/` (with exceptions), `specs/` (with exceptions)
- [ ] `template/opcional/` contains: `Justfile`, `Makefile`, `requirements.txt`, `docs/DESIGN.md`, `docs/SCHEMA.md`, `docs/opencode/`, `specs/design/`, `.opencode/plugins/sdd-workflow-test.md`
- [ ] `docs/DESIGN.md`, `docs/SCHEMA.md`, `docs/opencode/` moved to opcional/
- [ ] `specs/design/` moved to opcional/
- [ ] `.opencode/plugins/sdd-workflow-test.md` moved to opcional/
- [ ] No files remain at the root of `template/` (except the 3 category dirs themselves)
- [ ] `bun test` still passes (74 existing F0 tests unaffected)

**Verification:**
- [ ] `ls template/` shows only `obligatorio/`, `estandar/`, `opcional/`
- [ ] `find template/obligatorio/` lists all mandatory files and dirs
- [ ] `find template/estandar/` lists all standard files and dirs
- [ ] `find template/opcional/` lists all optional files and dirs
- [ ] `bun test` → 74/74 pass (unchanged)

**Dependencies:** None (F0 complete)

**Files touched:**
- `template/` directory reorganization

**Estimated scope:** S

---

### Phase 2: Adapter Implementation

#### Task F1-T1: BunFileSystem adapter

**Description:** Implement all 11 methods of `IFileSystem` using Bun's native APIs. Key design: atomic staging pattern — `stageFile()` copies from template to staging dir; `commitStaging()` renames all staged files to destination atomically; `cleanStaging()` removes staging on rollback. Path traversal prevention via `path.resolve()` + boundary check.

**Acceptance criteria:**
- [ ] `readTemplateFile(relativePath)` reads from `template/` using `Bun.file().text()`
- [ ] `destinationExists(relativePath)` checks destination with `Bun.file().exists()`
- [ ] `getStagingPath(relativePath)` returns `path.join(stagingDir, relativePath)`
- [ ] `stageFile(relativePath)` reads from template, writes to staging (creates intermediate dirs)
- [ ] `commitStaging()` renames staging files to destination; fails gracefully if rename fails
- [ ] `cleanStaging()` removes the entire staging directory recursively
- [ ] `isWritable()` checks destination directory write permission
- [ ] `isEmpty()` returns `true` if destination has no files (except .git/ and .codice-version)
- [ ] `writeVersionFile(versionData)` writes `.codice-version` to destination root atomically
- [ ] `readVersionFile()` reads `.codice-version` from destination root (null if missing)
- [ ] Path traversal attempt (`../` outside destination) returns `false`/`null`/`throws` — never writes outside boundary

**Verification:**
- [ ] `bun test` for new integration tests passes
- [ ] `just lint` passes with zero warnings on `BunFileSystem.ts`
- [ ] All 11 methods return correct types (no `any`)
- [ ] Staging directory does not exist after `cleanStaging()` is called

**Dependencies:** F1-T0 (template directory must exist and be organized)

**Files touched:**
- `src/infrastructure/adapters/BunFileSystem.ts`

**Estimated scope:** M

---

#### Task F1-T2: GitHubRestClient adapter

**Description:** Implement `IGitHubClient` using `fetch` with `AbortController` for timeout. Maps HTTP errors to domain-appropriate return values: 404 → `null` (no release), 403 → `null` (rate limited), network failure → `null` with logged error, timeout → `null`.

**Acceptance criteria:**
- [ ] `getLatestReleaseTag()` fetches `GITHUB_API_LATEST_RELEASE`, parses `tag_name` from JSON
- [ ] `getLatestReleaseNotes()` fetches same URL, parses `body` from JSON
- [ ] Timeout is exactly `GITHUB_API_TIMEOUT_MS` (3000ms) via `AbortController.timeout`
- [ ] HTTP 404 → returns `null` (no error thrown)
- [ ] HTTP 403 → returns `null` (rate limited, no error thrown)
- [ ] Network unreachable → returns `null` (no error thrown)
- [ ] Successful response with malformed JSON → returns `null`
- [ ] All error paths log actionable message to stderr (in verbose mode)

**Verification:**
- [ ] `bun test` integration tests pass (using mocked `fetch`)
- [ ] Timeout behavior verified: response after 4s returns `null`
- [ ] `just lint` passes with zero warnings

**Dependencies:** None (F1-T0, F1-T1, F1-T2 can proceed in parallel — no shared files)

**Files touched:**
- `src/infrastructure/adapters/GitHubRestClient.ts`

**Estimated scope:** S

---

#### Task F1-T3: ClackPromptsAdapter

**Description:** Implement all 11 methods of `IUserPrompt` using real `@clack/prompts`. Wire `note()` for warning/info, `confirm()` for yes/no, `multiselect()` for optional file selection (with grouping when >10 items), `spinner` for async ops, `intro()`/`outro()`/`cancel()` for flow messages.

**Acceptance criteria:**
- [ ] `showWarning(message)` displays warning via `@clack/prompts.note()` with appropriate styling
- [ ] `showInfo(message)` displays info via `@clack/prompts.note()`
- [ ] `confirm(message, defaultYes)` returns `true`/`false` from `@clack/prompts.confirm()`
- [ ] `selectOptional(options)` shows grouped multiselect; groups by first path segment when count > 10
- [ ] `showSpinner(message)` / `stopSpinner()` start/stop spinner with message
- [ ] `showIntro(title)` displays title banner
- [ ] `showSuccess(message)` displays success message
- [ ] `showCancel(message)` / `showError(message)` display cancellation/error messages
- [ ] All prompts are non-blocking for display methods (sync `void` return)

**Verification:**
- [ ] `bun test` integration tests pass (mocked `@clack/prompts` module)
- [ ] `just lint` passes with zero warnings
- [ ] Adapter can be instantiated without errors

**Dependencies:** None (F1-T0, F1-T1, F1-T3 can proceed in parallel)

**Files touched:**
- `src/infrastructure/adapters/ClackPromptsAdapter.ts`

**Estimated scope:** S

---

### Phase 3: Testing

#### Task F1-T4: Integration tests for all adapters

**Description:** Write integration tests for the three adapters using `bun:test` with real temporary directories and mocked external dependencies.

**BunFileSystem tests:**
- Create real temp directory as destination, real `template/` for reads
- Test `stageFile()` creates staging file
- Test `commitStaging()` promotes to destination
- Test `cleanStaging()` removes staging
- Test `destinationExists()` returns correct booleans
- Test `isEmpty()` / `isWritable()` behavior
- Test version file write/read cycle
- Test path traversal rejection (attempts to write outside destination → error/null)

**GitHubRestClient tests:**
- Mock `fetch` to return predefined JSON (success, 404, 403, timeout)
- Test timeout returns `null`
- Test 404 returns `null`
- Test 403 returns `null`
- Test successful tag extraction

**ClackPromptsAdapter tests:**
- Mock `@clack/prompts` module to capture call arguments
- Verify `confirm()` calls `confirm()` with correct message
- Verify `selectOptional()` calls `multiselect()` with correct options
- Verify grouped output when >10 items

**Acceptance criteria:**
- [ ] BunFileSystem: ≥8 tests, all pass
- [ ] GitHubRestClient: ≥6 tests, all pass (mocked fetch, no real network)
- [ ] ClackPromptsAdapter: ≥6 tests, all pass (mocked @clack/prompts)
- [ ] All tests use `bun test` (not shell scripts)
- [ ] Total F1 test coverage >70% of infrastructure adapters
- [ ] Existing 74 F0 tests still pass (no regression)

**Verification:**
- [ ] `bun test` → all pass
- [ ] `bun test --coverage` → adapter coverage >70%

**Dependencies:** F1-T1, F1-T2, F1-T3 (all adapters must exist before testing)

**Files touched:**
- `tests/integration/adapters/bun-file-system.test.ts`
- `tests/integration/adapters/github-rest-client.test.ts`
- `tests/integration/adapters/clack-prompts-adapter.test.ts`

**Estimated scope:** M

---

### Checkpoint: After F1-T0 through F1-T4

| Checkpoint Item | Status |
|-----------------|--------|
| Template directory organized into 3 subdirs | ✅ Done |
| BunFileSystem: all 11 IFileSystem methods implemented | ✅ Done |
| GitHubRestClient: 2 methods with timeout + error mapping | ✅ Done |
| ClackPromptsAdapter: all 11 IUserPrompt methods with real @clack/prompts | ✅ Done |
| BunFileSystem integration tests: ≥8 tests pass (25 tests) | ✅ Done |
| GitHubRestClient integration tests: ≥6 tests pass (11 tests) | ✅ Done |
| ClackPromptsAdapter integration tests: ≥6 tests pass (15 tests) | ✅ Done |
| `just lint` passes on all F1 files (4 expected noConsole warnings in main.ts) | ✅ Done |
| `bun test` (74 F0 + 51 F1 = 125): all pass | ✅ Done |
| Adapter test coverage >70% (100% lines on all adapters) | ✅ Done |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Template files moved incorrectly during T1.0 | High | T1.0 is file moves only; verify with `find` commands before proceeding |
| Bun.file() on non-existent path throws | Medium | Wrap in try/catch, return `null`/`throw actionable error` |
| GitHub API rate limit hits during testing | Low | Tests mock fetch; real API only used in E2E |
| @clack/prompts spinner state management | Low | Use module-level spinner instance, clear on stop |
| Path traversal edge cases on Windows | Medium | Test with `..\` and `../` paths; normalize to forward slashes |

---

## Open Questions — Resolved

| # | Question | Resolution |
|---|----------|------------|
| F1-O1 | How does BunFileSystem locate the template directory in production (embedded in binary vs. side-by-side)? | **Deferred to F3** — for now, use `path.join(process.cwd(), "template")` in dev; compilation strategy handled when binary build is configured |
| F1-O2 | Should staging directory be inside destination or outside? | **Inside destination** — simpler path handling; cleaned up on success or SIGINT |

---

## Phase Summary

| Task | Description | Duration |
|------|-------------|----------|
| F1-T0 | Setup template directory structure | ~15 min |
| F1-T1 | BunFileSystem adapter (11 methods) | ~2 hrs |
| F1-T2 | GitHubRestClient adapter (2 methods) | ~1 hr |
| F1-T3 | ClackPromptsAdapter (11 methods) | ~1 hr |
| F1-T4 | Integration tests for all 3 adapters | ~2 hrs |
| **Total F1** | **5 tasks** | **~1 day** |

---

*Last updated: 2026-06-14*
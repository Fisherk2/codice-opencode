# ADR-022: SDD Plugin Removal and Offline Legacy Deprecation Banner

* **Status:** Accepted
* **Date:** 2026-09-22
* **Decision Makers:** Fisherk2
* **Consulted:** Mictlantecuhtli / Tezcatlipoca (5-eje adversarial review, FEV-30), Security audit (post-removal permission hardening)
* **Informed:** Users on legacy installs ≤ 2.1.2 (runtime banner), Wiki/doc sync owners
* **Traceability:** FEV-30 (#90) | `CHANGELOG.md` [2.1.3] Added/Removed/Security | `docs/WORKFLOW.md` §1 (FEV-29/30 rows, lines 24–25), §3 (FEV-30 delivery + stable go-ahead, lines 244–249) | Diagnosis: `docs/diagnosis/fix27-sdd-plugin-removal-v2-incompatibility.md` | Supersedes the retired ADR-013 and ADR-017 as the register entry for plugin-era enforcement

## 1. Context and Problem Statement

From v2.0.0 through v2.1.2 the SDD plugin (`sdd-pipeline.ts` + modules `destructivePatterns.ts` and `normalizeBash.ts`, bilingual intent discovery) was the workspace's runtime enforcement layer — the subject of ADR-013 (plugin auto-discovery) and ADR-017 (intent auto-discovery). OpenCode V2 introduced native `permissions:` rule lists, and FEV-29 (#91) migrated all 349 template agent files to them, making the plugin's job redundant. Worse, the plugin "failed at every startup on Opencode V2 hosts" (`CHANGELOG.md` [2.1.3] Removed), so it was simultaneously dead weight and a broken shim. The installer had to decide: keep enforcing through a plugin, or cut it — and if cut, how legacy users (≤ 2.1.2, still on the Opencode Legacy runtime) get warned without reintroducing network coupling.

## 2. Decision Drivers

* **Single enforcement surface** — destructive-command blocking must live in exactly one place; after FEV-29 that place is `permissions:` (`permission.bash` deny-lists in `template/obligatorio/core/opencode.json`).
* **No broken code shipped** — a plugin that crashes at startup on V2 hosts cannot be "kept but ignored"; its presence is a support liability.
* **Offline deprecation detection** — legacy detection must not add a network round-trip to installer startup; `.codice-version` is already the local install fingerprint (parsed by `src/domain/entities/WorkspaceVersion.ts`).
* **Coverage-gate hygiene** — dead `tools:`/plugin paths left in `src` fail the fail-closed gate (`just coverage-check`, thresholds in `scripts/coverage-thresholds.json`; AGENTS.md flags "dead code as the legacy `tools:` path in FEV-29").
* **Reversibility** — removal is recoverable from git history if V2 `permissions:` ever proves insufficient.

## 3. Considered Options

* **Option A:** Port `sdd-pipeline.ts` to the OpenCode V2 plugin API and keep dual enforcement (plugin + `permissions:`).
* **Option B:** Remove the plugin entirely; enforcement moves 100% to template `permissions:`; legacy detection becomes an offline startup banner keyed on `.codice-version`.
* **Option C:** Keep the plugin shipped but inert (feature-flag off) as an escape hatch.

## 4. Decision Outcome

**Chosen option:** Option B — full removal in v2.1.3 (FEV-30, #90), with offline deprecation notice replacing runtime enforcement.

### (a) Enforcement moves entirely to `permissions:`

Deleted from the template: `sdd-pipeline.ts`, `plugins/src/destructivePatterns.ts`, `plugins/src/normalizeBash.ts`, the dev copy, plugin test suites, the `sdd-workflow-test` fixture, `*-plugin` recipes and the `qa-plugin` CI job (`CHANGELOG.md` [2.1.3] Removed). The plugin's only residual function — blocking destructive commands — already lived in the `permission.bash` deny-lists of `template/obligatorio/core/opencode.json`, kept as defense in depth. Because static deny-lists do not replicate the plugin's exec normalization, a security audit followed the removal and moved bypassable commands (`find`, `echo`, `printf`, `awk`, `sed`, `xargs`, `curl`) from `allow` to `ask`, added depth-defense denies, and closed `read` gaps (`CHANGELOG.md` [2.1.3] Security). The regression is pinned in `tests/setup/opencode-config.test.ts`.

### (b) Offline legacy detection via the deprecation banner

`src/application/legacyBanner.ts:15` defines `LEGACY_MAX_VERSION = "2.1.2"` ("Last Códice version shipped on the retired Opencode Legacy runtime"). The predicate `isLegacyVersion()` compares the locally read version against the threshold and **fails open** (invalid version → no warning). `src/infrastructure/adapters/versionInfoMessages.ts` renders the banner for `v2.0+` installs:

> `⚠ Opencode Legacy only — upgrade to ≥ 2.1.3 for native Opencode V2 support`

`src/cli/main.ts` calls `showVersionInfo(...)` **before** `resolveInteractiveMode(...)`, so the warning is visible before the user commits to a mode ("warn here, before the mode menu" — `versionInfoMessages.ts`). The banner is a single source (`isLegacyVersion`/`LEGACY_BANNER_MESSAGE` consumed by the detection header; the update flow does not repeat it), and a missing or corrupt `.codice-version` degrades to a silent no-op — detection is purely offline, no registry call.

### (c) Plugin-remnant notification on update

Updating from an install `< 2.1.3` leaves the retired plugin files on disk as unmanaged remnants. `UpdateWorkspaceUseCase.ts` (guarded by `isLegacyVersion(localVersion.version)`) prints `buildPluginRemnantMessage()` from `src/application/use-cases/updateHelpers.ts`, listing the exact surviving paths (`.opencode/plugins/sdd-pipeline.ts`, `.opencode/plugins/src/destructivePatterns.ts`, `.opencode/plugins/src/normalizeBash.ts`, `.opencode/plugins/README.md`, `.opencode/plugins/tsconfig.json`) and warning: "Do NOT delete the plugins/ directory itself — it may contain third-party plugins."

## 5. Pros and Cons of the Options

### Option A — Port to V2 plugin API

* ✅ **Pros:** preserved normalized-command blocking during transition.
* ⚠️ **Cons:** dual enforcement surfaces (plugin rules vs. `permissions:` lists) with divergent precedence; maintenance of a shim whose function V2 already covers; the startup failures suggest upstream API drift the team would keep chasing.
* **Rejected.** Redundant after FEV-29; violates the single-surface driver.

### Option B — Remove + offline banner (chosen)

* ✅ **Pros:** one normative enforcement surface (`permissions:` + validator per ADR-021); zero startup overhead on V2; deprecation notice needs no network; dead code gone, so the coverage gate stays green.
* ⚠️ **Cons:** loses exec-normalization blocking — required a compensating permission-hardening round (shipped in [2.1.3] Security).
* **Accepted** with the hardening mitigation in place.

### Option C — Ship but disable

* ✅ **Pros:** cheapest apparent rollback.
* ⚠️ **Cons:** dead code in the shipped template; a crashing plugin on Legacy hosts is user-visible; the coverage gate detects unreachable paths as dead code.
* **Rejected.** Carrying broken code "just in case" is debt, not insurance.

## 6. Consequences

* ✅ Enforcement is 100% declarative `permissions:` in the template; no imperative plugin logic between the user and the permission engine.
* ✅ Legacy installs (2.0.x–2.1.2) keep working but see the upgrade nudge toward ≥ 2.1.3 on every installer run, before the mode menu; non-blocking by design.
* ⚠ ADR-013 and ADR-017 became obsolete with this decision and **were deleted from the repo in commit `51d4a55`** (`release: v2.1.3-beta.1` #92; files `specs/adr/adr-013-plugin-auto-discovery.md`, `specs/adr/adr-017-sdd-intent-auto-discovery.md`). This ADR is their successor record; inbound references in ADR-016 and ADR-018 were struck in place.
* ⚠ Static deny-lists are weaker than the removed normalization for exotic obfuscation; the mitigation is the post-removal `ask`/deny hardening plus the third-party plugin path (users can re-add their own plugins under `.opencode/plugins/`).
* ⚖ The plugin-era gap is policed three ways: the agent validator rejects the V1 `tools:` map (`tests/unit/domain/helpers/agentFrontmatterValidator.ts:27` — "intentionally NOT a valid agent-file field"), the fail-closed coverage gate (`just coverage-check` + `scripts/coverage-thresholds.json`) turns any resurrected dead path into a build failure, and the new `tests/unit/quality/source-hygiene.test.ts` fails on raw control bytes across `src`, `tests`, `scripts`, `template/obligatorio/packs` (its scan-surface gaps are tracked as TD-V2-94).
* ⚖ Layer placement follows ADR-001: the banner predicate/message live in `src/application/` (policy), while rendering lives in the `versionInfoMessages` infrastructure adapter — dependency direction stays inward.

## 7. Related Decisions

* ~~ADR-013 — Plugin Auto-Discovery~~ — retired in `51d4a55`; this ADR supersedes it
* ~~ADR-017 — SDD Intent Auto-Discovery~~ — retired in `51d4a55`; this ADR supersedes it
* ADR-001 — Clean Architecture (banner helper in `application/`, renderer in `infrastructure/`)
* ADR-014 — Agent Pack System (the plugin previously wrapped subagent discovery for packs)
* ADR-016 — Slash Commands v2.1 (commands previously relied on plugin intent keywords; now resolve directly by markdown file)
* ADR-018 — Agent Delegation Protocol (delegation no longer passes through plugin auto-discovery)
* ADR-021 — Codemod Parser and Placement (the `permissions:` validator is the normative reader of the enforcement surface this ADR makes exclusive)
* ADR-024 — MCP `disabled` schema (same 2.1.3 template-core change window)

## 8. Compliance and Review

* **Success metrics:** zero `sdd-pipeline` references in `template/` (grep-verified); banner appears only for installs ≤ 2.1.2 (13-case edge suite per WORKFLOW §3); update-from-<2.1.3 always shows the remnant list; final 2.1.3 gates: 1941 tests / 0 fail, e2e 31/31, coverage 96.30% (`docs/WORKFLOW.md` §3).
* **Next review date:** 2027-03-22 (6 months) or when OpenCode ships a plugin-API successor worth adopting.
* **Revisit triggers:** a bypass class emerges that `permissions:` deny/ask rules cannot express; a legacy-install fleet persists past 2.2.x making the banner worth automating away.

---
*Template based on [MADR v4.0](https://adr.github.io/madr/) and [Nygard's ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).*

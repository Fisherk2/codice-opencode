# ADR-025: Third-Party Plugins Shipped at `@latest` in the Workspace Payload

* **Status:** Accepted
* **Date:** 2026-11-18
* **Decision Makers:** Fisherk2
* **Consulted:** Docs-drift audit (`/docs-update` Phase 1); ADR-019 supply-chain discipline (CI pinning)
* **Informed:** All workspace-template users (the host loads these plugins at startup), `docs/TECH_DEBT.md` owner (TD-V2-111), `docs/SECURITY.md` (plugin-surface section)
* **Traceability:** `template/obligatorio/core/opencode.json:104-110` (plugins array) | ADR-019 §1 (SHA pinning — unchanged for CI) | ADR-022 (SDD removal posture — amended, not superseded) | `AGENTS.md` §Reglas Estrictas → Seguridad | `docs/SECURITY.md` §Payload Plugin Surface | Debt: **TD-V2-111** (registered in `docs/TECH_DEBT.md`, not in this ADR)

## 1. Context and Problem Statement

The installed payload declares six third-party OpenCode plugins, all referenced at a floating `@latest` tag (`template/obligatorio/core/opencode.json:104-110`): `opencode-rpc@latest`, `opencode-navigator@latest`, `opencode-skills-collection@latest`, `opencode-skill-creator@latest`, `opencode-search-plugin@latest`, `@dietrichgebert/ponytail@latest`. Códice itself never runs them — the installer is a file copier (ADR-022 §4a; `AGENTS.md` forbids it from executing template code: "❌ Ejecutar código arbitrario del template"). But the OpenCode **host** loads every entry in `plugins` when the workspace starts, so unpinned third-party code executes on the user's machine. Meanwhile ADR-019 §1 pins every CI action to a full commit SHA. The repo therefore held two opposite versioning disciplines with no document reconciling them, and `docs/SECURITY.md` denied the tension outright ("Template files are never executed").

## 2. Decision Drivers

* **Workspace feature dependency** — the skills system depends on `opencode-skills-collection` and `opencode-skill-creator`; the orchestration/delegation flow (ADR-018) depends on `opencode-rpc` and `opencode-navigator`; `ponytail` provides the change-austerity mode. Removing them would gut the template's value.
* **Payload auto-update** — `@latest` is how the template inherits plugin fixes without a Códice release; pinning versions today would break that automatic refresh of the payload.
* **Honesty of the security posture** — the supply-chain surface exists whether or not it is documented; the policy must describe it (see ADR-022 §4c, which already acknowledges third-party plugins under `.opencode/plugins/`).
* **Scope containment** — any exception must not leak into CI, where ADR-019 pinning demonstrably works.

## 3. Considered Options

* **Option A:** Pin all six plugin versions in `opencode.json` now, updating them per release.
* **Option B:** Accept `@latest` as an explicit, documented exception to the ADR-019 pinning discipline; track version pinning as remediation debt.
* **Option C:** Ship no third-party plugins; make every user install them manually.

## 4. Decision Outcome

**Chosen option:** Option B. The payload is accepted to include six third-party plugins referenced at `@latest`, as an explicit, documented exception to the version-pinning discipline ADR-019 §1 applies to CI actions. Declared rationale: the workspace's skills system depends on `opencode-skills-collection` and `opencode-skill-creator`, the orchestration/delegation flow depends on `opencode-rpc` and `opencode-navigator`, and `ponytail` provides the change-austerity mode; pinning versions today would break the payload's automatic update.

### Boundaries of the exception

* ADR-019 §1 SHA pinning continues to govern **all CI actions** — this ADR grants nothing to the pipeline.
* The `AGENTS.md` prohibition against executing arbitrary template code continues to govern **the installer**, which never executes any payload file.
* What this ADR authorizes is solely that the **OpenCode host** loads the plugins declared in `opencode.json` at workspace startup.

### 4.1 Confirmation

* `docs/SECURITY.md` §Payload Plugin Surface describes the surface instead of denying it.
* `template/obligatorio/core/opencode.json:104-110` remains the single list the host reads; any addition/removal there is a supply-chain change that must revisit this ADR.

## 5. Pros and Cons of the Options

### Option A — Pin all six versions now

* ✅ **Pros:** matches ADR-019 discipline end-to-end; a compromised upstream release no longer auto-propagates.
* ⚠️ **Cons:** breaks payload auto-update; every plugin fix needs a Códice release; drifts silently between releases.
* **Rejected for now** — deferred as the mandatory remediation in §6 (TD-V2-111), not abandoned.

### Option B — Accept `@latest` with a recorded exception (chosen)

* ✅ **Pros:** keeps the workspace feature set alive and self-updating; makes the risk visible, owned, and time-boxed by debt.
* ⚠️ **Cons:** accepts a supply-chain surface with no integrity verification (see §6).
* **Accepted** with the TD-V2-111 mitigation obligation.

### Option C — Ship no plugins

* ✅ **Pros:** smallest possible attack surface.
* ⚠️ **Cons:** breaks the skills, orchestration and austerity features that are the product.
* **Rejected.** The template exists to ship a working workspace.

## 6. Consequences

* ⚠ **Unverified supply chain:** the six plugins ship with no integrity verification and no attestation of any kind (unlike the `--provenance` publish of ADR-019 §4, which covers the Códice tarball only). Any of them can change behavior at any moment, at their authors' discretion, without a Códice release.
* ⚠ **Privilege-escalation risk:** a plugin runs with the host's access to the user's workspace, so a malicious or compromised upstream release can read or modify user files and issue tool calls under the user's session.
* ⚠ **Mandatory mitigation (registered, not optional):** pin the six versions — or migrate to pinning plus a changelog — tracked as debt **TD-V2-111** in `docs/TECH_DEBT.md`. Until it lands, this ADR is the accepted-risk record.
* ✅ **Documentation posture fixed:** `docs/SECURITY.md` must describe the plugin surface honestly (this replaces the false "Template files are never executed" claim, scoped in §1).

## 7. Related Decisions

* ADR-019 — CI/CD Hardening: its SHA-pinning discipline (§1) is what this ADR excepts for the payload; CI itself is untouched (and amended for Phase 0 in the same window).
* ADR-022 — SDD Plugin Removal: this ADR **shields/amends its posture**: the SDD plugin was removed for V2 incompatibility, not as a supply-chain policy, so removing SDD and shipping third-party plugins at `@latest` are not contradictory decisions.
* ADR-018 — Agent Delegation Protocol: one of the dependents on `opencode-rpc` / `opencode-navigator`.
* ADR-024 — MCP `disabled` Schema: same template-core file; both govern what the host can reach at runtime.

## 8. Compliance and Review

* **Success metrics:** TD-V2-111 closed with all six entries version-pinned (or pinned + changelog) in `opencode.json`; SECURITY.md plugin-surface section present and linked.
* **Next review date:** at TD-V2-111 closure, or 2027-05-18 (6 months) if that slips.
* **Revisit triggers:** a plugin upstream incident (typosquat, compromised release, silent breaking change); OpenCode shipping a plugin integrity/allowlist mechanism; a release where payload auto-update proves more costly than its risk.

---
*Template based on [MADR v4.0](https://adr.github.io/madr/) and [Nygard's ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).*

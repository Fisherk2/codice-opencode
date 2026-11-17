# ADR-023: Short-Lived `release/X.Y.Z` Branches for Stable Promotion

* **Status:** Accepted
* **Date:** 2026-09-22
* **Decision Makers:** Fisherk2
* **Consulted:** Review crew (F1/F2 review-round findings on `release/2.1.3`; multi-person review before tag)
* **Informed:** npm consumers (dist-tag `latest` consumers), Wiki/doc sync owners
* **Traceability:** ADR-019 (amended, not superseded) | `CONTRIBUTING.md` §Branch table (release row) + §Release Flow | `.github/workflows/release.yml` | `docs/WORKFLOW.md` §3 (v2.1.3 stabilization + human go-ahead, lines 244–249) | `CHANGELOG.md` [2.1.3] (20 commits `hotfix/opencode-v2-migrate`, 12-commit review-round on `release/2.1.3`)

## 1. Context and Problem Statement

ADR-019 (2026-08-07) hardened CI/CD around a `develop` → `main` three-stage flow with branch protection, required status checks on all three OSes, and SHA-pinned actions. It assumed each change reaches `main` as an individually reviewed PR. The 2.1.3 line did not work that way in practice: FEV-29/30 cooked up on `hotfix/opencode-v2-migrate` (20 commits, released as `v2.1.3-beta.1` with dist-tag `beta`), and the post-beta stabilization — permission hardening (review findings F1/F2), stager/merge stabilization, `release.yml` quality-on-tag, `IUserPrompt` port split — landed as **direct commits on `release/2.1.3`** (12 commits, `docs/WORKFLOW.md` §3) ahead of one consolidated human review before the stable tag. The informal practice needs a formal rule: what may commit directly where, what gates must be green, and who authorizes publication.

## 2. Decision Drivers

* **Concentrated review window** — a release candidate deserves one holistic review (multi-person) immediately before the tag, not per-fix review fatigue across weeks of stabilization.
* **Platform enforcement stays intact** — `main` and `develop` remain protected (ADR-019: no direct pushes, required checks); the exception must be a branch type that is *known* short-lived, not a general loosening.
* **Publication safety** — `latest` is a trust surface: prereleases must never touch it (they publish with dist-tag `beta`/`rc`, `make_latest=false` per `release.yml`), and a stable tag must require explicit human approval.
* **Rollback path** — if a published version misbehaves, the flow needs a guarded, documented recovery (`just rollback`).

## 3. Considered Options

* **Option A:** Strict ADR-019 flow — every stabilization fix opens its own PR into `develop`, then a separate `develop` → `main` PR.
* **Option B:** Formalize a short-lived `release/X.Y.Z` branch cut from `develop`, unprotected, direct stabilization commits, one consolidated PR to `main`.
* **Option C:** Long-lived release train (`release/stable` perpetual integration branch feeding tags).

## 4. Decision Outcome

**Chosen option:** Option B — `release/X.Y.Z` becomes the official stabilization-and-promotion vehicle, amending ADR-019's flow (which it does not invalidate: branch protection, SHA pins, provenance, and the three-OS check matrix all keep applying to `develop`/`main` and to the release PR itself).

### The official flow (as codified in `CONTRIBUTING.md` §Release Flow)

```
develop ──●───────────────●──  (integration)
           ╲             ╱
            ●─────●─────●  ← stabilization → release/X.Y.Z
                          │
main ──────●──────────────●──  (production)
           │                    │
           └── PR release→main ─┘  (squash merge)
                                     │
tags                                 ● vX.Y.Z
```

1. **Cut** `release/X.Y.Z` from `develop` (`git checkout -b release/X.Y.Z develop`).
2. **Stabilization fixes land directly** on the branch (PRs or direct commits — "it is a short-lived, unprotected branch", `CONTRIBUTING.md`). No per-fix PR review is required at this stage.
3. **Full gates must be green before promotion:** `just check`, `just test`, `just coverage-check`, `just test-e2e` (2.1.3 final record in `docs/WORKFLOW.md` §3: 1941 tests / 4354 expect() / 0 fail, e2e 31/31, coverage 96.30% total / 98.95% `src/cli/main.ts`, madge 0 cycles).
4. **One PR** `release/X.Y.Z` → `main` (squash merge) carrying the whole stabilization set — the single mandatory human review point; required checks `CI / quality (ubuntu|macos|windows)` gate it (ADR-019). On `workflow_dispatch` runs the quality matrix executes against the **publication tag**, not the dispatch branch (`CHANGELOG.md` [2.1.3] Changed; `release.yml`).
5. **Tag `vX.Y.Z` → publish** via `release.yml`: prerelease tags (`-beta.N`/`-rc.N`) publish with their suffix dist-tag and `make_latest=false`; stable tags publish `npm publish --tag latest --provenance`. `latest` is never overwritten by a prerelease.
6. **Sync `develop` ← `main`** post-release (mandatory, ADR-019 rule 3).

### Human approval gate

Tagging and publishing require **explicit human OK** — never tag by hand, only the guarded Just helpers (`just tag` → `just release` → `just verify-release`, `CONTRIBUTING.md` §Release). The live proof this constraint binds: `v2.1.3-beta.1` was published and verified, yet the stable launch ("`v2.1.3` → `latest`, sync a `develop`") stayed pending "aprobación del usuario — aún no ejecutado" (`docs/WORKFLOW.md` §3).

## 5. Pros and Cons of the Options

### Option A — PR per stabilization fix

* ✅ **Pros:** maximum per-change scrutiny.
* ⚠️ **Cons:** 12-commit review rounds churn a week of PR overhead on a branch only days from death; reviewers lost context between fixes to the same subsystem (e.g., the stager/merge hardening cluster).
* **Rejected.** Review fatigue is a real defect rate, not a safety margin.

### Option B — Short-lived release branch (chosen)

* ✅ **Pros:** review concentrated exactly where it matters (pre-tag holistic review + release PR); protected branches untouched; publish gates stay machine-enforced.
* ⚠️ **Cons:** direct commits on an unprotected branch bypass per-change CI gating — mitigated because the release PR re-runs the full three-OS matrix against the merged tip and the quality matrix re-runs on the publication tag itself.
* **Accepted** with the mitigations above.

### Option C — Long-lived release train

* ✅ **Pros:** no branch churn at all.
* ⚠️ **Cons:** "short-lived" disappears, so the protection exception becomes permanent and unbounded; versions lose their audit anchor.
* **Rejected.** Unprotected-forever contradicts ADR-019's enforcement model.

## 6. Consequences

* ✅ The 2.1.3 practice (`hotfix/opencode-v2-migrate` → beta → `release/2.1.3` → one PR) is now legal, repeatable, and documented — no more improvised exceptions to branch protection.
* ✅ Review effort moves from N per-fix PRs to one high-quality holistic window before the tag; F1/F2-class findings land *before* `latest` moves, not after.
* ⚠ The branch dies after the merge — anything left uncommitted on `release/X.Y.Z` is lost. Contributors must land work on `develop` for it to survive.
* ⚠ A fix made during stabilization must not also be merged to `develop` independently; it reaches `develop` through the post-release sync (rule 6). Skipping the sync produces the divergence ADR-019 already forbids.
* ⚖ Rollback after publication is an accepted part of the flow rather than an incident: `just rollback vX.Y.Z-bad <good> <dist_tag>` (guarded, `DRY_RUN=1` to preview, `CONTRIBUTING.md` §Release).
* ⚖ This record *amends* ADR-019; it does not supersede it. ADR-019 remains the normative source for pinning, provenance, protection, and templates.

## 7. Related Decisions

* ADR-019 — CI/CD Hardening (branch protection + required checks this flow inherits and amends)
* ADR-006 — npm Publication as Primary Distribution (dist-tag semantics enforced here)
* ADR-011 — Binary Removal (npm/bunx as sole channel, so publish gates are the release gates)
* ADR-022 — SDD plugin removal (the FEV-30 payload that rode this flow to stable)
* ADR-024 — MCP `disabled` schema (same release's template-core change)

## 8. Compliance and Review

* **Success metrics:** every stable tag from 2.1.3 onward traces to a single `release/X.Y.Z` PR with a green three-OS matrix; prereleases never move `latest` (`npm dist-tag ls` verified by `just verify-release`); post-release `develop` sync commit exists within one day of each tag.
* **Next review date:** 2027-03-22 (6 months) or on the first 2.2.x release cut.
* **Revisit triggers:** the stabilization window routinely exceeds ~2 weeks (signal the branch isn't short-lived); a published regression reaches `latest` through a release that skipped direct-commit discipline; team growth makes single-PR holistic reviews a bottleneck (re-evaluate with per-area CODEOWNERS on the release PR).

---
*Template based on [MADR v4.0](https://adr.github.io/madr/) and [Nygard's ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).*

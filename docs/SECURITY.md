# Security Policy — Códice

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.1.3+  | ✅ Supported |
| 2.0.x – 2.1.2 | ⚠️ Legacy — retired Opencode Legacy runtime (ADR-022); the installer shows an "Opencode Legacy only" warning before the mode menu (`src/application/legacyBanner.ts:15`) |
| 1.0.x – 1.2.x | ⚠️ Legacy — pre-V2 installs; surfaced as a pre-2.0 detection notice (`src/application/versionInfoMessages.ts:12-13`) |
| < 1.0   | ❌ No longer supported |

> **Open question (2026-11-18):** no documented policy states whether security fixes are
> backported to the ≤ 2.1.2 legacy line — ADR-022 §6 defines the banner as a non-blocking
> upgrade nudge ("keep working"), not a support cutoff. Until a policy is recorded, treat
> legacy installs as best-effort.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, report them privately through [GitHub Security Advisories](https://github.com/fisherk2/codice-opencode/security/advisories/new) or by email to [dev@fisherk2.com](mailto:dev@fisherk2.com).

You should receive a response within **48 hours**. If you do not receive a response, please follow up to ensure we received your original message.

## Response Process

1. **Acknowledgment** — within 48 hours of report
2. **Triage** — within 5 business days (confirm vulnerability and assess severity)
3. **Fix and Disclosure** — timeline based on severity:
   - **Critical/High** — patch released within 7 days
   - **Medium** — patch released within 30 days
   - **Low** — patch released in next regular release cycle

## Disclosure Policy

We follow [coordinated disclosure](https://en.wikipedia.org/wiki/Coordinated_disclosure):

- Reporters are credited in security advisories upon request
- Critical fixes are released as patch versions
- Security advisories are published via GitHub Security Advisories
- We coordinate the public disclosure date with the reporter

## Supply Chain Integrity

Códice is distributed as source via npm (`bunx @fisherk2-dev/codice`). The
supply-chain surface is intentionally minimal:

- **2 production dependencies** (`@clack/prompts`, `semver`) — `semver` has
  zero transitive dependencies; the full dependency tree is ~77 packages,
  all permissively licensed (MIT/ISC/Apache-2.0/BSD), none with GPL/copyleft.
- **No postinstall scripts** — the package never executes code at install time.
- **Reproducible installs** — `bun.lock` is committed; `^` ranges in
  `package.json` are resolved deterministically from the lockfile.
- **Version pinning** — users can pin an exact version for defense in depth:
  `bunx @fisherk2-dev/codice@2.0.0`.
- **CVE scanning** — `bun audit --audit-level=high` runs in the CI `security` job on
  every PR to `main`/`develop`, and `security` is a required status check, so merges
  fail on high-severity advisories (`.github/workflows/ci.yml:141`,
  `scripts/setup-branch-protection.sh:41-47`). Alternatives were ruled out:
  `bun pm scan` requires a third-party scanner configured in `bunfig.toml` (this repo
  has none) and `npm audit` exits `ENOLOCK` because the repo tracks `bun.lock`, not
  `package-lock.json` (`ci.yml:133-138`).

### Planned hardening

The following are tracked as open hardening work:

1. **SBOM generation** — publish a CycloneDX SBOM (e.g. `@cyclonedx/bun-plugin`)
   with each release to make the dependency graph machine-verifiable.
2. **2FA on publish account** — already required for `fisherk2-dev`; kept here
   as a checklist item for continuity.

> **Update 2026-11-18:** automated CVE scanning in CI — previously item 2 of this
> list — shipped as the required `security` check described above.

### Security boundary summary

- **Path traversal** is blocked at three layers: CLI-level `validateDestPath`
  (`src/cli/validateDestPath.ts`), infrastructure-level `resolveWithinRoot()`
  (`src/infrastructure/adapters/pathResolver.ts:43`), and `isPathWithin()`
  (`pathResolver.ts:28`) with trailing separator handling.
- **The installer never executes payload files** — Códice is a file copier
  (`fs.copyFile`), not a script runner, and `AGENTS.md` forbids it from running
  template code. The `noTemplateCopy` flag (ADR-010) marks virtual entries
  produced post-installation. This does **not** mean the payload is inert: see
  [Payload Plugin Surface](#payload-plugin-surface) below.
- **Symlinks** are skipped during directory walking and validated to stay
  within the workspace before creation.
- **GitHub API** calls are unauthenticated, validated to `*.github.com`
  HTTPS, and capped at 1 MB responses; failures fall back gracefully.
- **Secrets** — no tokens or credentials are accepted, stored, or logged.

### Payload Plugin Surface

The workspace template ships six third-party OpenCode plugins, all referenced at
floating `@latest` tags (`template/obligatorio/core/opencode.json:104-110`):
`opencode-rpc`, `opencode-navigator`, `opencode-skills-collection`,
`opencode-skill-creator`, `opencode-search-plugin` and `@dietrichgebert/ponytail`.
Códice does not run them, but the OpenCode host loads them when the workspace
starts — unpinned third-party code executes with workspace access on the user's
machine, with no integrity verification or attestation, and upstream authors can
change it at any time without a Códice release. This is an accepted, documented
supply-chain exception to the ADR-019 pinning discipline: see
[ADR-025](adr/adr-025-plugins-suministrados-en-latest.md). Remediation (pinning
the six versions, or pinning + changelog) is tracked as **TD-V2-111** in
`docs/TECH_DEBT.md`.

### Workspace Enforcement Surfaces

- **Destructive commands** are blocked by the `permissions` shell deny-lists in
  `template/obligatorio/core/opencode.json` (e.g. `rm -rf *`, `git push --force *`,
  `mkfs *`, `dd if=*`), not by a plugin — ADR-022 removed the SDD plugin that
  previously did this and made the declarative lists the single enforcement surface.
- **MCP servers** use the V2 explicit-`disabled` schema (ADR-024): 7 servers are
  configured and each declares its state; only `context7`, `gitmcp` and
  `vercel-grep` connect by default (`opencode.json` `mcp.servers`).

---
*Last updated: 2026-11-18*

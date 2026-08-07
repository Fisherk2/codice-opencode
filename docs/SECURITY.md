# Security Policy — Códice

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.2.x   | ✅ Supported |
| 1.1.x   | ✅ Supported |
| 1.0.x   | ✅ Supported |
| < 1.0   | ❌ No longer supported |

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
- **CVE scanning** — dependencies are audited before each release (`npm audit`
  / `bun pm scan`). Both production deps currently report 0 known CVEs.

### Planned hardening (v2.1.0+)

The following are not blockers for v2.0.0 but are tracked as hardening work:

1. **SBOM generation** — publish a CycloneDX SBOM (e.g. `@cyclonedx/bun-plugin`)
   with each release to make the dependency graph machine-verifiable.
2. **npm provenance/signing** — enable npm package provenance (requires an
   npm org with paid tier) so consumers can verify the published tarball was
   built from the GitHub release workflow.
3. **Automated CVE scanning in CI** — configure a security scanner plugin
   (`bunfig.toml`) so `bun pm scan` runs on every PR, catching advisories
   before release rather than at audit time.
4. **2FA on publish account** — already required for `fisherk2-dev`; kept here
   as a checklist item for continuity.

### Security boundary summary

- **Path traversal** is blocked at three layers: CLI-level `validateDestPath`,
  domain-level `resolveWithinRoot()`, and `isPathWithin()` with trailing
  separator handling. See `src/cli/validateDestPath.ts` and
  `src/infrastructure/adapters/pathResolver.ts`.
- **Template files are never executed** — Códice is a file copier
  (`fs.copyFile`), not a script runner. The `noTemplateCopy` flag (ADR-010)
  marks virtual entries produced post-installation.
- **Symlinks** are skipped during directory walking and validated to stay
  within the workspace before creation.
- **GitHub API** calls are unauthenticated, validated to `*.github.com`
  HTTPS, and capped at 1 MB responses; failures fall back gracefully.
- **Secrets** — no tokens or credentials are accepted, stored, or logged.

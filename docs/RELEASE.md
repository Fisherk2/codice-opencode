# Release Runbook

Operational guide for publishing and, if needed, rolling back `@fisherk2-dev/codice`.
Releases are **tag-driven**: pushing a `v*` tag triggers
[`.github/workflows/release.yml`](../.github/workflows/release.yml). There are no
Just release targets that publish on their own — the helpers below only prepare,
push, verify and (guarded) roll back.

For branching rules see [CONTRIBUTING.md → Git Workflow](../CONTRIBUTING.md#git-workflow).

---

## 1. What the release workflow actually does

Triggered by a `v*` tag push (or `workflow_dispatch` with a `tag` input):

| # | Step | Detail |
|---|------|--------|
| 0 | **Quality gate** | `release` job `needs:` the reusable [`ci.yml`](../.github/workflows/ci.yml) quality matrix. A red quality job blocks publish. |
| 1 | Checkout | `fetch-depth: 0`. |
| 2 | Validate tag format | Must match `^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$` (injection guard). |
| 3 | Extract release body | Reads the `## [<version>]` section from `CHANGELOG.md`. If absent, a stub body is generated (the release still succeeds). |
| 4 | Validate version | Compares the **base** version of tag vs `package.json` (prerelease suffix stripped on both sides). |
| 5 | Detect release type | `vX.Y.Z-(beta\|rc).N` → type `prerelease`, `npm_tag=beta\|rc`, `make_latest=false`. Otherwise → `npm_tag=latest`, `make_latest=true`. |
| 6 | Publish to npm | `npm publish --tag <npm_tag> --provenance`. If the version is already published, the run **skips** publish with a notice; other errors fail the job. |
| 7 | GitHub Release | `softprops/action-gh-release` with the extracted body, `prerelease` and `make_latest` from step 5. |

Permissions: `contents: write`, `id-token: write` (provenance/attestation).

> The workflow compares **base** versions only: tag `v2.1.3-beta.1` and
> `package.json` `2.1.3` (or `2.1.3-beta.1`) both pass. `just tag` is stricter — it
> requires an exact match to `package.json`.

---

## 2. Prerequisites

- Clean tree on `main` (or the hotfix branch) with CI green on all platforms.
- `jq`, `git`, `npm` (≥ 10), `gh` (authenticated: `gh auth status`).
- `npm` logged in with publish rights for `@fisherk2-dev` (`npm whoami`).
- The release tag is an **annotated** tag created locally (never signed — gpg may be absent).

---

## 3. Release checklist

1. **CHANGELOG** — confirm `CHANGELOG.md` has a `## [X.Y.Z(-beta.N|-rc.N)]` section, dated.
   Without it, the GitHub Release body falls back to a stub.
2. **Version** — `package.json` version base matches the intended tag base.
3. **Merge** — merge `develop → main` (normal flow) or hotfix `→ main`, squash-merged.
4. **Tag** — `just tag vX.Y.Z-beta.1`
   Validates the format, the `package.json` match, and local/remote uniqueness,
   then creates the annotated tag. It does **not** push.
5. **Release** — `just release vX.Y.Z-beta.1`
   Runs `just check` then `just test`, warns that pushing triggers CI publish, and
   pushes the tag. Set `RELEASE_CONFIRM=yes` to skip the interactive prompt.
6. **Watch CI** — `gh run watch` (or the Actions tab). The quality matrix must be green.
7. **Verify npm** — `just verify-release X.Y.Z-beta.1`
   `npm view @fisherk2-dev/codice@<version> version` + `bunx @fisherk2-dev/codice@<version> --help`,
   retried 5×15s to absorb registry propagation lag. This is the supported replacement
   for the old manual "verify npm" step.
8. **Sync `develop` ← `main`** — required after every production release
   (`git checkout develop && git merge main && git push origin develop`).

For a pre-release (`beta`/`rc`) the same flow applies; steps 3 and 8 still hold.

---

## 4. dist-tag semantics

`release.yml` derives the npm dist-tag from the tag suffix:

| Tag | npm dist-tag | GitHub Release `latest`? |
|-----|--------------|--------------------------|
| `vX.Y.Z` | `latest` | yes (`make_latest=true`) |
| `vX.Y.Z-beta.N` | `beta` | no |
| `vX.Y.Z-rc.N` | `rc` | no |

A prerelease therefore **never overwrites `latest`** — `npm install @fisherk2-dev/codice`
keeps resolving to the last stable release. To move a dist-tag deliberately:

```bash
npm dist-tag add @fisherk2-dev/codice@<version> <latest|beta|rc>
npm dist-tag ls @fisherk2-dev/codice     # inspect all tags
```

---

## 5. Rollback procedure

A curated wrapper for steps (a)–(d) is provided:

```bash
just rollback vX.Y.Z-bad <good-version> <latest|beta|rc>   # per-step confirmation
DRY_RUN=1 just rollback vX.Y.Z-bad <good-version> <dist_tag>   # print plan only
```

Each step is printed and confirmed before it runs; declining a step aborts the rest.
The manual procedure, if you prefer to run the commands yourself:

**(a) Deprecate the bad version** — surfaces a warning to anyone installing it:

```bash
npm deprecate @fisherk2-dev/codice@<bad> "broken, use <good>"
```

**(b) Move the dist-tag back** to the last good version:

```bash
npm dist-tag add @fisherk2-dev/codice@<good> beta   # or: latest
```

**(c) Delete the GitHub Release** (keeps the git tag unless `--cleanup-tag` is passed):

```bash
gh release delete <tag> --yes
```

> **`--cleanup-tag` consideration.** `gh release delete <tag> --yes --cleanup-tag`
> deletes the remote **tag** too. That is convenient, but it couples two destructive
> actions; this runbook deletes the release and the tag separately (step d) so each is
> auditable. If you do pass `--cleanup-tag`, skip step (d).

**(d) Delete the remote tag** (prevents a re-run of the release workflow):

```bash
git push --delete origin <tag>
```

**(e) Do not unpublish.** `npm unpublish` is restricted after **72 hours** and can break
downstream consumers. Deprecating (a) plus moving the dist-tag (b) is the supported
path. Reserve unpublish for the narrow window when nothing could have installed it.

**(f) Triggers and RTO.**

- **Trigger conditions:** the published version fails to install or run on a supported
  platform (e.g. `bunx @fisherk2-dev/codice@<version> --help` errors); a security or
  data-loss regression ships in the artifact; a dist-tag points at the wrong version;
  a version published with no matching GitHub Release.
- **RTO:** target **≤ 30 minutes** from detection to (a)+(b) complete — deprecation
  propagates within minutes and the dist-tag move is immediate, restoring `latest`/`beta`
  to the last known-good version. Steps (c)/(d) are cleanup and can follow.

---

## 6. Notes

- Never move `latest` to a prerelease. Let `release.yml` derive the dist-tag.
- `release.yml` is idempotent-ish for publish: re-running on an already-published
  version logs "Version already published — skipping." and continues to the release body.
- If `just tag` cannot reach `origin` it aborts before creating the tag (fail-closed).
- Provenance requires the `id-token: write` permission already set in the workflow.

# ADR-024: Explicit `disabled` MCP Schema and 3-Server Active Default

* **Status:** Accepted
* **Date:** 2026-09-22
* **Decision Makers:** Fisherk2
* **Consulted:** Template test owners (`tests/setup/` suite), context-economy review (MCP-Servers wiki rationale)
* **Informed:** Users updating 2.1.2 → 2.1.3 (breaking removal of two servers), Wiki/doc sync owners
* **Traceability:** v2.1.3 | `CHANGELOG.md` [2.1.3] Fixed ("Flags `disabled` explícitos por MCP") | `template/obligatorio/core/opencode.json` (`mcp.servers`) | `tests/setup/opencode-config.test.ts` | OpenCode V2 docs: https://opencode.ai/v2/docs/mcp-servers | `docs/wiki-source/MCP-Servers.md`, `docs/wiki-source/Configuration.md`

## 1. Context and Problem Statement

The template's `opencode.json` carried its MCP block in the OpenCode 1.x idiom: servers keyed directly under `mcp` with an `enabled` toggle, and 7+ entries always on — including the `tavily` and `firecrawl` remote servers. OpenCode V2 inverted the schema: servers now live under `mcp.servers` and the operative key is `disabled`, whose absence means *connected* ("Use `disabled`, not an `enabled` field, to keep one configured without connecting it" / "`disabled` … Prevents connection when `true`. Defaults to `false`" — https://opencode.ai/v2/docs/mcp-servers, Config + field tables). Two problems compounded: an `enabled` key is silently ignored by V2, and every configured-but-untrimmed server loads its tool catalog into model context — the official docs' own caveat: "MCP tools consume model context, so add only the servers you need." Users were paying a context tax on heavyweight local toolchains (chrome-devtools, excel, jupyter, codebase-memory-mcp) they rarely invoked, plus two search/scrape servers whose function V2 covers natively.

## 2. Decision Drivers

* **No ambiguity by omission** — under V2's default-enabled semantics, a missing flag is a *decision* nobody wrote down; the project rule is explicit state per server.
* **Context economy** — the default install should light up only servers that are useful to everyone; `docs/wiki-source/MCP-Servers.md:13`: "Three are enabled by default … the rest are disabled to conserve context and must be activated on demand."
* **Zero-prerequisite defaults** — what ships active must work on a fresh install with no local binaries or API keys; remote `context7` / `vercel-grep` / `gitmcp` qualify, local toolchains do not.
* **CI-pinnable schema** — the template file is Obligatorio and re-shipped on every release; its invariants must be machine-checked, not review-checked.
* **Coverage of removed servers** — `websearch` (native V2) and the vendored Firecrawl skills already replace tavily/firecrawl; keeping both config entries and skill/tool paths is duplication.

## 3. Considered Options

* **Option A:** Rely on V2 defaults — ship no toggle at all for active servers, omit `disabled` for everything that should be on.
* **Option B:** Explicit `disabled: false|true` on every server; trim the active default to the three remote, no-prerequisite servers; delete tavily/firecrawl outright.
* **Option C:** Keep the V1 `enabled` key for backward compatibility with Legacy installs and translate at install time.

## 4. Decision Outcome

**Chosen option:** Option B, shipped in v2.1.3 (`CHANGELOG.md` [2.1.3] Fixed: "cada servidor MCP declara su estado; solo context7, gitmcp y vercel-grep quedan habilitados, el resto explícitamente `disabled: true`").

### (a) Explicit `disabled` on every entry

`template/obligatorio/core/opencode.json` → `mcp.servers` (V2 nesting): all seven servers carry an explicit boolean `disabled`. No entry relies on the V2 default, so reading the file answers "what is live?" without knowing the schema. The `enabled` key is banned outright — `tests/setup/opencode-config.test.ts` fails any server that carries it.

### (b) Active default reduced to three remote servers

| Server | `disabled` | Why |
|--------|-----------|-----|
| `context7` | `false` | Remote, no prerequisites; docs queries (`AGENTS.md` context7 rule) |
| `vercel-grep` | `false` | Remote, no prerequisites; GitHub code search |
| `gitmcp` | `false` | Remote, no prerequisites; repo docs fetch |
| `chrome-devtools` | `true` | Local toolchain; needed only by `/webperf` deep mode |
| `excel` | `true` | Local toolchain; `xlsx` skill users activate on demand |
| `jupyter` | `true` | Local toolchain; notebook automation on demand |
| `codebase-memory-mcp` | `true` | Local, requires global install; opt-in |

### (c) tavily and firecrawl removed (breaking)

Both entries were deleted from the template — "v2.1.3 renamed their `enabled` toggle to `disabled`, then dropped both entries" (`docs/wiki-source/MCP-Servers.md:25`). Replacement coverage is documented there: native OpenCode V2 `websearch` for basic search, vendored Firecrawl skills for advanced/JS-heavy scraping. This is a breaking change for users who depended on the MCP entries themselves.

## 5. Pros and Cons of the Options

### Option A — Omit toggles, trust V2 defaults

* ✅ **Pros:** smallest file; zero churn from OpenCode defaults.
* ⚠️ **Cons:** "absence = on" makes the *expensive* state the invisible one — a future editor deleting `disabled: true` from jupyter silently ships it to every user's context; not expressible as a simple CI invariant.
* **Rejected.** Violates the no-ambiguity driver precisely where context cost is highest.

### Option B — Explicit flags + trimmed active set (chosen)

* ✅ **Pros:** file is self-documenting; one grep answers the active-server question; the by-value CI test (`tests/setup/opencode-config.test.ts:157`) pins the exact active/disabled partition; removal of tavily/firecrawl deletes dead duplication.
* ⚠️ **Cons:** breaking for users who customized the removed entries; every new server must remember the flag (partially mitigated — see Consequences debt note).
* **Accepted.**

### Option C — Keep V1 `enabled` + translate

* ✅ **Pros:** no user-visible change for Legacy installs.
* ⚠️ **Cons:** a translation layer inside the installer for a key the shipped file could simply not contain; V2 *ignores* `enabled` (defaults to connected), so any untranslated leak silently enables servers.
* **Rejected.** Translator risk is the exact bug class this ADR removes.

## 6. Consequences

* ✅ Deterministic default context: a fresh 2.1.3 install loads exactly three MCP catalogs, all remote and key-free.
* ✅ Single normative reading of server state — mirrors ADR-021's "one authoritative definition" principle applied to template config instead of agent frontmatter.
* ⚠ **Breaking on update, silently by design.** `opencode.json` is classified Obligatorio — "Always copy, **Overwrite** destination" (`specs/spec-file-rules.md:20,34`; `src/domain/entities/FileRule.ts:5`). Users updating 2.1.2 → 2.1.3 get the file replaced: tavily/firecrawl disappear from their `.opencode` merge even if they had customized those entries. The removal note in `docs/wiki-source/MCP-Servers.md:25` is the migration pointer (manual re-add is still possible).
* ⚖ **Schema-test debt (register it).** The CI guard is value-pinning against the hardcoded seven-name lists, not a universal rule: a *new* server entry shipped without any `disabled` key passes both MCP tests ("use disabled instead of enabled" only type-checks the key when present — `tests/setup/opencode-config.test.ts:145-156`), and there is no validation of the block against the official JSON schema (`$schema: https://opencode.ai/config.json`). No entry for this exists in `docs/TECH_DEBT.md` yet; it should be registered as a TD item alongside TD-V2-94 (whose scan roots likewise omit `template/obligatorio/core`, where this file lives).
* ⚖ **Doc sync is partially open.** `docs/wiki-source/MCP-Servers.md` documents the new semantics fully; `docs/wiki-source/Configuration.md:410` still instructs "Set `\"enabled\": true`" in its activation step — stale against V2's `disabled: false` key. Flagged for the documentation-sync pass; not amended here since index/wiki files are owned by parallel doc work.
* ⚖ Establishes the explicitness precedent for future template config: declare state, don't inherit it from a runtime default.

## 7. Related Decisions

* ADR-022 — SDD plugin removal (same 2.1.3 template-core change window; both moves consolidate "config over code")
* ADR-021 — Codemod Parser and Placement (shared principle: one normative schema surface, CI-gated)
* ADR-014 — Agent Pack System (pack selection is the precedent for opt-by-default-heavy; this ADR applies it to MCP)
* ADR-023 — Short-lived release branches (the vehicle that carried this breaking trim to stable with human go-ahead)
* `specs/spec-file-rules.md` — Obligatorio/Mandatory overwrite semantics that make the removal effective on update
* `specs/spec-template.md` — template structure owning the `mcp.servers` block

## 8. Compliance and Review

* **Success metrics:** zero `enabled` keys in any shipped `mcp.servers` entry (CI-enforced); fresh-install MCP catalog footprint = 3 servers; zero reports of tavily/firecrawl config surviving an update to 2.1.3+; wiki activation steps consistent with the `disabled` key after doc sync.
* **Next review date:** 2027-03-22 (6 months) or whenever OpenCode revises the MCP config schema again (the rename `enabled` → `disabled` shows defaults do flip).
* **Revisit triggers:** universal per-entry schema validation lands as a TD fix; a fourth server earns default-on status (requires re-justifying the zero-prerequisite rule); org-level remote defaults (V2 docs, "Overriding remote defaults") make template-side flags redundant.

---
*Template based on [MADR v4.0](https://adr.github.io/madr/) and [Nygard's ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).*

# Diagnosis: v1.1.0 Roadmap — Issues + Tech Debt Resolution

**Issues:** [#21](https://github.com/fisherk2/codice-opencode/issues/21), [#26](https://github.com/fisherk2/codice-opencode/issues/26), [#27](https://github.com/fisherk2/codice-opencode/issues/27), [#28](https://github.com/fisherk2/codice-opencode/issues/28), [#29](https://github.com/fisherk2/codice-opencode/issues/29), [#30](https://github.com/fisherk2/codice-opencode/issues/30)
**Tech Debt:** docs/TECH_DEBT.md (v1.1.0 items)
**Date:** 2026-07-10
**Severity:** mixed (configuration → medium, system prompts → high, dependency upgrades → medium)
**Status:** planned

---

## Summary

v1.1.0 consolidates 6 "help wanted" GitHub issues and 6 tech debt items into 5 evolutionary phases (FEV-6 to FEV-10). The goal is to improve agent governance, add new capabilities (MCP servers, Obsidian subagent), harden security (command restrictions), and modernize the codebase (TypeScript 6.x, Biome 2.x, ISP compliance).

## Symptoms

- Agent system prompts lack no-assumption rules and delegation-first patterns
- No restrictions on destructive bash commands (`rm -rf`, `git push --force`, `DROP DATABASE`, etc.)
- Missing MCP servers for documentation and web search
- No Obsidian vault management subagent
- No `SECURITY.md` document
- Suboptimal step counts for primary agents
- `main.ts` coverage at 33% (only tested via E2E, not instrumented by `bun --coverage`)
- `IFileSystem` port violates ISP (12 methods, staging + filesystem mixed)
- npm packaging bugs caught post-release (FEV-2-B, FEV-2-C) — no automated test
- TypeScript 5.x and Biome 1.x are behind current stable versions

## Root Cause

Rapid evolution through FEV-1 to FEV-5 phases prioritized functionality over agent governance, code quality infrastructure, and dependency modernization. The tech debt accumulated as "v1.1.0 targets" in `TECH_DEBT.md`.

> Why did this accumulate? → _Each FEV phase (FEV-1 through FEV-5) resolved critical production bugs and added essential features. Non-critical improvements (agent prompt quality, dependency upgrades, ISP compliance) were intentionally deferred to v1.1.0 to avoid scope creep in patch releases._

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | All workspace users (agent quality, security, new capabilities) |
| Functionality | 6 new features + 6 quality improvements |
| Data integrity | Safe (no data migration required) |
| Risk | Medium (dependency upgrades may introduce breaking changes) |

## Environment

- **Version:** v1.0.14
- **Tests:** 500 pass, 0 fail, 1090 expects
- **Coverage:** ~98% functions, ~97% lines
- **Platform:** Linux, Bun, TypeScript

---

## Proposed Solution — 5 Phases

### FEV-6: Quick Configuration + Documentation (~1.5h)

**Items:** Issue #27 + Issue #28 + TD-1.2

| ID | Description | File(s) | Effort |
|----|-------------|---------|--------|
| FEV6-T1 | Adjust `steps` for 6 primary agents per Issue #27 values | `template/obligatorio/opencode.json` | 15min |
| FEV6-T2 | Create `docs/SECURITY.md` for the project | `docs/SECURITY.md` (new) | 30min |
| FEV6-T3 | Create `template/estandar/docs/SECURITY.md` placeholder | `template/estandar/docs/SECURITY.md` (new) | 30min |
| FEV6-T4 | Add explicit constructors to VersionComparator + ClackPromptsAdapter | `src/domain/services/VersionComparator.ts`, `src/infrastructure/adapters/ClackPromptsAdapter.ts` | 15min |
| FEV6-T5 | Update FileRuleManifestData.ts if SECURITY.md is added as standard entry | `src/domain/entities/FileRuleManifestData.ts` | 15min |

**Steps for FEV6-T1** — exact values from Issue #27:

| Agent | Current steps | Target steps |
|-------|---------------|--------------|
| huitzilopochtli | — | 25 |
| quetzalcoatl | — | 60 |
| moctezuma | — | 20 |
| tlaloc | — | 90 |
| mictlantecuhtli | — | 60 |
| tezcatlipoca | — | 50 |

**DoD FEV-6:**
- [ ] steps updated for all 6 primary agents
- [ ] SECURITY.md exists in docs/ and template/estandar/docs/
- [ ] Explicit constructors added (coverage artifact resolved)
- [ ] `bun test`: 0 fail, no regression
- [ ] `just check`: 0 errors

---

### FEV-7: Agent Governance & Security Hardening (~7h)

**Items:** Issue #26 + Issue #30

| ID | Description | File(s) | Effort |
|----|-------------|---------|--------|
| FEV7-T1 | Add no-assumption rule to 6 primary agent prompts | `template/obligatorio/agents/{huitzilopochtli,quetzalcoatl,moctezuma,tlaloc,mictlantecuhtli,tezcatlipoca}.md` | 2h |
| FEV7-T2 | Add delegation-first instruction to agents that delegate (quetzalcoatl, tlaloc, mictlantecuhtli) | Same 3 agent files | 1h |
| FEV7-T3 | Analyze 100+ destructive commands from Issue #30 and select pertinent ones | Analysis document | 1h |
| FEV7-T4 | Add selected command restrictions to sdd-pipeline.ts plugin | `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` | 1.5h |
| FEV7-T5 | Add command restrictions to opencode.json permissions | `template/obligatorio/opencode.json` | 30min |
| FEV7-T6 | Update plugin README.md | `template/obligatorio/.opencode/plugins/README.md` (if exists) | 30min |

**Philosophy for Issue #26:**
- **Preguntar antes de ejecutar**
- **Resolver dudas antes de realizar**
- **Sugerir antes de implementar**
- **Advertir antes de continuar**

**Issue #30 — Command categories to analyze:**
- Filesystem (`rm -rf`, `shred`, `find -exec rm`)
- Git (`push --force`, `reset --hard`, `filter-repo`)
- SQL (`DROP DATABASE`, `TRUNCATE`, `DELETE` sin `WHERE`)
- Docker (`rm -f`, `rmi -f`, `system prune -a`)
- Kubernetes (`delete --all`, `drain`)
- Permissions (`chmod 777`, `chown -R`)
- Process (`kill -9 1`, `shutdown -h now`)
- Network (`iptables -F`, `ufw disable`)
- Package managers (`npm publish`, `pip --force-reinstall`)
- Environment (`unset PATH`, `echo >> ~/.bashrc`)
- Disk (`dd`, `mkfs`, `fdisk`)
- IaC (`terraform destroy -auto-approve`)
- Cloud (`aws s3 rm --recursive`, `az vm delete`)
- Databases (`mongo dropDatabase`, `redis FLUSHALL`)

Not all commands need restriction — some are acceptable with the default "ask" permission for bash.

**DoD FEV-7:**
- [ ] All 6 primary agents have no-assumption rule
- [ ] Delegating agents have delegation-first instruction
- [ ] Destructive commands restricted in plugin + config
- [ ] Plugin README updated
- [ ] `bun test`: 0 fail, no regression
- [ ] `just check`: 0 errors

---

### FEV-8: Obsidian Subagent (~3-4h)

**Item:** Issue #21

| ID | Description | File(s) | Effort |
|----|-------------|---------|--------|
| FEV8-T1 | Create obsidian-vault-writer subagent | `template/obligatorio/agents/obsidian-vault-writer.md` (new) | 1h |
| FEV8-T2 | Install 6 Obsidian/Markdown skills | Skills directory | 1h |
| FEV8-T3 | Update Huitzilopochtli's catalog | `template/obligatorio/agents/huitzilopochtli.md` | 15min |
| FEV8-T4 | Update delegation tables for primary agents that can delegate | quetzalcoatl.md, tlaloc.md, mictlantecuhtli.md | 30min |
| FEV8-T5 | Add to VALID_SUBAGENTS Set | `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` | 15min |
| FEV8-T6 | Update GitHub Wiki → Agents catalog | Wiki page | 30min |

**Subagent specification (from Issue #21):**
- `mode: subagent`
- `permission:` edit only `*.md`, bash only `obsidian-cli *`
- `hidden: true`
- `temperature: 0.1`
- Only invokable by Huitzilopochtli

**DoD FEV-8:**
- [ ] Subagent created with correct frontmatter
- [ ] 6 skills installed and referenced
- [ ] Huitzilopochtli catalog updated
- [ ] Delegation tables updated
- [ ] VALID_SUBAGENTS updated
- [ ] `bun test`: 0 fail, no regression
- [ ] `just check`: 0 errors

---

### FEV-9: MCP Server Integration (~5-7h)

**Item:** Issue #29

| ID | Description | File(s) | Effort |
|----|-------------|---------|--------|
| FEV9-T1 | Research installation procedure for 6 MCPs | Investigation | 1.5h |
| FEV9-T2 | Configure MCPs in opencode.json | `template/obligatorio/opencode.json` | 1h |
| FEV9-T3 | Document any manual pre-installation steps | Documentation | 1h |
| FEV9-T4 | Update MCP documentation (Wiki) | Wiki page | 1h |
| FEV9-T5 | Update `## KNOWLEDGE` section of 6 primary agents: replace `Context7` with chain MCP → Websearch → Question-tool | `template/obligatorio/agents/{huitzilopochtli,quetzalcoatl,moctezuma,tlaloc,mictlantecuhtli,tezcatlipoca}.md` | 30min |

**MCP servers to integrate:**

| # | MCP Server | Purpose |
|---|-----------|---------|
| 1 | Docfork | Documentation search |
| 2 | Rtfmbro | Documentation search |
| 3 | Tavily MCP | Web search |
| 4 | Firecrawl MCP | Web scraping/crawling |
| 5 | Vercel Grep | Code search |
| 6 | GitMCP | Git-based documentation |

**Knowledge Section Update (FEV9-T5):**

The 6 primary agents currently have a `## KNOWLEDGE` section ending with `Context7 → Web search`. Since the new MCPs perform similar work to Context7, **replace Context7** with the consultation chain:

```
AGENTS.md → SPEC.md → docs/ → skills/ → MCP de documentación/websearch → Websearch (built-in) → Question-tool
```

> **⚠️ LINE LIMIT CONSTRAINT:** The system prompt of each primary agent must NOT exceed **>150 lines total**, or **<100 lines of system prompt excluding YAML config** (YAML consumes ~30-50 lines). The FEV9-T5 change is a 1-line modification to the KNOWLEDGE section, so it stays within limits. If adding explanations approaches the limit, use a single-line chain instead of paragraphs.

**DoD FEV-9:**
- [ ] All 6 MCPs configured in opencode.json
- [ ] Manual steps documented
- [ ] Wiki updated
- [ ] FEV9-T5 resolved: 6 agents with `## KNOWLEDGE` section updated (Context7 → MCP → Websearch → Question-tool)
- [ ] Line limits respected: ≤150 total lines or ≤100 lines excluding YAML
- [ ] `bun test`: 0 fail, no regression
- [ ] `just check`: 0 errors

---

### FEV-10: Code Quality + Dependency Upgrades (~15h)

**Items:** TD-1.1 + TD-2.1 + TD-3.1 + TD-3.2 + TD-5.3

| ID | Description | File(s) | Effort |
|----|-------------|---------|--------|
| FEV10-T1 | Split IFileSystem → IFileSystem + IStagingSystem (ISP) | `src/application/ports/IFileSystem.ts`, new `IStagingSystem.ts`, `BunFileSystem.ts`, `AtomicStager.ts`, all use cases | 3h |
| FEV10-T2 | Add integration tests for main.ts (coverage 33% → 95%) | `tests/integration/cli/main.test.ts` (new) | 4h |
| FEV10-T3 | Add isolated integration test for npm packaging | `tests/integration/packaging/npm-pack.test.ts` (new) | 6h |
| FEV10-T4 | TypeScript 5.x → 6.x upgrade | `package.json`, fix any type errors | 2h |
| FEV10-T5 | Biome 1.x → 2.x update | `package.json`, `biome.json`, fix new lint errors | 30min |
| FEV10-T6 | Update TECH_DEBT.md — move resolved items | `docs/TECH_DEBT.md` | 30min |

**DoD FEV-10 (resultado):**
- [x] IFileSystem split: IFileSystem (6 methods) + IStagingSystem (4 methods) ✅
- [x] main.ts coverage: 86.21% lines (100% functions). 95% no alcanzable sin refactor mayor. 13 new integration tests. ✅
- [x] npm packaging test: 5 scenarios (A-E) con `bun pm pack` → install → verify ✅
- [x] TypeScript 6.0.3: `tsc --noEmit` passes ✅
- [x] Biome 2.x: `just check` passes (0 errors, 1 pre-existing info) ✅
- [x] TECH_DEBT.md updated ✅
- [x] `bun test`: 581 pass, 0 fail (1245 expects) ✅
- [x] `just check`: 0 errors ✅
- [x] Coverage: 98.89% functions / 96.98% lines (functions ✅, lines 0.52pp below target — aceptado, ver TECH_DEBT.md §1.1) ✅

---

## References

- [Issue #21 — Obsidian Vault Writer Subagent](https://github.com/fisherk2/codice-opencode/issues/21)
- [Issue #26 — Agent System Prompts](https://github.com/fisherk2/codice-opencode/issues/26)
- [Issue #27 — Primary Agent Step Counts](https://github.com/fisherk2/codice-opencode/issues/27)
- [Issue #28 — SECURITY.md](https://github.com/fisherk2/codice-opencode/issues/28)
- [Issue #29 — MCP Servers](https://github.com/fisherk2/codice-opencode/issues/29)
- [Issue #30 — Destructive Command Restrictions](https://github.com/fisherk2/codice-opencode/issues/30)
- [TECH_DEBT.md](../TECH_DEBT.md) — Current technical debt catalog
- [WORKFLOW.md](../WORKFLOW.md) — Implementation phases and progress

# Spec: Agent Pack System

**Spec ID:** S5-PACKS
**Status:** Draft
**Phase:** v2.0.0 — Agent Ecosystem Restructuring
**Depends on:** S2 (FileRules), S3 (CLI Commands), ADR-013 (Plugin Auto-Discovery)
**Author:** Fisherk2
**Date:** 2026-08-04
**Version:** 2.0.0

---

## 1. Objective

Restructure the agent ecosystem from a flat `agents/` directory into a **pack-based system** that allows users to select which categories of agents to install in their workspace. This solves the problem where non-software users receive 90+ irrelevant agent files, and where the flat directory no longer scales past ~300 agents.

### User Stories

- **US-P1 (Software Developer):** As a developer, I want the installer to select the software-development pack by default so that I get all relevant agents without manual configuration.
- **US-P2 (Business User):** As a product manager, I want to install only the business pack so that my workspace contains agents relevant to my work without software development noise.
- **US-P3 (Multi-Domain User):** As a fintech developer, I want to select both software-development and finance packs so that I get agents from both domains.
- **US-P4 (Template Maintainer):** As a maintainer adding new agents, I want a clear pack assignment so that users discover the agent through the correct category.

---

## 2. Template Directory Structure

The `template/obligatorio/` directory is restructured into `core/` (infrastructure files) and `packs/` (agent packs):

```
template/
├── obligatorio/
│   ├── core/                        # Renamed from current obligatorio root content
│   │   ├── .opencode/               # Plugin, opencode.json
│   │   ├── commands/                # CLI commands
│   │   ├── skills/                  # Skills
│   │   └── skills-lock.json
│   └── packs/                       # Agent packs
│       ├── main/                    # 6 primary agents (MANDATORY)
│       │   ├── huitzilopochtli.md
│       │   ├── quetzalcoatl.md
│       │   ├── moctezuma.md
│       │   ├── tlaloc.md
│       │   ├── mictlantecuhtli.md
│       │   └── tezcatlipoca.md
│       ├── writers/                 # Technical writers (MANDATORY)
│       │   ├── docs-writer.md
│       │   ├── obsidian-vault-writer.md
│       │   └── scientific-literature-researcher.md
│       ├── software-development/    # ~175 agents (DEFAULT)
│       ├── creative/                # ~15 agents
│       ├── business/                # ~47 agents
│       ├── finance/                 # ~11 agents
│       ├── government-legal/        # ~11 agents
│       ├── science-research/        # ~31 agents
│       ├── hardware-emerging/       # ~33 agents
│       └── operations-support/      # ~22 agents
├── estandar/                        # Unchanged
└── opcional/                        # Unchanged
```

### 2.1 Mandatory Directories

| Directory | Behavior | Rationale |
|-----------|----------|-----------|
| `packs/main/` | Always installed, always overwritten | 6 primary agents are the orchestration backbone — every workspace needs them |
| `packs/writers/` | Always installed, always overwritten | Documentation agents are cross-domain; every user writes docs |

### 2.2 Selectable Packs

| Pack ID | Description | Default | Approx. Count |
|---------|-------------|---------|---------------|
| `software-development` | Backend, frontend, mobile, DevOps, databases, APIs, CLI, cloud, AI/ML, security, testing, debugging | ✅ Selected | ~175 |
| `creative` | Design, UI/UX, visual arts, frontend aesthetics, design systems | ❌ | ~15 |
| `business` | Marketing, sales, product management, competitive analysis, content strategy, project management | ❌ | ~47 |
| `finance` | Financial analysis, trading, accounting, fintech, bookkeeping, tax, investment | ❌ | ~11 |
| `government-legal` | Legal tech, compliance, government, regulatory, ESG/sustainability | ❌ | ~11 |
| `science-research` | Academic research, scientific literature, data science, GIS, healthcare research | ❌ | ~31 |
| `hardware-emerging` | IoT, embedded systems, blockchain, XR/spatial computing, game development, desktop apps | ❌ | ~33 |
| `operations-support` | Customer service, IT operations, infrastructure maintenance, HR, support, translation | ❌ | ~22 |

---

## 3. Agent Classification Results

### 3.1 Classification Summary

| Category | Count | Action |
|----------|-------|--------|
| **REDUNDANT** | 13 | Discarded — same name/purpose as existing agent |
| **IMPROVABLE** | 59 | Discarded — content merged into existing agents |
| **IDEAL** | ~345 | Added — unique purpose, assigned to pack |
| **Primary** | 6 | Placed in `packs/main/` (mandatory) |
| **Writers** | 3 | Placed in `packs/writers/` (mandatory) |

### 3.2 Pack Assignment — software-development (~175 agents)

All computing systems: backend, frontend, mobile, DevOps, databases, APIs, CLI, cloud, AI/ML, security, testing, debugging.

**Backend & APIs:** backend-developer, typescript-pro, python-pro, golang-pro, rust-engineer, java-architect, csharp-pro, php-developer, ruby-developer, scala-developer, kotlin-pro, swift-expert, elixir-developer, haskell-developer, clojure-developer, dart-developer, zig-developer, nim-developer, crystal-developer, v-developer, odin-developer, gleam-developer, roc-developer, carp-developer, fsharp-developer, r-developer, julia-developer, matlab-pro, fortran-developer, cobol-developer, assembly-developer, wasm-developer

**Frameworks:** fastapi-developer, django-developer, flask-developer, spring-boot-developer, rails-developer, laravel-developer, nextjs-developer, nuxt-developer, svelte-developer, astro-developer, remix-developer, solid-start-developer, express-developer, fastify-developer, hapi-developer, nestjs-developer, gin-developer, fiber-developer, echo-developer, actix-developer, axum-developer, rocket-developer, warp-developer

**Frontend & Mobile:** frontend-developer, react-specialist, vue-expert, angular-architect, ember-developer, jquery-specialist, tailwind-expert, css-architect, html-specialist, javascript-pro, web-components-developer, pwa-developer, flutter-expert, react-native-developer, ionic-developer, capacitor-developer, expo-developer, maui-developer, electron-developer, tauri-developer

**Database & Data:** postgres-pro, sql-pro, mysql-pro, mongodb-pro, redis-pro, cassandra-developer, neo4j-developer, elasticsearch-pro, dynamodb-developer, cockroachdb-developer, supabase-developer, firebase-developer, prisma-developer, drizzle-developer, typeorm-developer, sequelize-developer, data-analyst, data-engineer, data-scientist, database-optimizer, etl-developer, analytics-engineer

**DevOps & Cloud:** docker-expert, kubernetes-specialist, terraform-engineer, devops-engineer, sre-engineer, cloud-architect, platform-engineer, aws-architect, gcp-architect, azure-architect, ci-cd-engineer, ansible-automation, puppet-engineer, chef-automation, pulumi-developer, crossplane-developer, argocd-engineer, helm-developer, istio-specialist, linkerd-developer, envoy-developer, nginx-architect, haproxy-developer, linux-admin, windows-admin, network-engineer, dns-admin, load-balancer-architect, monitoring-engineer, log-management, prometheus-developer, grafana-developer, datadog-developer, new-relic-developer, pagerduty-developer, opsgenie-developer

**AI/ML:** ai-engineer, llm-architect, mlops-engineer, machine-learning-engineer, nlp-engineer, prompt-engineer, computer-vision-engineer, deep-learning-engineer, reinforcement-learning, generative-ai-engineer, rag-engineer, langchain-developer, huggingface-developer, pytorch-developer, tensorflow-developer, jax-developer, onnx-developer, openvino-developer, triton-developer, mlflow-developer, kubeflow-developer, wandb-developer

**Security:** security-auditor, dependency-manager, legal-advisor, penetration-tester, appsec-engineer, cryptographer, compliance-analyst, threat-modeler, soc-analyst, incident-responder-security, forensics-analyst, red-team-operator, bug-bounty-hunter, security-architect, zero-trust-architect

**Testing & QA:** test-engineer, code-reviewer, accessibility-tester, chaos-engineer, web-performance-auditor, qa-automation, performance-tester, load-tester, api-tester, e2e-tester, mutation-tester, fuzz-tester, contract-tester, visual-regression-tester

**DX & Tooling:** cli-developer, tooling-engineer, mcp-developer, dx-optimizer, context-manager, debugger, profiler, linter-developer, formatter-developer, ide-developer, editor-config-developer, build-system-engineer, package-manager-developer, monorepo-architect, dependency-curator

**Architecture & Patterns:** software-architect, microservices-architect, event-driven-architect, domain-driven-design, clean-architect, hexagonal-architect, cqrs-developer, api-designer, graphql-architect, grpc-developer, rest-api-designer, websocket-developer, message-queue-architect, system-designer, distributed-systems

### 3.3 Pack Assignment — creative (~15 agents)

designer, ui-designer, ux-designer, ux-researcher, visual-designer, brand-designer, motion-designer, illustrator, icon-designer, typography-specialist, color-theorist, design-systems-architect, figma-developer, sketch-developer, creative-director

### 3.4 Pack Assignment — business (~47 agents)

product-manager, business-analyst, competitive-analyst, content-marketer, seo-specialist, growth-hacker, marketing-strategist, social-media-manager, email-marketer, copywriter, technical-writer-business, sales-engineer, sales-ops-analyst, account-executive, business-development, partnership-manager, customer-success, retention-specialist, revenue-ops, pricing-strategist, market-researcher, brand-strategist, communications-manager, public-relations, event-planner, community-manager, influencer-manager, affiliate-manager, crm-administrator, hubspot-admin, salesforce-admin, project-manager, scrum-master, agile-coach, product-owner, program-manager, portfolio-manager, strategy-consultant, management-consultant, operations-manager, supply-chain-analyst, logistics-coordinator, procurement-analyst, quality-manager, lean-six-sigma, change-management, executive-coach

### 3.5 Pack Assignment — finance (~11 agents)

fintech-engineer, payment-integration, financial-analyst, accountant, bookkeeper, tax-specialist, investment-analyst, portfolio-manager-finance, risk-analyst, actuary, auditor-finance

### 3.6 Pack Assignment — government-legal (~11 agents)

legal-advisor-legal, compliance-officer, regulatory-analyst, contract-manager, ip-lawyer, privacy-officer, dpo-specialist, government-developer, policy-analyst, esg-analyst, sustainability-reporter

### 3.7 Pack Assignment — science-research (~31 agents)

research-scientist, research-analyst, knowledge-synthesizer, academic-writer, peer-reviewer, grant-writer, literature-reviewer, meta-analyst, statistician, biostatistician, epidemiologist, clinical-researcher, bioinformatician, genomics-researcher, proteomics-researcher, neuroscientist, pharmacologist, toxicologist, environmental-scientist, climate-scientist, geospatial-analyst, gis-developer, remote-sensing, oceanographer, astronomer, physicist, chemist, materials-scientist, biologist, ecologist, science-communicator

### 3.8 Pack Assignment — hardware-emerging (~33 agents)

iot-engineer, embedded-systems, firmware-engineer, rtos-developer, fpga-developer, pcb-designer, hardware-designer, circuit-designer, sensor-engineer, arduino-developer, raspberry-pi-developer, esp32-developer, stm32-developer, blockchain-developer, solidity-developer, web3-developer, defi-developer, smart-contract-auditor, token-economist, vr-developer, ar-developer, xr-developer, spatial-computing, unity-developer, unreal-developer, godot-developer, game-designer, game-developer, level-designer, game-economist, desktop-developer, native-app-developer, systems-programmer

### 3.9 Pack Assignment — operations-support (~22 agents)

customer-support, help-desk, technical-support, community-support, customer-success-ops, it-operations, sysadmin, network-ops, database-ops, cloud-ops, devops-support, release-manager, hr-specialist, recruiter, hr-business-partner, talent-acquisition, learning-development, translator, interpreter, localization-engineer, technical-translator, multilingual-support

---

## 4. Permission Unification

### 4.1 Current State

Four primary agents (quetzalcoatl, tlaloc, mictlantecuhtli, huitzilopochtli) use explicit `task:` allow-lists that must be manually updated when new agents are added.

### 4.2 Target State

| Agent | Current `task:` | New `task:` | Rationale |
|-------|-----------------|-------------|-----------|
| **huitzilopochtli** | Explicit allow-list | `"*": allow` + deny 5 primaries | Universal delegator — can reach any subagent |
| **quetzalcoatl** | Explicit allow-list | `"*": allow` + deny 5 primaries | Delegates to any specialist |
| **tlaloc** | Explicit allow-list | `"*": allow` + deny 5 primaries | Implements via any specialist |
| **mictlantecuhtli** | Explicit allow-list | `"*": allow` + deny 5 primaries | Reviews via any quality agent |
| **moctezuma** | `task: "*": deny` | **UNCHANGED** | Non-delegating by design — task breakdown only |
| **tezcatlipoca** | `task: "*": deny` | **UNCHANGED** | Non-delegating by design — pure analysis |

**Denied primaries (5 per agent, amended FEV-19 2026-08-05):** each delegating primary denies the 5 *other* primaries — e.g., huitzilopochtli denies `quetzalcoatl`, `tezcatlipoca`, `tlaloc`, `moctezuma`, `mictlantecuhtli`. Tezcatlipoca is included in every deny-list; no agent denies itself. Primary agents never delegate to each other (prevents infinite delegation loops).

### 4.3 Subagent Table Removal

| Agent File | Section to Remove | Reason |
|------------|-------------------|--------|
| `quetzalcoatl.md` | "AVAILABLE SUBAGENTS" | Redundant with `agents/` directory (auto-discovered) |
| `tlaloc.md` | "AVAILABLE SUBAGENTS" | Redundant with `agents/` directory (auto-discovered) |
| `mictlantecuhtli.md` | "AVAILABLE SUBAGENTS" | Redundant with `agents/` directory (auto-discovered) |
| `huitzilopochtli.md` | "AVAILABLE SUBAGENTS" | **REMOVED in FEV-19 (amended 2026-08-05)** — no primary agent keeps a subagent index |
| `moctezuma.md` | N/A (no such section) | No change needed |
| `tezcatlipoca.md` | N/A (no such section) | No change needed |

> **Amendment (FEV-19, 2026-08-05):** the original spec kept huitzilopochtli's catalog as the single canonical reference. Per user decision, no subagent index exists in any of the 6 primary agents — all reference the `agents/` directory instead.

---

## 5. Plugin Changes

### 5.1 Code Changes

| File | Change | Risk |
|------|--------|------|
| `validSubagents.ts` | Delete `VALID_SUBAGENTS` Set; keep `PRIMARY_AGENTS` constant | Low |
| `defaults.ts` | Remove `VALID_SUBAGENTS` references | Low |
| `sdd-pipeline.ts` | Change fallback from `DEFAULTS.VALID_SUBAGENTS` to `new Set(PRIMARY_AGENTS)` | Low |
| `sdd-pipeline.ts` | Update error message from "VALID_SUBAGENTS catalog" to "agents/ directory" | Low |
| `defaults.test.ts` | Update tests to remove VALID_SUBAGENTS assertions | Low |

### 5.2 Auto-Discovery Impact

The auto-discovery system (ADR-013) already scans `agents/` for subagent registration. With the pack system, agents are in `packs/<pack-name>/` subdirectories. The discovery function must be updated to recursively scan `packs/` subdirectories:

```
agents/ (or template/obligatorio/packs/)
├── main/           → discovered as primary agents
├── writers/        → discovered as subagents
├── software-development/ → discovered as subagents
└── ...
```

---

## 6. CONTRIBUTING.md Updates

### 6.1 "Add a New Agent" Section

| Step | Current | v2.0.0 |
|------|---------|--------|
| 1 | Create `agents/<agent-name>.md` | Create `template/obligatorio/packs/<pack>/<agent-name>.md` |
| 2 | Update Wiki Agents page | Update Wiki Agents page (unchanged) |
| 3 | Update delegation tables of primary agents | **REMOVE** — unified `task: "*": allow` makes this unnecessary |
| 4 | Update huitzilopochtli's catalog | **REMOVE** — no primary agent keeps a subagent index (amended FEV-19, 2026-08-05) |
| 5 | Restart OpenCode session | Restart OpenCode session (unchanged) |

> **Result (FEV-19):** "Add a New Agent" is now 3 steps (create file → update Wiki → restart). No delegation tables, no catalog updates.

**Primary agent requirements:** Remove "persona table updates" — no longer needed with unified permissions.

---

## 7. Wiki Agents.md Updates

| Section | Change |
|---------|--------|
| "Step 4: Update Delegation Tables" | **REMOVE** — unified permissions make this unnecessary |
| Permission model examples | Update to show `task: "*": allow` + deny-list pattern |
| Primary agent table | Update permission model column |
| Agent count | Update from "104 agents" to "~355 agents in 10 packs" (implemented in FEV-19) |

---

## 8. Boundaries

### Always

- **Every agent must belong to exactly one pack.** No agent exists outside a pack (except main/ and writers/ which are mandatory).
- **Pack assignment must be purpose-based.** An agent's pack is determined by its primary domain, not by secondary capabilities.
- **Primary agents are always installed.** The 6 primary agents in `packs/main/` are non-negotiable.
- **Writer agents are always installed.** The 3 writers in `packs/writers/` are cross-domain essentials.

### Ask First

- **Moving an agent between packs.** If reclassification is needed, document the rationale in the PR.
- **Adding a new pack.** Requires a spec update and ADR. Packs are not created lightly.

### Never

- **Never install agents outside the pack system.** All agents must be in a named pack directory.
- **Never allow pack deselection to remove mandatory agents.** `main/` and `writers/` are always present.
- **Never create circular pack dependencies.** Packs are independent categories.

---

## 9. Success Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| SC-P1 | All agents are assigned to exactly one pack | Automated validation script |
| SC-P2 | `main/` and `writers/` are always installed regardless of pack selection | E2E test |
| SC-P3 | `software-development` is selected by default in installer | E2E test |
| SC-P4 | Minimum 1 pack must be selected | Unit test of validation logic |
| SC-P5 | 4 primary agents have unified `task: "*": allow` permissions | Grep validation |
| SC-P6 | No "AVAILABLE SUBAGENTS" sections in any of the 6 primary agents (amended FEV-19 — huitzilopochtli included) | Grep validation |
| SC-P7 | `VALID_SUBAGENTS` Set removed from plugin code | Grep validation |
| SC-P8 | Auto-discovery recursively scans `packs/` subdirectories | Integration test |
| SC-P9 | CONTRIBUTING.md reflects new agent creation workflow | Manual review |
| SC-P10 | Wiki Agents.md reflects new pack structure | Manual review |

---

## 10. Open Questions

1. **Pack overlap:** Should an agent be allowed in multiple packs? Current decision: no, single assignment only.
2. **Custom packs:** Should users be able to create custom packs? Deferred to v2.1.0.
3. **Pack size limits:** Should there be a maximum number of agents per pack? No limit for v2.0.0.
4. **Agent reclassification:** What is the process for moving an agent between packs? PR with rationale, same as any template change.

---

## 11. Related Specifications

- [spec-file-rules.md](./spec-file-rules.md) — File classification system (Obligatorio/Estándar/Opcional)
- [spec-cli-commands.md](./spec-cli-commands.md) — CLI commands and installation modes
- [ADR-013](./adr/adr-013-plugin-auto-discovery.md) — SDD Plugin Auto-Discovery
- [ADR-014](./adr/adr-014-agent-pack-system.md) — Agent Pack System decision record

---

## 12. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-08-04 | Initial specification. Pack-based agent system, permission unification, subagent table removal, plugin changes. |

---

*End of Spec: Agent Pack System*

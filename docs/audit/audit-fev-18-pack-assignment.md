# FEV-18 Audit — Pack Assignment

**Date:** 2026-08-04
**Author:** Moctezuma (Strategic Planner)
**Sources:** `agency-agents-main/` (267) + `template/obligatorio/packs/sin-clasificar/` (95)
**Method:** Source-category defaults (S5-PACKS §3) + purpose-based overrides for
`engineering/` and `specialized/` (agent descriptions reviewed 2026-08-04).

**Decisions:**
- 10 REDUNDANT (name collision) → legacy v1.x wins, new source discarded.
- 85 legacy-only → distributed, v1.x format preserved (hybrid decision).
- 257 new-only → distributed, v2.0 format (YAML + COMPOSITION).
- `scientific-literature-researcher` (legacy) → moved from `writers/` to
  `science-research/` (user decision, 2026-08-04 — analysis agent, not writer).
- `technical-writer` (new, from engineering/) → `writers/` (documentation agent).

---

## 1. Pack Summary (target counts)

| Pack | New (257) | Legacy (95) | Total |
|------|-----------|-------------|-------|
| `main` | 0 | 0 | 0 |
| `writers` | 1 | 0 | 1 |
| `software-development` | 73 | 73 | 146 |
| `creative` | 9 | 1 | 10 |
| `business` | 82 | 10 | 92 |
| `finance` | 9 | 2 | 11 |
| `government-legal` | 7 | 1 | 8 |
| `science-research` | 26 | 4 | 30 |
| `hardware-emerging` | 32 | 4 | 36 |
| `operations-support` | 18 | 0 | 18 |
| **Total** | **257** | **95** | **352** |

## Pack: `main`

| Source | Agent | Format |
|--------|-------|--------|

## Pack: `writers`

| Source | Agent | Format |
|--------|-------|--------|
| new | `technical-writer` | v2.0 |

## Pack: `software-development`

| Source | Agent | Format |
|--------|-------|--------|
| new | `ai-data-remediation-engineer` | v2.0 |
| new | `api-platform-engineer` | v2.0 |
| new | `autonomous-optimization-architect` | v2.0 |
| new | `backend-architect` | v2.0 |
| new | `cms-developer` | v2.0 |
| new | `codebase-onboarding-engineer` | v2.0 |
| new | `data-visualization-engineer` | v2.0 |
| new | `database-reliability-engineer` | v2.0 |
| new | `developer-tooling-engineer` | v2.0 |
| new | `devops-automator` | v2.0 |
| new | `drupal-performance` | v2.0 |
| new | `drupal-shopping-cart` | v2.0 |
| new | `email-intelligence-engineer` | v2.0 |
| new | `feishu-integration-developer` | v2.0 |
| new | `filament-optimization-specialist` | v2.0 |
| new | `finops-engineer` | v2.0 |
| new | `gaussdb-expert` | v2.0 |
| new | `git-workflow-master` | v2.0 |
| new | `i18n-engineer` | v2.0 |
| new | `identity-access-engineer` | v2.0 |
| new | `incident-response-commander` | v2.0 |
| new | `llm-post-training-engineer` | v2.0 |
| new | `minimal-change-engineer` | v2.0 |
| new | `mobile-app-builder` | v2.0 |
| new | `mobile-release-engineer` | v2.0 |
| new | `multi-agent-systems-architect` | v2.0 |
| new | `orgscript-engineer` | v2.0 |
| new | `privacy-engineer` | v2.0 |
| new | `rag-pipeline-engineer` | v2.0 |
| new | `rapid-prototyper` | v2.0 |
| new | `realtime-collaboration-engineer` | v2.0 |
| new | `rust-refactoring-specialist` | v2.0 |
| new | `search-relevance-engineer` | v2.0 |
| new | `section-508-specialist` | v2.0 |
| new | `senior-developer` | v2.0 |
| new | `software-architect` | v2.0 |
| new | `uswds-developer` | v2.0 |
| new | `video-streaming-engineer` | v2.0 |
| new | `voice-ai-integration-engineer` | v2.0 |
| new | `webassembly-engineer` | v2.0 |
| new | `wechat-mini-program-developer` | v2.0 |
| new | `wordpress-performance` | v2.0 |
| new | `wordpress-shopping-cart` | v2.0 |
| new | `ai-generated-code-auditor` | v2.0 |
| new | `appsec-engineer` | v2.0 |
| new | `blockchain-security-auditor` | v2.0 |
| new | `cloud-security-architect` | v2.0 |
| new | `penetration-tester` | v2.0 |
| new | `secrets-credential-engineer` | v2.0 |
| new | `security-architect` | v2.0 |
| new | `security-compliance-auditor` | v2.0 |
| new | `security-incident-responder` | v2.0 |
| new | `security-threat-detection-engineer` | v2.0 |
| new | `security-threat-intelligence-analyst` | v2.0 |
| new | `senior-secops` | v2.0 |
| new | `agentic-identity-trust` | v2.0 |
| new | `agents-orchestrator` | v2.0 |
| new | `codebase-archaeologist` | v2.0 |
| new | `identity-graph-operator` | v2.0 |
| new | `lsp-index-engineer` | v2.0 |
| new | `mcp-builder` | v2.0 |
| new | `model-qa` | v2.0 |
| new | `salesforce-architect` | v2.0 |
| new | `workflow-architect` | v2.0 |
| new | `accessibility-auditor` | v2.0 |
| new | `api-tester` | v2.0 |
| new | `performance-benchmarker` | v2.0 |
| new | `test-automation-engineer` | v2.0 |
| new | `test-results-analyzer` | v2.0 |
| new | `testing-evidence-collector` | v2.0 |
| new | `testing-reality-checker` | v2.0 |
| new | `tool-evaluator` | v2.0 |
| new | `workflow-optimizer` | v2.0 |
| legacy | `accessibility-tester` | v1.x |
| legacy | `ai-engineer` | v1.x |
| legacy | `angular-architect` | v1.x |
| legacy | `azure-infra-engineer` | v1.x |
| legacy | `backend-developer` | v1.x |
| legacy | `build-engineer` | v1.x |
| legacy | `chaos-engineer` | v1.x |
| legacy | `cli-developer` | v1.x |
| legacy | `cloud-architect` | v1.x |
| legacy | `code-reviewer` | v1.x |
| legacy | `context-manager` | v1.x |
| legacy | `cpp-pro` | v1.x |
| legacy | `csharp-developer` | v1.x |
| legacy | `data-analyst` | v1.x |
| legacy | `database-administrator` | v1.x |
| legacy | `database-optimizer` | v1.x |
| legacy | `data-engineer` | v1.x |
| legacy | `data-scientist` | v1.x |
| legacy | `debugger` | v1.x |
| legacy | `dependency-manager` | v1.x |
| legacy | `deployment-engineer` | v1.x |
| legacy | `devops-engineer` | v1.x |
| legacy | `django-developer` | v1.x |
| legacy | `docker-expert` | v1.x |
| legacy | `dx-optimizer` | v1.x |
| legacy | `elixir-expert` | v1.x |
| legacy | `error-coordinator` | v1.x |
| legacy | `error-detective` | v1.x |
| legacy | `fastapi-developer` | v1.x |
| legacy | `flutter-expert` | v1.x |
| legacy | `frontend-developer` | v1.x |
| legacy | `fullstack-developer` | v1.x |
| legacy | `git-workflow-manager` | v1.x |
| legacy | `golang-pro` | v1.x |
| legacy | `graphql-architect` | v1.x |
| legacy | `incident-responder` | v1.x |
| legacy | `java-architect` | v1.x |
| legacy | `javascript-pro` | v1.x |
| legacy | `kotlin-specialist` | v1.x |
| legacy | `kubernetes-specialist` | v1.x |
| legacy | `laravel-specialist` | v1.x |
| legacy | `legacy-modernizer` | v1.x |
| legacy | `llm-architect` | v1.x |
| legacy | `machine-learning-engineer` | v1.x |
| legacy | `mcp-developer` | v1.x |
| legacy | `microservices-architect` | v1.x |
| legacy | `mlops-engineer` | v1.x |
| legacy | `mobile-app-developer` | v1.x |
| legacy | `mobile-developer` | v1.x |
| legacy | `network-engineer` | v1.x |
| legacy | `nextjs-developer` | v1.x |
| legacy | `nlp-engineer` | v1.x |
| legacy | `php-pro` | v1.x |
| legacy | `platform-engineer` | v1.x |
| legacy | `postgres-pro` | v1.x |
| legacy | `prompt-engineer` | v1.x |
| legacy | `python-pro` | v1.x |
| legacy | `react-specialist` | v1.x |
| legacy | `refactorer` | v1.x |
| legacy | `ruby-pro` | v1.x |
| legacy | `rust-engineer` | v1.x |
| legacy | `security-auditor` | v1.x |
| legacy | `spring-boot-engineer` | v1.x |
| legacy | `sql-pro` | v1.x |
| legacy | `sre-engineer` | v1.x |
| legacy | `swift-expert` | v1.x |
| legacy | `terraform-engineer` | v1.x |
| legacy | `test-engineer` | v1.x |
| legacy | `tooling-engineer` | v1.x |
| legacy | `typescript-pro` | v1.x |
| legacy | `vue-expert` | v1.x |
| legacy | `web-performance-auditor` | v1.x |
| legacy | `websocket-engineer` | v1.x |

## Pack: `creative`

| Source | Agent | Format |
|--------|-------|--------|
| new | `design-brand-guardian` | v2.0 |
| new | `design-image-prompt-engineer` | v2.0 |
| new | `design-inclusive-visuals-specialist` | v2.0 |
| new | `design-persona-walkthrough` | v2.0 |
| new | `design-visual-storyteller` | v2.0 |
| new | `design-whimsy-injector` | v2.0 |
| new | `ui-designer` | v2.0 |
| new | `ui-finish-gate-reviewer` | v2.0 |
| new | `ux-architect` | v2.0 |
| legacy | `ux-researcher` | v1.x |

## Pack: `business`

| Source | Agent | Format |
|--------|-------|--------|
| new | `marketing-aeo-foundations` | v2.0 |
| new | `marketing-agentic-search-optimizer` | v2.0 |
| new | `marketing-ai-citation-strategist` | v2.0 |
| new | `marketing-app-store-optimizer` | v2.0 |
| new | `marketing-baidu-seo-specialist` | v2.0 |
| new | `marketing-bilibili-content-strategist` | v2.0 |
| new | `marketing-book-co-author` | v2.0 |
| new | `marketing-carousel-growth-engine` | v2.0 |
| new | `marketing-china-ecommerce-operator` | v2.0 |
| new | `marketing-china-market-localization-strategist` | v2.0 |
| new | `marketing-content-creator` | v2.0 |
| new | `marketing-cross-border-ecommerce` | v2.0 |
| new | `marketing-douyin-strategist` | v2.0 |
| new | `marketing-email-strategist` | v2.0 |
| new | `marketing-global-podcast-strategist` | v2.0 |
| new | `marketing-growth-hacker` | v2.0 |
| new | `marketing-instagram-curator` | v2.0 |
| new | `marketing-kuaishou-strategist` | v2.0 |
| new | `marketing-linkedin-content-creator` | v2.0 |
| new | `marketing-livestream-commerce-coach` | v2.0 |
| new | `marketing-multi-platform-publisher` | v2.0 |
| new | `marketing-podcast-strategist` | v2.0 |
| new | `marketing-pr-communications-manager` | v2.0 |
| new | `marketing-private-domain-operator` | v2.0 |
| new | `marketing-reddit-community-builder` | v2.0 |
| new | `marketing-seo-specialist` | v2.0 |
| new | `marketing-short-video-editing-coach` | v2.0 |
| new | `marketing-social-media-strategist` | v2.0 |
| new | `marketing-tiktok-strategist` | v2.0 |
| new | `marketing-twitter-engager` | v2.0 |
| new | `marketing-video-optimization-specialist` | v2.0 |
| new | `marketing-wechat-official-account` | v2.0 |
| new | `marketing-weibo-strategist` | v2.0 |
| new | `marketing-x-twitter-intelligence-analyst` | v2.0 |
| new | `marketing-xiaohongshu-specialist` | v2.0 |
| new | `marketing-zhihu-strategist` | v2.0 |
| new | `paid-media-auditor` | v2.0 |
| new | `paid-media-creative-strategist` | v2.0 |
| new | `paid-media-paid-social-strategist` | v2.0 |
| new | `paid-media-ppc-strategist` | v2.0 |
| new | `paid-media-programmatic-buyer` | v2.0 |
| new | `paid-media-search-query-analyst` | v2.0 |
| new | `paid-media-tracking-specialist` | v2.0 |
| new | `product-behavioral-nudge-engine` | v2.0 |
| new | `product-feedback-synthesizer` | v2.0 |
| new | `product-sprint-prioritizer` | v2.0 |
| new | `product-trend-researcher` | v2.0 |
| new | `project-management-experiment-tracker` | v2.0 |
| new | `project-management-jira-workflow-steward` | v2.0 |
| new | `project-management-meeting-notes-specialist` | v2.0 |
| new | `project-management-project-shepherd` | v2.0 |
| new | `project-management-studio-operations` | v2.0 |
| new | `project-management-studio-producer` | v2.0 |
| new | `project-manager-senior` | v2.0 |
| new | `sales-account-strategist` | v2.0 |
| new | `sales-coach` | v2.0 |
| new | `sales-deal-strategist` | v2.0 |
| new | `sales-discovery-coach` | v2.0 |
| new | `sales-offer-lead-gen-strategist` | v2.0 |
| new | `sales-outbound-strategist` | v2.0 |
| new | `sales-pipeline-analyst` | v2.0 |
| new | `sales-proposal-strategist` | v2.0 |
| new | `business-strategist` | v2.0 |
| new | `change-management-consultant` | v2.0 |
| new | `chief-of-staff` | v2.0 |
| new | `cultural-intelligence-strategist` | v2.0 |
| new | `customer-success-manager` | v2.0 |
| new | `data-consolidation-agent` | v2.0 |
| new | `developer-advocate` | v2.0 |
| new | `document-generator` | v2.0 | ⚠️ MOVIDO a `writers/` (2026-08-05) |
| new | `healthcare-marketing-compliance` | v2.0 |
| new | `ma-integration-manager` | v2.0 |
| new | `operations-manager` | v2.0 |
| new | `organizational-psychologist` | v2.0 |
| new | `personal-growth-mentor` | v2.0 |
| new | `pricing-analyst` | v2.0 |
| new | `real-estate-buyer-seller` | v2.0 |
| new | `report-distribution-agent` | v2.0 |
| new | `sales-data-extraction-agent` | v2.0 |
| new | `sales-outreach` | v2.0 |
| new | `strategy-duel-agent` | v2.0 |
| new | `supply-chain-strategist` | v2.0 |
| legacy | `business-analyst` | v1.x |
| legacy | `competitive-analyst` | v1.x |
| legacy | `content-marketer` | v1.x |
| legacy | `market-researcher` | v1.x |
| legacy | `product-manager` | v1.x |
| legacy | `project-manager` | v1.x |
| legacy | `sales-engineer` | v1.x |
| legacy | `scrum-master` | v1.x |
| legacy | `seo-specialist` | v1.x |
| legacy | `trend-analyst` | v1.x |

## Pack: `finance`

| Source | Agent | Format |
|--------|-------|--------|
| new | `payments-billing-engineer` | v2.0 |
| new | `finance-bookkeeper-controller` | v2.0 |
| new | `finance-fpa-analyst` | v2.0 |
| new | `finance-investment-researcher` | v2.0 |
| new | `finance-tax-strategist` | v2.0 |
| new | `financial-analyst` | v2.0 |
| new | `accounts-payable-agent` | v2.0 |
| new | `chief-financial-officer` | v2.0 |
| new | `loan-officer-assistant` | v2.0 |
| legacy | `fintech-engineer` | v1.x |
| legacy | `payment-integration` | v1.x |

## Pack: `government-legal`

| Source | Agent | Format |
|--------|-------|--------|
| new | `data-privacy-officer` | v2.0 |
| new | `esg-sustainability-officer` | v2.0 |
| new | `fedramp-rmf-compliance` | v2.0 |
| new | `government-digital-presales-consultant` | v2.0 |
| new | `legal-billing-time-tracking` | v2.0 |
| new | `legal-client-intake` | v2.0 |
| new | `legal-document-review` | v2.0 |
| legacy | `legal-advisor` | v1.x |

## Pack: `science-research`

| Source | Agent | Format |
|--------|-------|--------|
| new | `anthropologist` | v2.0 |
| new | `geographer` | v2.0 |
| new | `historian` | v2.0 |
| new | `narratologist` | v2.0 |
| new | `psychologist` | v2.0 |
| new | `statistician` | v2.0 |
| new | `gis-3d-scene-developer` | v2.0 |
| new | `gis-analyst` | v2.0 |
| new | `gis-bim-specialist` | v2.0 |
| new | `gis-cartography-designer` | v2.0 |
| new | `gis-drone-reality-mapping` | v2.0 |
| new | `gis-geoai-ml-engineer` | v2.0 |
| new | `gis-geoprocessing-specialist` | v2.0 |
| new | `gis-qa-engineer` | v2.0 |
| new | `gis-solution-engineer` | v2.0 |
| new | `gis-spatial-data-engineer` | v2.0 |
| new | `gis-spatial-data-scientist` | v2.0 |
| new | `gis-technical-consultant` | v2.0 |
| new | `gis-web-gis-developer` | v2.0 |
| new | `healthcare-clinical-evidence-agent` | v2.0 |
| new | `healthcare-innovation-strategist` | v2.0 |
| new | `healthcare-sovereign-health-systems-agent` | v2.0 |
| new | `grant-writer` | v2.0 |
| new | `healthcare-aging-parent-care-companion` | v2.0 |
| new | `medical-billing-coding-specialist` | v2.0 |
| new | `zk-steward` | v2.0 |
| legacy | `data-researcher` | v1.x |
| legacy | `knowledge-synthesizer` | v1.x |
| legacy | `research-analyst` | v1.x |
| legacy | `search-specialist` | v1.x |

## Pack: `hardware-emerging`

| Source | Agent | Format |
|--------|-------|--------|
| new | `desktop-app-engineer` | v2.0 |
| new | `embedded-firmware-engineer` | v2.0 |
| new | `iot-fleet-engineer` | v2.0 |
| new | `solidity-smart-contract-engineer` | v2.0 |
| new | `blender-addon-engineer` | v2.0 |
| new | `game-audio-engineer` | v2.0 |
| new | `game-designer` | v2.0 |
| new | `game-economy-designer` | v2.0 |
| new | `game-level-designer` | v2.0 |
| new | `game-narrative-designer` | v2.0 |
| new | `game-technical-artist` | v2.0 |
| new | `godot-gameplay-scripter` | v2.0 |
| new | `godot-multiplayer-engineer` | v2.0 |
| new | `godot-shader-developer` | v2.0 |
| new | `roblox-avatar-creator` | v2.0 |
| new | `roblox-experience-designer` | v2.0 |
| new | `roblox-systems-scripter` | v2.0 |
| new | `unity-architect` | v2.0 |
| new | `unity-editor-tool-developer` | v2.0 |
| new | `unity-multiplayer-engineer` | v2.0 |
| new | `unity-shader-graph-artist` | v2.0 |
| new | `unreal-multiplayer-architect` | v2.0 |
| new | `unreal-systems-engineer` | v2.0 |
| new | `unreal-technical-artist` | v2.0 |
| new | `unreal-world-builder` | v2.0 |
| new | `macos-spatial-metal-engineer` | v2.0 |
| new | `terminal-integration-specialist` | v2.0 |
| new | `visionos-spatial-engineer` | v2.0 |
| new | `xr-cockpit-interaction-specialist` | v2.0 |
| new | `xr-immersive-developer` | v2.0 |
| new | `xr-interface-architect` | v2.0 |
| new | `civil-engineer` | v2.0 |
| legacy | `blockchain-developer` | v1.x |
| legacy | `embedded-systems` | v1.x |
| legacy | `game-developer` | v1.x |
| legacy | `iot-engineer` | v1.x |

## Pack: `operations-support`

| Source | Agent | Format |
|--------|-------|--------|
| new | `it-service-manager` | v2.0 |
| new | `automation-governance-architect` | v2.0 |
| new | `corporate-training-designer` | v2.0 |
| new | `customer-service` | v2.0 |
| new | `healthcare-customer-service` | v2.0 |
| new | `hospitality-guest-services` | v2.0 |
| new | `hr-onboarding` | v2.0 |
| new | `language-translator` | v2.0 |
| new | `recruitment-specialist` | v2.0 |
| new | `resume-tailor` | v2.0 |
| new | `retail-customer-returns` | v2.0 |
| new | `study-abroad-advisor` | v2.0 |
| new | `analytics-reporter` | v2.0 |
| new | `executive-summary-generator` | v2.0 |
| new | `finance-tracker` | v2.0 |
| new | `infrastructure-maintainer` | v2.0 |
| new | `legal-compliance-checker` | v2.0 |
| new | `support-responder` | v2.0 |

---

*Generated by Moctezuma (FEV-18 Phase 0 — Task 0.3)*

# Spec: Template

**Scope:** the OpenCode workspace template shipped inside the npm package (`template/`). This spec fixes the payload's directory structure and naming conventions. File *classification semantics* (Obligatorio/Estándar/Opcional copy behavior) are normative in [spec-file-rules.md](./spec-file-rules.md) — not duplicated here.

## 1. Payload Structure

```
template/
├── obligatorio/                     # Always copied; overwrites existing (Obligatorio category)
│   ├── core/
│   │   ├── opencode.json            # Single workspace config (V2 schema)
│   │   ├── commands/                # 18 slash commands, one <name>.md each
│   │   ├── skills/                  # 61 skills: skills/<skill-name>/SKILL.md
│   │   │   └── */references/        # Extended refs co-located with the skill (ADR-012)
│   │   └── .opencode/               # NOT shipped: agents/commands/skills symlinks are
│   │                                # generated post-install by BunSymlinkCreator (ADR-008)
│   └── packs/                       # Agent packs (mandatory main + writers, 8 selectable)
│       ├── main/                    # 6 primary agents (huitzilopochtli, mictlantecuhtli,
│       │                            #   moctezuma, quetzalcoatl, tezcatlipoca, tlaloc)
│       ├── writers/                 # 4 writer agents (docs-writer, document-generator,
│       │                            #   obsidian-vault-writer, technical-writer)
│       └── <pack-id>/              # One directory per selectable pack (see §2)
├── estandar/                        # Copied only if missing in destination
│   ├── AGENTS.md · CHANGELOG.md · CODE_OF_CONDUCT.md · CONTRIBUTING.md · LICENSE
│   ├── README.md · SPEC.md · .env.example
│   ├── gitignore                    # Stored WITHOUT the dot: npm strips .gitignore from
│   │                                #   tarballs; BunGitignoreCreator generates the real
│   │                                #   .gitignore post-install (ADR-009)
│   └── docs/ · specs/ · tasks/      # Scaffold directories (docs/adr/ includes ADR-template)
└── opcional/                        # Checklist; copied only if selected AND missing
    ├── Justfile · Makefile · Dockerfile · docker-compose.yml
    ├── package.json · pyproject.toml · Cargo.toml
    └── scripts/ · docs/DESIGN.md · docs/SCHEMA.md · specs/design/
```

Agent totals: 6 main + 4 writers + 349 selectable = **359** `.md` files under `packs/`.

## 2. Pack Directories

Pack directory names are the canonical pack IDs (`kebab-case`) and must match the manifest
`packRule()` paths `packs/<id>` in `src/domain/entities/FileRuleManifestData.ts` verbatim.
Counts (145/90/36/31/18/11/10/8 for the 8 selectable packs) are pinned by
`tests/unit/domain/pack-agent-counts.test.ts`, which compares each manifest `agentCount`
against the filesystem **exactly** — a drifting count fails the build. Pack definitions and
selection UX: [spec-agent-packs.md](./spec-agent-packs.md).

## 3. opencode.json

`template/obligatorio/core/opencode.json` is the single workspace config installed at the
destination root. Its top-level schema (V2): `$schema`, `agents`, `compaction`,
`default_agent`, `formatter`, `instructions`, `mcp`, `model`, `permissions`, `plugins`,
`references`. Enforcement of destructive commands lives exclusively in the
`permissions.bash` deny-lists — plugin-era enforcement was removed in FEV-30 (ADR-022).
`references` exposes the co-located `skills/*/references/` material (ADR-012);
`mcp.servers` uses the explicit-`disabled` schema with 3 active servers by default (ADR-024).

## 4. Naming Conventions

- **Agents:** `packs/<pack-id>/<agent-name>.md`; the filename must equal the frontmatter
  `name:` value. Format v2 (frontmatter schema, `permissions:` block):
  [spec-agent-format-v2.md](./spec-agent-format-v2.md).
- **Commands:** `core/commands/<verb>.md`; frontmatter carries `description:` and the
  `agent:` target — the real `agent:` values are the source of truth for the command table
  in [spec-commands.md](./spec-commands.md).
- **Skills:** `core/skills/<skill-name>/SKILL.md`, optional `references/*.md` alongside.
- **Line budget:** primary-agent and command **bodies** ≤ 180 lines (frontmatter excluded),
  per spec-agent-format-v2.md §8; guarded by
  `tests/unit/domain/{agent,command}-frontmatter-validation.test.ts`.

## 5. Adding Content to the Template

Follow CONTRIBUTING.md § Workspace Template (agent → `packs/<pack>/`, skill →
`core/skills/<name>/SKILL.md`, command → `core/commands/<name>.md`, MCP →
`core/opencode.json`). Every addition must keep the manifest
(`FileRuleManifestData.ts`), the count guards above, and the GitHub Wiki in sync;
classification of any new file follows spec-file-rules.md.

## 6. E2E Contract

The payload as installed is pinned by `tests/e2e/` (31 scenarios), including
`31-commands-v210-installed.sh` (all v2.1 commands reachable via the generated
`.opencode/commands` symlink) and `07/08/09` (symlink generation, idempotency).

---

*End of Spec: Template*

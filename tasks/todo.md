# TODO: Fase FEV-9 — MCP Server Integration (v1.1.0)

**Estado:** ✅ Completado — 5/5 tareas completadas
**Fecha:** 2026-07-10
**Issue principal:** #29
**Branch:** `feat/workspace-enhancement`

## Tareas

### ✅ T1: opencode.json — 5 new MCP entries
**Archivo:** `template/obligatorio/opencode.json`
**Commit:** `3f827e0`
- [x] JSON válido (jq check)
- [x] 9 MCPs total
- [x] 3 enabled: context7, vercel-grep, gitmcp
- [x] 5 nuevos: 2 enabled (vercel-grep, gitmcp), 3 disabled
- [x] Tavily y Firecrawl con headers API key
- [x] Sin regresión: 563/0 tests

### ✅ T2: Wiki — MCP-Servers.md
**Archivo:** `docs/wiki-source/MCP-Servers.md`
**Commit:** `33f3a85`
- [x] Tabla con 9 servidores
- [x] 5 nuevas secciones de activación (prerequisites, config, tools)
- [x] "Useful Servers" sin Grep by Vercel (ya pre-configurado)
- [x] Tabla Features actualizada con 10 filas
- [x] 608 líneas

### ✅ T3: context-engineering/SKILL.md
**Archivo:** `template/obligatorio/skills/context-engineering/SKILL.md`
**Commit:** `b99bfde`
- [x] Context7 → "Context7 + additional MCP servers"
- [x] Enlace a Wiki
- [x] Sin regresión: 563/0 tests

### ✅ T4: 6 agent KNOWLEDGE sections
**Archivos:** `template/obligatorio/agents/{6}.md`
**Commit:** `c64b9b5`
- [x] huitzilopochtli.md
- [x] quetzalcoatl.md
- [x] moctezuma.md
- [x] tlaloc.md
- [x] mictlantecuhtli.md
- [x] tezcatlipoca.md
- [x] Cada agente ≤150 líneas
- [x] Sin regresión: 563/0 tests

### ✅ T5: CHANGELOG.md
**Archivo:** `CHANGELOG.md`
**Commit:** `3d0cdd3`
- [x] Appendar entries a sección v1.1.0
- [x] package.json sin cambios

## Verificación Final
- [x] `jq '.mcp | keys | length'` → 9
- [x] `bun test tests/` → 563 pass, 0 fail
- [x] `rg "MCP servers" template/obligatorio/agents/*.md` → 6 matches
- [x] `git diff package.json` → 0 lines

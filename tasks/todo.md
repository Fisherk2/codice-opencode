# TODO: Fase FEV-9 — MCP Server Integration (v1.1.0)

**Estado:** 🔄 En implementación — 3/5 tareas completadas
**Fecha:** 2026-07-10
**Issue principal:** #29
**Branch:** `feat/workspace-enhancement`

## Tareas

### ✅ T1: opencode.json — 6 new MCP entries
**Archivo:** `template/obligatorio/opencode.json`
**Commit:** `3f827e0`
- [x] JSON válido (jq check)
- [x] 10 MCPs total
- [x] Solo context7 enabled: true
- [x] 6 nuevos `enabled: false`
- [x] Tavily y Firecrawl con headers API key
- [x] Sin regresión: 563/0 tests

### ✅ T2: Wiki — MCP-Servers.md
**Archivo:** `docs/wiki-source/MCP-Servers.md`
**Commit:** `33f3a85`
- [x] Tabla con 10 servidores
- [x] 6 nuevas secciones de activación (prerequisites, config, tools)
- [x] "Useful Servers" sin Grep by Vercel (ya pre-configurado)
- [x] Tabla Features actualizada con 11 filas
- [x] 597 líneas

### ✅ T3: context-engineering/SKILL.md
**Archivo:** `template/obligatorio/skills/context-engineering/SKILL.md`
**Commit:** `b99bfde`
- [x] Context7 → "Context7 + 6 additional MCP servers"
- [x] Enlace a Wiki
- [x] Sin regresión: 563/0 tests

### 🔄 T4: 6 agent KNOWLEDGE sections
**Archivos:** `template/obligatorio/agents/{6}.md`
- [ ] huitzilopochtli.md
- [ ] quetzalcoatl.md
- [ ] moctezuma.md
- [ ] tlaloc.md
- [ ] mictlantecuhtli.md
- [ ] tezcatlipoca.md
- [ ] Cada agente ≤150 líneas
- [ ] Sin regresión: 563/0 tests

### ⏳ T5: CHANGELOG.md
**Archivo:** `CHANGELOG.md`
- [ ] Appendar entries a sección v1.1.0
- [ ] package.json sin cambios

## Verificación Final
- [ ] `jq '.mcp | keys | length'` → 10
- [ ] `bun test tests/` → 563 pass, 0 fail
- [ ] `rg "MCP servers" template/obligatorio/agents/*.md` → 6 matches
- [ ] `git diff package.json` → 0 lines

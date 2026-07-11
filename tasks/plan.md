# Plan: Fase FEV-9 — MCP Server Integration (v1.1.0)

**Fecha:** 2026-07-10 | **Autor:** Moctezuma (Strategic Planner) | **Estado:** 🟢 En implementación
**Versión objetivo:** v1.1.0 (sin bump)
**Issue principal:** #29 (6 nuevos MCP servers + KNOWLEDGE chain actualizada)
**Branch:** `feat/workspace-enhancement`

## Resumen

Expandir el catálogo de MCP servers de 4 a 10 en el workspace template. Reemplazar **Docfork** (shut down 2026-06-14) con **Grounded Docs MCP Server** (`@arabold/docs-mcp-server`). Actualizar la sección `## KNOWLEDGE` de los 6 agentes primarios para referenciar la categoría "MCP servers".

### Restricciones

- **CONSERVAR + AÑADIR:** context7 se mantiene activo; 6 nuevos MCPs como `enabled: false`
- **REEMPLAZAR:** tasks/plan.md con contenido FEV-9 (sin archivar FEV-8)
- **Solo Wiki:** docs en `docs/wiki-source/MCP-Servers.md`; sin archivo en `template/`
- **Sin cambios en `src/`:** solo template + docs
- **≤150 líneas** por archivo de agente primario
- **package.json** se mantiene en v1.1.0 (sin bump)

---

## 6 Nuevos MCP Servers

| # | MCP | Key | Tipo | Comando/URL | API Key |
|---|-----|-----|------|-------------|---------|
| 1 | docs-mcp-server | Reemplaza Docfork | Local | `npx -y @arabold/docs-mcp-server` | No |
| 2 | tavily | Web search | Remote | `https://mcp.tavily.com/mcp` | TAVILY_API_KEY |
| 3 | firecrawl | Web scraping | Remote | `https://mcp.firecrawl.dev/v2/mcp` | FIRECRAWL_API_KEY |
| 4 | vercel-grep | Code search | Remote | `https://mcp.grep.app` | No |
| 5 | gitmcp | Repo docs | Remote | `https://gitmcp.io/docs` | No |

---

## Descomposición de Tareas

### T1: `opencode.json` — Añadir 5 nuevas entradas MCP
**Criterios:** JSON válido, 9 MCPs, 3 enabled (context7, vercel-grep, gitmcp).
**Archivo:** `template/obligatorio/opencode.json`
**Commit:** `feat(mcp): add 5 new MCP servers to opencode.json`

### T2: Wiki — Ampliar `MCP-Servers.md`
**Criterios:** Tabla con 9 servidores, 5 secciones de activación, tabla Features actualizada.
**Archivo:** `docs/wiki-source/MCP-Servers.md`
**Commit:** `docs(wiki): add 5 new MCP servers to MCP-Servers.md`

### T3: Skill — Actualizar `context-engineering/SKILL.md`
**Criterios:** Referencia a Context7 reemplazada por mención a 9 MCPs con enlace a Wiki.
**Archivo:** `template/obligatorio/skills/context-engineering/SKILL.md`
**Commit:** `docs(skills): update context-engineering skill`

### T4: Agents — Actualizar `## KNOWLEDGE` de 6 agentes primarios
**Criterios:** 6 archivos modificados, cada uno con 1 línea cambiada, ≤150 líneas totales.
**Archivos:** `template/obligatorio/agents/{huitzilopochtli,quetzalcoatl,moctezuma,tlaloc,mictlantecuhtli,tezcatlipoca}.md`
**Nueva cadena:**
```
AGENTS.md → SPEC.md → docs/ → skills/ → MCP servers → Web search → Question-tool
```
**Commit:** `feat(agents): update KNOWLEDGE chain in 6 primary agents`

### T5: CHANGELOG — Appendar entradas FEV-9
**Archivo:** `CHANGELOG.md`
**Commit:** `docs(changelog): append FEV-9 entries to v1.1.0`

---

## Orden de Ejecución y Dependencias

```
T1 (opencode.json)
 ↓ (sin dependencias)
T2 (Wiki MCP-Servers.md)
T3 (context-engineering/SKILL.md) ── pueden paralelizarse
 ↓
T4 (6 agentes) ── depende de T1, T2, T3
 ↓
T5 (CHANGELOG) ── depende de todo lo anterior
```

---

## Verificación Post-Implementación

| Check | Comando |
|-------|---------|
| JSON válido | `jq '.' template/obligatorio/opencode.json` |
| 9 MCPs | `jq '.mcp \| keys \| length' template/obligatorio/opencode.json` |
| 3 enabled (context7, vercel-grep, gitmcp) | `jq '[.mcp \| to_entries[] \| select(.value.enabled == true) \| .key]' template/obligatorio/opencode.json` |
| Tests sin regresión | `bun test tests/` (563 pass, 0 fail) |
| Agents actualizados | `rg "MCP servers" template/obligatorio/agents/*.md → 6 matches` |
| Sin cambios en package.json | `git diff package.json → 0 lines` |
| Wiki actualizado | `wc -l docs/wiki-source/MCP-Servers.md` (~597) |

---

## Progreso

| Tarea | Estado | Commit |
|-------|--------|--------|
| T1: opencode.json | ✅ Completo | `3f827e0` |
| T2: Wiki | ✅ Completo | `33f3a85` |
| T3: context-engineering | ✅ Completo | `b99bfde` |
| T4: 6 agentes KNOWLEDGE | ✅ Completo | `c64b9b5` |
| T5: CHANGELOG | ✅ Completo | `3d0cdd3` |

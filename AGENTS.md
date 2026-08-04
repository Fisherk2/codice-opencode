# AGENTS.MD – Códice: Opencode Workspace Installer

**Propósito:** Reglas estrictas que los agentes de IA deben seguir en este proyecto.
**Documentación detallada:** `docs/` y `specs/` (ver índice al final).

---

## 🎯 Contexto del Proyecto

**Códice** es un instalador/actualizador CLI compilado con Bun para desplegar plantillas de workspace de OpenCode de forma atómica y segura.

- **In-Scope:** Instalación/actualización del template, gestión de versiones local/remota.
- **Out-of-Scope:** Instalación de dependencias externas, modificación de archivos del usuario.

---

## ⚠️ Reglas Estrictas

### Arquitectura (Clean Architecture)
- **Dependencias siempre hacia adentro:** `infrastructure/` → `application/` → `domain/`.
- **Domain** no importa nada de `application/` ni `infrastructure/`.
- **Application** depende solo de `domain/` y define interfaces (ports).
- **Infrastructure** implementa los ports de `application/`.
- Errores del dominio se retornan como `Result<T, Error>`, nunca excepciones.

### TypeScript
- Strict mode. **No `any`.** Usar `unknown` con guards cuando sea necesario.
- Tipos explícitos en toda función/método público exportado.
- `readonly` en arrays y propiedades donde no se requiera mutación.

### Seguridad (Prohibiciones — Nunca hacer)
- ❌ Hardcodear rutas absolutas — usar `path.join()` o `path.resolve()`.
- ❌ Ejecutar código arbitrario del template (shell scripts, eval, binarios).
- ❌ Side-effects ocultos — funciones no modifican estado global sin ser explícitas.
- ❌ Acoplamiento temporal — no depender del orden de inicialización de módulos no relacionados.
- ❌ Ignorar errores — toda excepción se captura, mapea a dominio y propaga.
- ❌ Usar `any` — siempre tipar explícitamente.
- ❌ Duplicación de lógica (DRY) — extraer a funciones compartidas.
- ❌ Comentarios obvios — explicar el *porqué*, nunca el *qué*.
- ❌ Loggear secrets — ni tokens, ni credenciales, ni API keys.

### Pre-Commit
- [ ] `just check` — 0 errores (biome ci + tsc --noEmit).
- [ ] `bun test` — 0 fallos.
- [ ] Sin tipos `any` en código de producción.
- [ ] Documentación actualizada si cambió API pública.

---

## 📚 Índice de Documentación

| Archivo | Contenido |
|---------|-----------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagrama de componentes, capas, ADRs |
| [CODE_STYLE.md](docs/CODE_STYLE.md) | Convenciones de código, naming, TypeScript |
| [WORKFLOW.md](docs/WORKFLOW.md) | Plan de implementación por fases (FEV) |
| [PRD.md](docs/PRD.md) | Product Requirements Document |
| [TRD.md](docs/TRD.md) | Technical Requirements Document |
| [TECH_DEBT.md](docs/TECH_DEBT.md) | Deuda técnica y prioridades de mejora |
| [SECURITY.md](docs/SECURITY.md) | Política de seguridad del proyecto |
| [APPFLOW.md](docs/APPFLOW.md) | Flujo de aplicación |
| [SPEC.md](SPEC.md) | Especificación central del proyecto |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Guía de contribución, CI/CD, releases |
| [spec-file-rules.md](specs/spec-file-rules.md) | Reglas de clasificación de archivos |
| [spec-cli-commands.md](specs/spec-cli-commands.md) | Especificación de modos y comandos CLI |
| [adr/](specs/adr/) | Architecture Decision Records (ADR-001 al ADR-013) |

### Codebase Memory MCP

Este proyecto utiliza **codebase-memory-mcp** para indexado y búsqueda de elementos del código. **SIEMPRE preferir MCP sobre grep/glob** para buscar código.

#### Herramientas

| Herramienta | Uso |
|-------------|-----|
| `search_graph` | Buscar funciones, clases, rutas por patrón (primera opción) |
| `trace_path` | Rastrear callers/callees, análisis de impacto |
| `get_code_snippet` | Leer implementación específica de una función/clase |
| `query_graph` | Consultas Cypher para patrones complejos |
| `get_architecture` | Visión general de arquitectura del proyecto |
| `index_repository` | Re-indexar después de cambios estructurales significativos |

**Caer en grep/glob solo para:** strings literales, mensajes de error, config values, archivos no-code (Dockerfiles, scripts).

#### Indexación

- Grafo persistido en `.codebase-memory/graph.db.zst` — commitear para team sharing.
- Para re-indexar: `codebase-memory-mcp_index_repository` con `persistence=true`.

---

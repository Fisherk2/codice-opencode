# AGENTS.MD – Códice: Opencode Workspace Installer v1.0.13

**Propósito:** Reglas estrictas que los agentes de IA deben seguir en este proyecto.
**Documentación detallada:** `docs/` y `specs/` (ver índice al final).

---

## 🎯 Contexto del Proyecto

**Códice** es un instalador/actualizador de línea de comandos (CLI) compilado con Bun, diseñado para desplegar plantillas de workspace de OpenCode de forma atómica, segura e inteligente.

- **Dominio:** Gestión de archivos, versionado semántico, interacción TUI.
- **In-Scope:** Instalación/actualización del template empaquetado, gestión de versiones local/remota.
- **Out-of-Scope:** Instalación de dependencias externas, modificación de archivos del usuario post-instalación.

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

### Commits y PRs
- Todo commit debe incluir `Co-Authored-By: <Agente> <dev@fisherk2.com>` al final.
- **Agentes principales:** Huitzilopochtli, Quetzalcoatl, Tlaloc, Moctezuma, Mictlantecuhtli, Tezcatlipoca (Lower Camel Case).
- **Subagentes:** kebab-case (ej: `docs-writer`, `obsidian-vault-writer`).
- Toda PR debe incluir `**Authored by:** <Agente>` al final de la descripción.
- Múltiples agentes: listar trailers en orden de involucramiento (mayor a menor).

### Pre-Commit
- [ ] `just check` — 0 errores (biome ci + tsc --noEmit).
- [ ] `bun test` — 0 fallos.
- [ ] Sin tipos `any` en código de producción.
- [ ] Documentación actualizada si cambió API pública.

---

## 📚 Índice de Documentación

### docs/
| Archivo | Contenido |
|---------|-----------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagrama de componentes, capas, ADRs |
| [CODE_STYLE.md](docs/CODE_STYLE.md) | Convenciones de código, naming, TypeScript, errores |
| [WORKFLOW.md](docs/WORKFLOW.md) | Plan de implementación por fases (FEV) |
| [PRD.md](docs/PRD.md) | Product Requirements Document |
| [TRD.md](docs/TRD.md) | Technical Requirements Document |
| [TECH_DEBT.md](docs/TECH_DEBT.md) | Deuda técnica y prioridades de mejora |
| [SECURITY.md](docs/SECURITY.md) | Política de seguridad del proyecto |
| [APPFLOW.md](docs/APPFLOW.md) | Flujo de aplicación |
| [SPEC.md](SPEC.md) | Especificación central del proyecto |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Guía de contribución, CI/CD, releases |

### specs/
| Archivo | Contenido |
|---------|-----------|
| [spec-file-rules.md](specs/spec-file-rules.md) | Reglas de clasificación de archivos (Obligatorio/Estándar/Opcional) |
| [spec-cli-commands.md](specs/spec-cli-commands.md) | Especificación de modos y comandos CLI |
| [adr/](specs/adr/) | Architecture Decision Records (ADR-001 al ADR-010) |

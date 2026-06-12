# Registro de Cambios (Changelog)

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Sin Lanzar]

## [1.0.0] - 2026-06-12

### Lanzamiento Inicial

Primera versión estable del workspace SDD para OpenCode. Este release marca el inicio del proyecto como repositorio independiente, separado del fork original de `addyosmani/agent-skills`.

### Agregado

- **45 skills de ingeniería + 1 meta-skill** — TDD, Spec-Driven Development, Code Review, Seguridad, Performance, UI/UX, DDD/Hexagonal, patrones de diseño, entrevista de requerimientos, stress-testing de decisiones, observabilidad, manipulación de spreadsheets, notebooks, y más, organizados en 10 fases SDD (3 opcionales) + Extra
- **10 comandos slash** — `/spec`, `/design`, `/evolve`, `/plan`, `/build`, `/test`, `/webperf`, `/code-simplify`, `/review`, `/ship`
- **6 agentes primarios** — Panteón Mexica: huitzilopochtli (orquestador), quetzalcoatl (visión), moctezuma (planificación), tlaloc (construcción), mictlantecuhtli (validación), tezcatlipoca (revisión)
- **96+ subagentes especializados** — Frontend, backend, DevOps, testing, seguridad, AI/ML, data, documentación, negocio
- **Plugin SDD Pipeline** — Auto-detección de agente (4 mecanismos), matriz de permisos, validación de subagentes, anti-content-generation, safety net
- **59 referencias técnicas** — Clean Code, DDD, UI/UX, Testing, Seguridad, Arquitectura, Refactoring
- **7 providers oficiales** — openai, anthropic, google, deepseek, z-ai, moonshot, minimax con configuraciones thinking/reasoning
- **Servidores MCP** — Context7, Chrome DevTools, Excel, Jupyter
- **Documentación OpenCode** — 11 guías en `docs/opencode/` (00-setup a 10-permissions) + USER_GUIDE
- **Banner e imágenes** — 6 retratos de agentes + banner promocional

### Cambiado

- **Separación del fork original**: Este proyecto ahora es un repositorio independiente (`opencode-workspace`) con historial limpio desde v1.0.0
- **Providers depurados**: Eliminados `opencode` (Zen), `opencode-go` (Go) y `openrouter` — solo se mantienen providers oficiales de cada API
- **Modelos optimizados**: Configuración de 53 modelos en 7 providers con variantes deep-think/economy
- **README reestructurado**: Banner añadido, agentes mexica documentados, flujo SDD completo con diagrama Mermaid

### Corregido

- **Permisos de agentes**: Reforzados permisos read-only para agentes delegadores (huitzilopochtli, quetzalcoatl, tezcatlipoca)
- **Plugin SDD**: Validación de subagentes, detección de comandos con word boundary, safety net para comandos destructivos

---

## Información del Proyecto

### Repositorio
- **Nombre**: Workspace de Desarrollo Spec-Driven con OpenCode
- **Descripción**: Espacio de trabajo nativo para OpenCode con metodología Spec-Driven Development, 46 skills integradas (45 ingeniería + 1 meta-skill), 6 agentes primarios + 96+ subagentes, pipeline SDD Plugin con orquestación completa y 7 providers oficiales configurados
- **Repositorio**: https://github.com/Fisherk2/opencode-workspace
- **Licencia**: MIT License

### Stack Tecnológico
- **Plataforma**: OpenCode
- **Pipeline**: SDD Pipeline Plugin (5 hooks nativos, ~553 líneas)
- **Skills**: 46 skills de desarrollo profesional (45 ingeniería + 1 meta-skill)
- **Agentes**: 6 primarios + 96+ subagentes
- **Models**: 53 modelos en 7 providers oficiales (openai, anthropic, google, deepseek, z-ai, moonshot, minimax)
- **Documentación**: Context7 para APIs actualizadas · Markdown con diagramas Mermaid
- **Gestión de paquetes**: Bun (`.opencode/`) — npm prohibido
- **Control de Versiones**: Git
- **Servidores MCP**: Context7 (remote), Excel (local), Jupyter (local, deshabilitado), Chrome DevTools (local, deshabilitado)

### Documentación Relacionada

- **[README.md](README.md)** - Guía rápida y flujo de trabajo
- **[docs/opencode/USER_GUIDE.md](docs/opencode/USER_GUIDE.md)** - Referencia completa de 46 skills y 6 agentes primarios
- **[docs/opencode/04-commands.md](docs/opencode/04-commands.md)** - Guía de creación de comandos slash
- **[Plugin SDD Pipeline](.opencode/plugins/README.md)** - Documentación del plugin de orquestación
- **[docs/opencode/02-orchestration-patterns.md](docs/opencode/02-orchestration-patterns.md)** - Agentes y orquestación
- **[docs/opencode/03-agent-index.md](docs/opencode/03-agent-index.md)** - Catálogo completo de agentes por dominio
- **[skills/using-agent-skills/SKILL.md](skills/using-agent-skills/SKILL.md)** - Meta-skill orquestador
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Directrices de contribución

### Instrucciones de Actualización

#### Desde Versiones Anteriores
...

#### Para Versiones Futuras
...

### Contribuyendo al CHANGELOG

Al contribuir a este proyecto:

1. **Agrega entradas** a la sección `[Sin Lanzar]`
2. **Sigue versionado semántico** para cambios rupturantes
3. **Usa categorías apropiadas** (Agregado, Cambiado, Deprecado, Removido, Corregido, Seguridad)
4. **Incluye fechas** en formato `YYYY-MM-DD`
5. **Proporciona descripciones claras** explicando el impacto de los cambios
6. **Agrupa por fase** (Definir, Planear, Construir, Verificar, Revisar, Lanzar)
7. **Referencia issues relacionados** o pull requests cuando aplique

### Por Qué Este CHANGELOG Importa

Este CHANGELOG sirve como documentación viva que:

- **Rastrea la evolución** de la plantilla de desarrollo asistido por IA
- **Comunica cambios** a usuarios y contribuyentes
- **Proporciona guía de actualización** para lanzamientos futuros
- **Documenta decisiones arquitectónicas** y su racional
- **Habilita procesos de lanzamiento automatizados** con seguimiento estructurado de cambios

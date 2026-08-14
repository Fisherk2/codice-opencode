# Product Requirements Document – Códice: Opencode Workspace Installer v2.1.0
**Fecha:** 2026-06-13 | **Última actualización:** 2026-08-13 | **Autor:** Fisherk2 | **Estado:** Aprobado

## 0. Descripción General
Códice es una herramienta de línea de comandos (CLI) compilada con Bun, diseñada para instalar, configurar y actualizar plantillas de espacios de trabajo de OpenCode (`opencode`). Su objetivo es proporcionar una experiencia de instalación "a prueba de tontos", rápida, segura y con fusión inteligente de archivos, preservando las personalizaciones del usuario.

## 1. Visión y Problema
- **Problema que resuelve:** La instalación manual de plantillas de IA es propensa a errores, sobrescribe configuraciones personalizadas del usuario y carece de un mecanismo estandarizado para actualizar las herramientas base (skills, agentes, comandos) sin perder el trabajo previo.
- **Propuesta de valor:** Un instalador/actualizador interactivo, atómico y seguro que gestiona la complejidad del sistema de archivos, permitiendo a los desarrolladores enfocarse en la arquitectura y el código, no en la configuración de herramientas.
- **Alcance del MVP (In):** 
  - Menú interactivo TUI (`@clack/prompts`) con 3 modos: Instalación Limpia, Instalación a Proyecto, Actualizar Workspace.
  - Lógica de fusión granular a nivel de archivo (Obligatorio, Estándar, Opcional con checklist).
  - Operaciones atómicas de sistema de archivos (Staging + Rename).
  - Consulta de versión remota vía GitHub Releases API.
  - Orquestación de tareas y pruebas mediante `Justfile`.
  - Generación post-instalación de symlinks y `.gitignore` (compatibilidad npm/bunx).
  - Menú de archivos opcionales en ambos modos de instalación (Limpia y Proyecto).
  - Flags no-interactivos: `--dest`, `--force`, `--mode`.
  - Publicación npm como método oficial de distribución (`bunx @fisherk2-dev/codice`).
  - Gobernanza de agentes: regla de no-assumption (preguntar antes de actuar) y delegación-first para los 6 agentes primarios.
  - Restricciones de comandos destructivos: 53 patrones bash bloqueados en dos capas (plugin sdd-pipeline.ts + opencode.json).
  - 9 MCP servers pre-configurados (3 habilitados por defecto: context7, vercel-grep, gitmcp).
  - Subagente obsidian-vault-writer + 3 skills de Obsidian para administración de vaults.
  - ISP split: `IFileSystem` (6 métodos) + `IStagingSystem` (4 métodos) para segregación de interfaces.
  - Sistema de packs: 8 packs seleccionables + 2 directorios obligatorios (main, writers). 355 agentes distribuidos en 10 packs.
  - Installer UX v2: wizard de selección de packs, resumen pre-instalación con conteos de agentes, actualizaciones version-gated (solo v2.0+).
  - Flags CLI adicionales: `--packs <list>`, `--packs-all`, `--update-add-packs <list>`, `--clean`, `--project`, `--update`.
  - Formato `.codice-version` v2.0: incluye `installedPacks`, `installedAt`, `optionalSelections?`.
  - Update modes: Option A (solo packs actuales) y Option B (agregar packs con instalados bloqueados).
  - **v2.1:** Cuatro nuevos slash commands: `/sync` (sincronización bidireccional de git con 4 modos y 4 estrategias de resolución de conflictos), `/migrate` (análisis de migración de stack técnico con fases y rollback), `/deploy` (automatización post-`/ship` para generar branch protection, templates de PR, pipelines CI/CD), `/analyze` (análisis arquitectónico de 8 dimensiones que alimenta `docs/TECH_DEBT.md`).
  - **v2.1:** Auto-discovery de intents en SDD plugin: detección basada en filesystem de palabras clave de comandos reemplaza el mapa hardcodeado `INTENT_PATTERNS`.
  - **v2.1:** Soporte bilingüe de intents: palabras clave de comandos funcionan tanto en inglés como en español.
  - **v2.1:** Protocolo de delegación de agentes: los seis agentes primarios analizan antes de actuar, mapean subagentes/skills requeridos, e invocan vía `task()` con instrucciones determinísticas, skills a cargar y checklist de objetivos.
- **Alcance del MVP (Out):** 
  - Instalación de dependencias de terceros fuera del template.
  - Soporte para múltiples fuentes de plantillas (solo se soporta el template empaquetado en el binario).

## 2. Público Objetivo & Personas
| Persona | Rol | Necesidad Principal | Frecuencia de Uso |
|---------|-----|---------------------|-------------------|
| **Dev Nuevo** | Desarrollador Junior/Mid | Iniciar un proyecto con las mejores prácticas de SDD y Clean Architecture sin configurar nada manualmente. | Baja (1-2 veces por proyecto) |
| **Dev Experimentado** | Desarrollador Senior/Arquitecto | Actualizar las reglas, skills y agentes de su workspace existente sin perder sus personalizaciones locales. | Media (Mensual o por release) |
| **Mantenedor** | Owner del CLI | Garantizar que las nuevas versiones del template se desplieguen con pruebas E2E pasando y CI/CD estable. | Alta (Por cada cambio en el repo) |

## 3. Historias de Usuario / Casos de Uso (Priorizadas)
| ID | Como [rol] | Quiero [acción] | Para [beneficio] | Prioridad | Criterios de Aceptación |
|----|------------|-----------------|------------------|-----------|--------------------------|
| HU-01 | Dev Nuevo | Ejecutar un comando y seleccionar "Instalación Limpia" | Obtener una copia exacta y completa del template en mi directorio actual. | Alta | Se copian todos los archivos. Se crea `.codice-version`. |
| HU-02 | Dev Experimentado | Ejecutar "Instalación a Proyecto" y ver un checklist de archivos opcionales | Añadir herramientas base sin sobrescribir mis `skills` o `agents` personalizados. | Alta | Archivos "Obligatorios" se sobrescriben. "Estándar/Opcional" se omiten si existen, o se muestran en checklist interactivo. |
| HU-03 | Dev Experimentado | Ejecutar "Actualizar Workspace" | Saber si hay una nueva versión en GitHub y aplicar solo los cambios necesarios. | Alta | El CLI consulta la API de GitHub. Si hay update, aplica fusión granular. Si no, muestra mensaje de "versión más reciente". |
| HU-04 | Mantenedor | Ejecutar `just test` o `make test` | Verificar que la lógica de fusión y la TUI funcionen correctamente antes de hacer un release. | Alta | Las pruebas unitarias (Bun/Vitest) y E2E (scripts de shell) pasan con >80% de cobertura. |
| HU-05 | Cualquiera | Que el instalador falle a mitad de proceso | Que mi proyecto no quede en un estado corrupto o a medias. | Alta | Si falla, el directorio `.codice-staging/` se elimina y el proyecto original queda intacto (Atomicidad). |
| HU-06 | Dev Experimentado | Seleccionar qué packs de agentes instalar | Tener solo los agentes relevantes para mi tipo de proyecto, sin instalar los 355 agentes. | Media | El instalador presenta un wizard de selección. Se instalan solo los packs elegidos. |
| HU-07 | Dev Experimentado | Agregar packs en una actualización | Expandir mi workspace con nuevos packs sin reinstalar desde cero. | Baja | Update mode ofrece Option B para agregar packs. Los packs ya instalados quedan bloqueados. |
| HU-08 | Dev Experimentado | Sincronizar el workspace con git de forma bidireccional (`/sync`) | Mantener el repositorio alineado con el remoto y resolver conflictos de manera controlada. | Media | `/sync` detecta modo (full-sync, incremental-sync, dry-run, conflict-resolution). Aplica estrategias NEWER_WINS, GITHUB_WINS, LOCAL_WINS o INTELLIGENT_MERGE. |
| HU-09 | Dev Experimentado | Analizar la migración de stack técnico (`/migrate`) | Planear actualizaciones de dependencias con breaking changes sin afectar la estabilidad. | Baja | `/migrate` detecta stack desde lock files, evalúa breaking changes, y genera plan estructurado con fases y rollback en `docs/MIGRATION.md`. |
| HU-10 | Dev Experimentado | Automatizar el despliegue post-`/ship` (`/deploy`) | Configurar branch protection, PR templates y pipelines CI/CD sin edición manual. | Media | `/deploy` genera configuración desde cero (no-workflow), analiza y optimiza (betterable), o ejecuta workflow documentado (established). |
| HU-11 | Dev Experimentado | Analizar la arquitectura del proyecto (`/analyze`) | Identificar tech debt y riesgos arquitectónicos con priorización. | Media | `/analyze` ejecuta análisis de 8 dimensiones y genera `docs/TECH_DEBT.md` con hallazgos Critical/High/Medium/Low. |
| HU-12 | Cualquiera | Usar palabras clave de comandos en inglés o español | Interactuar con el agente en mi idioma preferido. | Baja | Los intents funcionan bilingualmente gracias al auto-discovery de SDD plugin. |
| HU-13 | Cualquiera | Ver cómo un agente principal delega trabajo a subagentes | Confiar en la calidad y trazabilidad de las decisiones automatizadas. | Alta | Cada `task()` incluye instrucciones determinísticas, skills a cargar y checklist de aceptación. Protocolo documentado en `docs/ARCHITECTURE.md`. |

## 4. Requisitos Funcionales
| REQ-ID | Descripción | Reglas de Negocio | Estado | Trazabilidad (TRD/Flow) |
|--------|-------------|-------------------|--------|--------------------------|
| RF-01 | Menú Interactivo TUI | Usar `@clack/prompts`. Debe ser intuitivo, con spinners y validación de entrada. | Implementado | HU-01, HU-02, HU-03 |
| RF-02 | Motor de Fusión de Archivos | Evaluar archivo por archivo. Reglas: Obligatorio (sobrescribir), Estándar (omitir si existe), Opcional (checklist -> omitir si existe). | Implementado | HU-02, HU-05 |
| RF-03 | Atomicidad de Operaciones | Toda escritura debe ocurrir primero en un directorio temporal (`.codice-staging`). Solo al finalizar con éxito, se mueve a la ubicación final. | Implementado | HU-05 |
| RF-04 | Gestión de Versiones Local | Crear/actualizar `.codice-version` con el tag de la versión instalada (ej: "v1.0.0"). | Implementado | HU-01, HU-03 |
| RF-05 | Consulta de Versión Remota | Consultar `GET https://api.github.com/repos/{owner}/{repo}/releases/latest`. Comparar con versión local usando semver. | Implementado | HU-03 |
| RF-06 | Sistema de Packs | Organizar agentes en 10 packs (2 obligatorios + 8 seleccionables). El usuario elige qué packs instalar via wizard interactivo o flags CLI. | Implementado | HU-06, ADR-014 |
| RF-07 | Installer UX v2 | Wizard de selección de packs, resumen pre-instalación con conteos de agentes/archivos, y actualización version-gated (solo v2.0+). | Implementado | HU-06, HU-07, ADR-015 |
| RF-08 | Update Version-Gated | Bloquear Update Workspace para instalaciones < v2.0.0 con mensaje de guía migración. | Implementado | HU-03, ADR-015 |
| RF-09 | Slash Command `/sync` | Sincronización bidireccional de git con 4 modos y 4 estrategias de resolución de conflictos. | Implementado (v2.1) | HU-08, ADR-016 |
| RF-10 | Slash Command `/migrate` | Análisis de migración de stack técnico con fases y rollback documentados en `docs/MIGRATION.md`. | Implementado (v2.1) | HU-09, ADR-016 |
| RF-11 | Slash Command `/deploy` | Automatización post-`/ship` para generar branch protection, PR templates y pipelines CI/CD. | Implementado (v2.1) | HU-10, ADR-016 |
| RF-12 | Slash Command `/analyze` | Análisis arquitectónico de 8 dimensiones que actualiza `docs/TECH_DEBT.md`. | Implementado (v2.1) | HU-11, ADR-016 |
| RF-13 | Auto-discovery de Intents | Detección basada en filesystem de palabras clave de comandos reemplaza mapa hardcodeado. | Implementado (v2.1) | HU-12, ADR-017 |
| RF-14 | Soporte Bilingüe de Intents | Las palabras clave de comandos funcionan tanto en inglés como en español. | Implementado (v2.1) | HU-12, ADR-017 |
| RF-15 | Protocolo de Delegación de Agentes | Los agentes primarios analizan, mapean subagentes/skills, e invocan vía `task()` con instrucciones determinísticas y checklist de aceptación. | Implementado (v2.1) | HU-13, ADR-018 |

## 5. Requisitos No Funcionales
- **Rendimiento:** La consulta de versión remota debe tomar < 2 segundos. La extracción del template empaquetado debe tomar < 5 segundos.
- **Seguridad:** No ejecutar código arbitrario. Manejo seguro de permisos de archivos (preservar modos de ejecución si aplica). No exponer tokens en logs.
- **Usabilidad/Accesibilidad:** Mensajes de error claros y accionables (ej: "Permiso denegado en carpeta X, ejecute con sudo o revise permisos").
- **Disponibilidad/Recuperación:** Rollback automático en caso de interrupción (Fallo en disco lleno, Ctrl+C).

## 6. Métricas de Éxito (KPIs)
- **Métrica:** Tasa de éxito de instalación E2E. | **Valor Objetivo:** 100% en CI/CD. | **Método:** Pipeline de GitHub Actions.
- **Métrica:** Cobertura de pruebas (Unitarias + Integración). | **Valor Objetivo:** > 80%. | **Método:** `bun test --coverage`.

## 7. Supuestos, Restricciones y Dependencias
- **Supuestos:** El usuario tiene permisos de escritura en el directorio de destino. El template está empaquetado dentro del paquete npm (no requiere red para instalar, solo para actualizar).
- **Restricciones técnicas:** Desarrollado y compilado con Bun. Compatibilidad multiplataforma (Linux, macOS, Windows) debe ser considerada en las rutas de archivos (`path.join`).
- **Dependencias externas:** API de GitHub (sujeta a rate limit de 60 req/hora para IPs no autenticadas, suficiente para uso individual).

## 8. Control de Cambios
| Versión | Fecha | Autor | Cambio | Aprobado por |
|---------|-------|-------|--------|--------------|
| 0.1.0 | 2026-06-13 | Fisherk2 | Creación inicial del PRD basado en cuestionario de clarificación. | ✅ Aprobado |
| 1.1.3 | 2026-07-27 | Fisherk2 | Sincronizado con v1.1.3: gobernanza de agentes, restricciones de comandos, 9 MCP servers, Obsidian subagent, ISP split. | ✅ Aprobado |
| 1.2.0 | 2026-08-03 | Fisherk2 | Sincronizado con v1.2.0: binarios removidos (ADR-011), .devin removido, progress bar, /help, /test, /ship, ADR-011 a ADR-013. | ✅ Aprobado |
| 2.0.0 | 2026-08-07 | Fisherk2 | Sincronizado con v2.0.0: sistema de packs (ADR-014), installer UX v2 (ADR-015), 355 agentes en 10 packs, version-gated updates, 30 E2E scenarios, 1920 tests. | ✅ Aprobado |
| 2.1.0-beta.1 | 2026-08-12 | Fisherk2 | Sincronizado con v2.1.0-beta.1: 4 nuevos comandos (`/sync`, `/migrate`, `/deploy`, `/analyze`), SDD plugin intent auto-discovery, bilingual intents, agent delegation protocol (FEV-25), CI/CD hardening, npm provenance SLSA v1, 31 E2E scenarios, 2052 tests. ADRs 016-020. | ✅ Aprobado |

---
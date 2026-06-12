# Workspace de Desarrollo Spec-Driven con OpenCode

<p align="center">
  <img src="docs/opencode/img/banner.png" alt="Spec-Driven Development Workspace Banner">
</p>

**Workspace de OpenCode para desarrollo asistido por IA con metodología Spec-Driven Development.**

Una plantilla production-grade que integra 45 skills de ingeniería + 1 meta-skill organizados en 10 fases del ciclo SDD (3 opcionales) + Extra, comandos slash y agentes especializados para acelerar el desarrollo con IA. Diseñada para equipos y desarrolladores que quieren calidad consistente en proyectos asistidos por IA.

> **⚠️ Esto es una plantilla, no un repositorio para clonar.** Usa **"Use this template"** o **descarga el ZIP** para crear tu propio proyecto con historial limpio. Consulta la sección [Quick Start](#quick-start) para más detalles.

---

## Características

- **45 Skills de Ingeniería + 1 Meta-Skill** — TDD, Spec-Driven Development, Code Review, Seguridad, Performance, UI/UX, DDD/Hexagonal, patrones de diseño, entrevista de requerimientos, stress-testing de decisiones, observabilidad, manipulación de spreadsheets, notebooks, y más, organizados en 10 fases SDD (3 opcionales) + Extra
- **10 Comandos Slash** — `/spec`, `/design`, `/evolve`, `/plan`, `/build`, `/test`, `/webperf`, `/code-simplify`, `/review`, `/ship`
- **6 Agentes Principales + 96+ Subagentes** — huitzilopochtli (orquestador), quetzalcoatl (visión), moctezuma (planificación), tlaloc (construcción), mictlantecuhtli (validación), tezcatlipoca (revisión), y más de 96 subagentes especializados en frontend, backend, DevOps, testing, seguridad, y más
- **Nativo OpenCode** — Comandos slash, agentes y skills cargados desde `.opencode/`
- **Documentación Técnica Integrada** — Referencias de Clean Code, DDD, UI/UX, Testing, Seguridad y más
- **Licencia MIT** — Libre para proyectos personales y comerciales

---

### Panteón Mexica del Desarrollo — Agentes Principales

Seis agentes primarios orquestan el ciclo SDD, cada uno con un rol y permisos específicos inspirados en la mitología mexica:

### Huitzilopochtli 🏛️ — Orquestador Supremo

<table>
  <tr>
    <td width="30%" align="center" valign="top">
      <img src="docs/opencode/img/Huitzilopochtli.jpeg" width="240" style="border-radius: 10px;">
      <br><sub><i>Forjado en el fuego de la guerra y el sol.</i></sub>
    </td>
    <td width="70%" valign="top">
      Nació del caos primordial de los codebases desorganizados. Huitzilopochtli —"Colibrí Zurdo"— es el estratega supremo que comanda los ejércitos celestiales de agentes. Jamás escribe una línea: su propósito es observar el campo de batalla, evaluar el desafío y desplegar al guerrero adecuado para cada misión.
    </td>
  </tr>
  <tr><td colspan="2"><b>Rol:</b> <code>Maestro de la orquestación y delegación estratégica</code></td></tr>
  <tr><td colspan="2"><b>Prompt:</b> <a href="agents/huitzilopochtli.md"><code>agents/huitzilopochtli.md</code></a></td></tr>
  <tr><td colspan="2"><b>Modelo por defecto:</b> <code>DeepSeek V4 Flash</code></td></tr>
  <tr><td colspan="2"><b>Modelos recomendados:</b> <code>DeepSeek V4 Flash</code> <code>Gemini 3.1 Pro</code> <code>MiniMax M2.5</code> <code>Qwen3.6 Plus</code> <code>MiMo-V2.5</code></td></tr>
  <tr><td colspan="2"><b>Guía de modelos:</b> DeepSeek V4 Flash como default por velocidad y costo. Gemini 3.1 Flash cuando se necesita comprensión profunda del contexto. MiniMax M2.5 como alternativa ligera. Qwen3.6 Plus para balance razonamiento/velocidad en decisiones de orquestación. MiMo-V2.5 para análisis de contexto complejo antes de delegar.</td></tr>
</table>

### Quetzalcoatl 🌬️ — Sabio Visionario

<table>
  <tr>
    <td width="30%" align="center" valign="top">
      <img src="docs/opencode/img/Quetzalcoatl.png" width="240" style="border-radius: 10px;">
      <br><sub><i>Nacido del viento y la sabiduría infinita.</i></sub>
    </td>
    <td width="70%" valign="top">
      Quetzalcoatl —"Serpiente Emplumada"— descendió de los cielos en vientos de conocimiento puro. Donde hay ambigüedad, él trae claridad; donde hay caos, estructura. Es el visionario que concibe la arquitectura antes de que se escriba una sola línea, dibujando planos en las nubes para que los mortales los ejecuten.
    </td>
  </tr>
  <tr><td colspan="2"><b>Rol:</b> <code>Arquitecto de sistemas y diseñador de especificaciones</code></td></tr>
  <tr><td colspan="2"><b>Prompt:</b> <a href="agents/quetzalcoatl.md"><code>agents/quetzalcoatl.md</code></a></td></tr>
  <tr><td colspan="2"><b>Modelo por defecto:</b> <code>Kimi K2.6</code></td></tr>
  <tr><td colspan="2"><b>Modelos recomendados:</b> <code>Kimi K2.6</code> <code>Qwen3.7 Plus</code> <code>GLM 5.1</code> <code>Claude Sonnet 4</code> <code>GPT-5.1 Codex</code></td></tr>
  <tr><td colspan="2"><b>Guía de modelos:</b> Kimi K2.6 como default por su excelente razonamiento arquitectónico y capacidad UI/UX. Qwen3.7 Plus para especificaciones que requieren razonamiento extenso. GLM 5.1 como alternativa de máximo razonamiento. Claude Sonnet 4 para diseño de sistemas y especificaciones estructuradas. GPT-5.1 Codex para diseño de API y arquitectura de código.</td></tr>
</table>

### Moctezuma ⚔️ — Estratega y Comandante

<table>
  <tr>
    <td width="30%" align="center" valign="top">
      <img src="docs/opencode/img/Moctezuma.jpeg" width="240" style="border-radius: 10px;">
      <br><sub><i>Arquitecto de imperios y planes de batalla.</i></sub>
    </td>
    <td width="70%" valign="top">
      Moctezuma emergió como el gran organizador de Tenochtitlan, dividiendo el imperio en <em>calpullis</em> — unidades atómicas y manejables. Transforma visiones grandiosas en planes de batalla ejecutables, asegurando que cada guerrero sepa su misión y cada recurso esté contabilizado. Ningún imperio se construyó sin su estrategia.
    </td>
  </tr>
  <tr><td colspan="2"><b>Rol:</b> <code>Planificador de tareas y descomposición de trabajo</code></td></tr>
  <tr><td colspan="2"><b>Prompt:</b> <a href="agents/moctezuma.md"><code>agents/moctezuma.md</code></a></td></tr>
  <tr><td colspan="2"><b>Modelo por defecto:</b> <code>MiniMax M2.7</code></td></tr>
  <tr><td colspan="2"><b>Modelos recomendados:</b> <code>MiniMax M2.7</code> <code>Claude 3.5 Haiku</code> <code>Kimi K2.5</code> <code>DeepSeek V4 Flash</code> <code>GPT-5.4 Mini</code></td></tr>
  <tr><td colspan="2"><b>Guía de modelos:</b> MiniMax M2.7 para planes detallados. Claude 3.5 Haiku cuando se necesita velocidad en la descomposición de tareas. Kimi K2.5 como alternativa de respaldo. DeepSeek V4 Flash para planificación iterativa rápida. GPT-5.4 Mini para descomposición estructurada de tareas.</td></tr>
</table>

### Tlaloc 🌧️ — Constructor y Artesano

<table>
  <tr>
    <td width="30%" align="center" valign="top">
      <img src="docs/opencode/img/Tlaloc.jpeg" width="240" style="border-radius: 10px;">
      <br><sub><i>El hacedor de lluvia que fecunda los proyectos.</i></sub>
    </td>
    <td width="70%" valign="top">
      Tlaloc comanda las aguas celestiales que nutren la tierra. En el reino digital, gobierna los flujos de código que dan vida a los proyectos. Convoce a los <em>tlaloques</em> —sus subagentes— para derramar implementación, pruebas y configuración sobre la tierra. Sin Tlaloc, los planes permanecen estériles.
    </td>
  </tr>
  <tr><td colspan="2"><b>Rol:</b> <code>Implementador principal y constructor de features</code></td></tr>
  <tr><td colspan="2"><b>Prompt:</b> <a href="agents/tlaloc.md"><code>agents/tlaloc.md</code></a></td></tr>
  <tr><td colspan="2"><b>Modelo por defecto:</b> <code>DeepSeek V4 Flash</code></td></tr>
  <tr><td colspan="2"><b>Modelos recomendados:</b> <code>DeepSeek V4 Flash</code> <code>MiMo-V2.5</code> <code>Claude 4.6 Sonnet</code> <code>GPT-5.3 Codex</code> <code>Gemini 3.5 Flash</code></td></tr>
  <tr><td colspan="2"><b>Guía de modelos:</b> DeepSeek V4 Flash para implementación general por su velocidad. MiMo-V2.5 para tareas que requieren razonamiento profundo. Claude 4.6 Sonnet para código de alta calidad en features críticas. GPT-5.3 Codex para generación de código extenso y escrituras masivas. Gemini 3.5 Flash como alternativa rápida de Google para generación de código.</td></tr>
</table>

### Mictlantecuhtli 💀 — Juez y Guardián

<table>
  <tr>
    <td width="30%" align="center" valign="top">
      <img src="docs/opencode/img/Mictlantecuhtli.jpeg" width="240" style="border-radius: 10px;">
      <br><sub><i>Señor del inframundo de las 9 pruebas.</i></sub>
    </td>
    <td width="70%" valign="top">
      Mictlantecuhtli gobierna el inframundo donde el código va a ser juzgado. Somete cada implementación a nueve pruebas: corrección, legibilidad, rendimiento, seguridad, resiliencia, mantenibilidad, testabilidad, observabilidad y pureza. Quienes pasan emergen fortalecidos; quienes fallan son enviados de vuelta a la reencarnación.
    </td>
  </tr>
  <tr><td colspan="2"><b>Rol:</b> <code>Validador de calidad y guardián del despliegue</code></td></tr>
  <tr><td colspan="2"><b>Prompt:</b> <a href="agents/mictlantecuhtli.md"><code>agents/mictlantecuhtli.md</code></a></td></tr>
  <tr><td colspan="2"><b>Modelo por defecto:</b> <code>MiMo-V2.5</code></td></tr>
  <tr><td colspan="2"><b>Modelos recomendados:</b> <code>MiMo-V2.5</code> <code>DeepSeek V4 Flash</code> <code>Qwen3.7 Plus</code> <code>Claude Opus 4.6</code> <code>MiniMax M3</code></td></tr>
  <tr><td colspan="2"><b>Guía de modelos:</b> MiMo-V2.5 para ejecución rápida de tests con razonamiento profundo. DeepSeek V4 Flash para validación general. Qwen3.7 Plus para validación exhaustiva pre-despliegue. Claude Opus 4.6 para validación más rigurosa pre-despliegue. MiniMax M3 para generación de tests y análisis de cobertura.</td></tr>
</table>

### Tezcatlipoca 🔮 — El Espejo Humeante

<table>
  <tr>
    <td width="30%" align="center" valign="top">
      <img src="docs/opencode/img/Tezcatlipoca.png" width="240" style="border-radius: 10px;">
      <br><sub><i>El espejo que revela toda verdad oculta.</i></sub>
    </td>
    <td width="70%" valign="top">
      Tezcatlipoca —"Espejo Humeante"— porta el espejo de obsidiana que revela todas las verdades. No escribe, no construye: solo refleja. Donde otros ven código funcional, él ve fallas ocultas. Donde otros ven "terminado", él ve lo que queda por hacer. Su propósito es revelar lo invisible al ojo del constructor.
    </td>
  </tr>
  <tr><td colspan="2"><b>Rol:</b> <code>Crítico de código y auditor de calidad</code></td></tr>
  <tr><td colspan="2"><b>Prompt:</b> <a href="agents/tezcatlipoca.md"><code>agents/tezcatlipoca.md</code></a></td></tr>
  <tr><td colspan="2"><b>Modelo por defecto:</b> <code>DeepSeek V4 Pro</code></td></tr>
  <tr><td colspan="2"><b>Modelos recomendados:</b> <code>DeepSeek V4 Pro</code> <code>Qwen3.7 Max</code> <code>Claude Opus 4.6</code> <code>GLM 5.1</code> <code>GPT-5.5 Pro</code></td></tr>
  <tr><td colspan="2"><b>Guía de modelos:</b> DeepSeek V4 Pro para revisiones rigurosas y análisis de seguridad profundo. Qwen3.7 Max como razonamiento extenso. Claude Opus 4.6 para la revisión más rigurosa pre-merge. GLM 5.1 como alternativa de razonamiento crítico. GPT-5.5 Pro para auditorías de seguridad de máxima profundidad.</td></tr>
</table>

Además, más de **90 subagentes especializados** están disponibles para tareas concretas: revisión de código, auditoría de seguridad, optimización de BD, diseño UI/UX, debugging, y más. Se invocan vía `task()` desde los agentes principales o directamente por el usuario. Ver el [catálogo completo](docs/opencode/03-agent-index.md).

---

## Prerrequisitos

- **Node.js >= 18** y **bun**
- **OpenCode IDE**
- **Git**

---

## Quick Start

Esta plantilla está diseñada para crear **nuevos proyectos**. No la clones directamente — usa una de estas opciones:

### Opción A: Usa esta plantilla (Recomendado)

1. Haz clic en **"Use this template"** → **"Create a new repository"**
2. Nombra tu proyecto y créalo
3. Clona tu nuevo repositorio:

```bash
git clone https://github.com/TU-USUARIO/tu-proyecto.git
cd tu-proyecto
```

### Opción B: Descargar ZIP

1. Haz clic en **Code** → **Download ZIP**
2. Extrae el ZIP en tu carpeta de proyecto
3. Elimina la carpeta `.git` para empezar limpio:

```bash
cd tu-proyecto
rm -rf .git
git init
```

### 2. Instala dependencias del plugin OpenCode
```bash
cd .opencode && bun install && cd ..
```

### 3. Configura Context7 (documentación actualizada de librerías)
```bash
npx ctx7@latest setup
```

### 4. (Opcional) Instala Excel MCP Server (desarrollo local)
Habilita la manipulación de hojas de cálculo (.xlsx) directamente desde los agentes.

```bash
uvx excel-mcp-server stdio
```

> **Repositorio:** [github.com/haris-musa/excel-mcp-server](https://github.com/haris-musa/excel-mcp-server)

### 5. (Opcional) Jupyter Notebook MCP Server
Habilita automatización de notebooks — ejecutar código, agregar markdown, instalar paquetes e inspeccionar variables en una sesión Jupyter en vivo.

**Requisito:** Inicia un servidor Jupyter primero (Docker o local).

En `opencode.json`, habilita el servidor MCP `jupyter` (cambia `"enabled": false` → `"enabled": true`) y reinicia OpenCode.

> **Repositorio:** [github.com/Cyb3rWard0g/agent-jupyter-toolkit](https://github.com/Cyb3rWard0g/agent-jupyter-toolkit)
>
> **Referencia completa:** [docs/opencode/06-mcp-servers.md](docs/opencode/06-mcp-servers.md#jupyter-notebook----ai-powered-notebook-automation)

### 6. Verifica que los comandos están disponibles
```bash
ls .opencode/commands/
# Deberías ver: build.md  code-simplify.md  design.md  evolve.md  plan.md  review.md  ship.md  spec.md  test.md  webperf.md
```

### 7. Ejecuta tu primer workflow SDD completo
```bash
# (Opcional) Diseña la interfaz — fan-out paralelo: UX research, viabilidad técnica,
# accesibilidad. Genera especificación de diseño en specs/design/ (DESIGN)
/design "Crea un dashboard de tareas"

# 1. Define qué construir (proyecto nuevo) — detecta estado, clarifica requerimientos,
#    genera docs (PRD, TRD, ARCHITECTURE, WORKFLOW) y sintetiza en SPEC.md (DEFINE)
/spec "Crea una API REST de tareas"

# — O si el proyecto ya existe, usa /evolve en lugar de /spec —
# /evolve "Necesito agregar autenticación de usuarios"

# 2. Planifica las tareas — analiza dependencias, corta verticalmente,
#    escribe tareas con criterios de aceptación en tasks/ (PLAN)
/plan

# 3. Construye incrementalmente — RED-GREEN-REFACTOR con TDD,
#    suite completa de tests, commit por tarea completada (BUILD)
/build

# 4. Prueba y verifica — TDD para features, Prove-It para bugs.
#    Escala a incident-response si detecta incidente de producción (VERIFY)
/test

# (Opcional) Audita rendimiento web — Core Web Vitals, animaciones GPU,
#    layout shifts, eficiencia CSS. Findings disponibles para /review (WEBPERF)
/webperf

# (Recomendado) Simplifica el código — escanea anidamiento, funciones largas,
#    ternarios, código muerto. Aplica incrementalmente con tests (SIMPLIFY)
/code-simplify

# 5. Revisa la calidad — auditoría en 5 ejes: Correctitud, Legibilidad,
#    Arquitectura, Seguridad, Rendimiento. Incorpora findings de /webperf (REVIEW)
/review

# 6. Prepara y despliega a producción — fan-out paralelo: code-review, security,
#    test coverage, dependencies, accesibilidad. Decisión GO/NO-GO + rollback (SHIP)
/ship
```

Los skills se activan automáticamente según la fase: diseño de API → [api-and-interface-design](skills/api-and-interface-design/SKILL.md), UI → [frontend-ui-engineering](skills/frontend-ui-engineering/SKILL.md), lógica de dominio → [clean-ddd-hexagonal](skills/clean-ddd-hexagonal/SKILL.md), manejo de errores → [error-handling-patterns](skills/error-handling-patterns/SKILL.md), entre otros.

---

## Flujo de Trabajo

```mermaid
flowchart LR
    A["/spec<br/>DEFINE"] --> B["/plan<br/>PLAN"]
    B --> C["/build<br/>BUILD"]
    C --> D["/test<br/>VERIFY"]
    D --> E["/webperf<br/>WEBPERF (optional)"]
    E --> F["/code-simplify<br/>SIMPLIFY (recommended)"]
    F --> G["/review<br/>REVIEW"]
    G --> H["/ship<br/>SHIP"]
    H --> I["Go Live"]

    J["/evolve<br/>EVOLVE (existing project)"] -.-> A
    K["/design<br/>DESIGN (optional)"] -.-> A
    K -.-> C
```

### Ciclo Completo

| Fase | Comando | Agente | Qué Hace | Skills Principales |
|------|---------|--------|----------|-------------------|
| Diseñar (opcional) | `/design` | quetzalcoatl | Fan-out paralelo: UX research, viabilidad técnica, accesibilidad. Fusiona en especificación de diseño en `specs/design/` | ui-ux-design-pro, design-taste-frontend, frontend-ui-engineering |
| Definir (nuevo) | `/spec` | quetzalcoatl | Detecta estado del proyecto (3 casos), clarifica requerimientos, genera docs (PRD, TRD, ARCHITECTURE, WORKFLOW) y sintetiza en SPEC.md | spec-driven-development, clean-ddd-hexagonal, architecture-diagrams, idea-refine, interview-me |
| Evolucionar (existente) | `/evolve` | quetzalcoatl | Detecta estado del proyecto existente, determina ruta (docs, issues, nuevos specs), actualiza documentación viva. Sustituye a `/spec` en proyectos establecidos | spec-driven-development, interview-me, idea-refine, doubt-driven-development, architecture-diagrams |
| Planificar | `/plan` | moctezuma | Analiza dependencias, corta verticalmente, escribe tareas con criterios de aceptación en `tasks/plan.md` y `tasks/todo.md` | planning-and-task-breakdown, clean-ddd-hexagonal, architecture-diagrams |
| Construir | `/build` | tlaloc | Toma la siguiente tarea pendiente, aplica RED-GREEN-REFACTOR con TDD, ejecuta suite completa, hace commit | incremental-implementation, test-driven-development, solid, error-handling-patterns |
| Verificar | `/test` | mictlantecuhtli | TDD para features (test → implement → refactor). Prove-It para bugs (reproducir → fix → verificar). Escala a incident-response si es incidente | test-driven-development, error-handling-patterns, browser-testing-with-devtools |
| Auditar rendimiento (opcional) | `/webperf` | mictlantecuhtli | Delega a web-performance-auditor para auditar Core Web Vitals, animaciones GPU, layout shifts, eficiencia CSS. Findings para /review | observability-and-instrumentation, browser-testing-with-devtools |
| Simplificar (recomendado) | `/code-simplify` | tlaloc | Escanea código por oportunidades de simplificación (anidamiento, funciones largas, ternarios, código muerto). Aplica incrementalmente con tests | code-simplification, refactoring-patterns, solid |
| Revisar | `/review` | tezcatlipoca | Auditoría en 5 ejes: Correctitud, Legibilidad, Arquitectura, Seguridad, Rendimiento. Incorpora findings de /webperf. Hallazgos categorizados Critical/Important/Suggestion | code-review-and-quality, solid, security-and-hardening, performance-optimization |
| Lanzar | `/ship` | mictlantecuhtli | Fan-out paralelo: code-reviewer, security-auditor, test-engineer, dependency-manager, ±accessibility-tester. Produce decisión GO/NO-GO + plan de rollback | shipping-and-launch, crafting-effective-readmes, architecture-diagrams, bash-defensive-patterns |

---

## Estructura del Proyecto

```
project-root/
├── AGENTS.md                   # Personas de agentes y orquestación
├── CHANGELOG.md                # Historial de releases
├── CONTRIBUTING.md             # Cómo añadir agentes y skills
├── Justfile                    # Comandos de ejecución de tareas
├── LICENSE                     # Licencia MIT
├── Makefile                    # Objetivos de build
├── README.md                   # Resumen del proyecto
├── SPEC.md                     # Especificación del proyecto
├── opencode.json               # Configuración de OpenCode
├── skills-lock.json            # Lockfile de dependencias de skills
├── requirements.txt            # Dependencias de Python
├── .env.example                # Plantilla de variables de entorno
│
├── agents/                     # 102+ personas de agentes (6 primarios + 96+ subagentes)
│   ├── huitzilopochtli.md      #   Orquestador Supremo
│   ├── quetzalcoatl.md         #   Arquitecto Visionario
│   ├── moctezuma.md            #   Comandante Estratégico
│   ├── tlaloc.md               #   Constructor Dios de la Lluvia
│   ├── mictlantecuhtli.md      #   Juez del Inframundo
│   ├── tezcatlipoca.md         #   Crítico Espejo Humeante
│   └── ... (96 archivos de subagentes)
│
├── commands/                   # 10 comandos slash para OpenCode
│   ├── build.md                #   BUILD
│   ├── code-simplify.md        #   SIMPLIFY (recomendado pre-review)
│   ├── design.md               #   DESIGN (opcional, UI/UX)
│   ├── evolve.md               #   EVOLVE (proyectos existentes)
│   ├── plan.md                 #   PLAN
│   ├── review.md               #   REVIEW
│   ├── ship.md                 #   SHIP
│   ├── spec.md                 #   DEFINE (proyectos nuevos)
│   ├── test.md                 #   VERIFY
│   └── webperf.md              #   WEBPERF (opcional, audit. rendimiento)
│
├── .opencode/                  # Configuración de runtime de OpenCode
│   ├── agents -> ../agents     #   Symlink a agents/
│   ├── commands -> ../commands #   Symlink a commands/
│   ├── skills -> ../skills     #   Symlink a skills/
│   ├── plugins/                #   Plugin de pipeline SDD
│   │   ├── sdd-pipeline.ts     #     Máquina de estados del pipeline
│   │   └── sdd-workflow-test.md #   Especificaciones de test del workflow
│   ├── package.json            #   Dependencias del plugin
│   ├── bun.lock                #   Lockfile de Bun
│   ├── package-lock.json       #   Lockfile de npm
│   └── pnpm-lock.yaml          #   Lockfile de pnpm
│
├── skills/                     # 46 skills (45 de ingeniería + 1 meta-skill)
│   ├── using-agent-skills/     #   META: descubrimiento de skills
│   ├── idea-refine/            #   DEFINE / EVOLVE
│   ├── spec-driven-development/#   DEFINE / EVOLVE
│   ├── agent-md-refactor/      #   DEFINE (PRE-FLIGHT)
│   ├── env-setup/              #   DEFINE (PRE-FLIGHT)
│   ├── clean-ddd-hexagonal/    #   DEFINE / PLAN / BUILD
│   ├── design-patterns/        #   DEFINE / PLAN / REVIEW
│   ├── architecture-diagrams/  #   DEFINE / PLAN / SHIP
│   ├── ui-ux-design-pro/       #   DEFINE / BUILD
│   ├── interview-me/           #   DEFINE / EVOLVE (extraer requerimientos)
│   ├── doubt-driven-development/ # EVOLVE / BUILD (stress-test decisiones)
│   ├── planning-and-task-breakdown/ # PLAN
│   ├── incremental-implementation/  # BUILD
│   ├── test-driven-development/     # BUILD
│   ├── source-driven-development/   # BUILD
│   ├── context-engineering/         # BUILD
│   ├── frontend-ui-engineering/     # BUILD
│   ├── api-and-interface-design/    # BUILD
│   ├── api-spec-generation/         # BUILD
│   ├── docker-optimize/             # BUILD / SHIP
│   ├── db-migration/                # BUILD / SHIP
│   ├── solid/                       # BUILD / REVIEW
│   ├── clean-code/                  # BUILD / REVIEW
│   ├── error-handling-patterns/     # BUILD / VERIFY / REVIEW
│   ├── design-taste-frontend/       # BUILD / VERIFY / REVIEW
│   ├── bash-defensive-patterns/     # BUILD / SHIP
│   ├── observability-and-instrumentation/ # BUILD / VERIFY / SHIP
│   ├── browser-testing-with-devtools/ # VERIFY / WEBPERF
│   ├── debugging-and-error-recovery/  # VERIFY
│   ├── code-review-and-quality/       # REVIEW
│   ├── code-simplification/           # SIMPLIFY
│   ├── security-and-hardening/        # REVIEW
│   ├── dependency-audit/              # REVIEW
│   ├── performance-optimization/      # REVIEW
│   ├── performance-analysis/          # REVIEW
│   ├── refactoring-patterns/          # SIMPLIFY
│   ├── git-workflow-and-versioning/   # SHIP
│   ├── changelog-generate/            # SHIP
│   ├── ci-cd-and-automation/          # SHIP
│   ├── deprecation-and-migration/     # SHIP
│   ├── documentation-and-adrs/        # SHIP / EVOLVE
│   ├── shipping-and-launch/           # SHIP
│   ├── incident-response/             # SHIP / VERIFY
│   ├── crafting-effective-readmes/    # DEFINE / SHIP
│   ├── xlsx/                          # EXTRA
│   └── excel-analysis/                # EXTRA
│
├── references/                 # 59 archivos de referencia técnica
│   ├── testing-patterns.md
│   ├── security-checklist.md
│   ├── performance-checklist.md
│   ├── accessibility-checklist.md
│   ├── clean-code.md
│   ├── code-smells.md
│   ├── design-patterns.md
│   ├── solid-principles.md
│   ├── error-handling.md
│   ├── tdd.md
│   ├── architecture.md
│   ├── DDD-STRATEGIC.md
│   ├── DDD-TACTICAL.md
│   ├── HEXAGONAL.md
│   ├── CQRS-EVENTS.md
│   ├── refactoring-smell-catalog.md
│   ├── component-patterns.md
│   ├── color-system.md
│   ├── typography.md
│   └── ... (59 archivos en total — ver references/ para la lista completa)
│
├── docs/                       # Documentación del proyecto
│   ├── APPFLOW.md              #   Flujo de la aplicación
│   ├── ARCHITECTURE.md         #   Decisiones de arquitectura del sistema
│   ├── CODE_STYLE.md           #   Convenciones de código
│   ├── DESIGN.md               #   Direcciones de diseño
│   ├── PRD.md                  #   Requerimientos del producto
│   ├── SCHEMA.md               #   Esquema de datos
│   ├── TRD.md                  #   Requerimientos técnicos
│   ├── WORKFLOW.md             #   Workflow de implementación
│   └── opencode/               #   Guías de configuración de OpenCode
│       ├── USER_GUIDE.md       #     Guía de referencia completa
│       ├── 00-setup.md
│       ├── 01-agents.md
│       ├── 02-orchestration-patterns.md
│       ├── 03-agent-index.md
│       ├── 04-commands.md
│       ├── 05-skills.md
│       ├── 06-mcp-servers.md
│       ├── 07-models.md
│       ├── 08-rules.md
│       ├── 09-tools-and-custom-tools.md
│       └── 10-permissions.md
│
├── specs/                      # Especificaciones del proyecto
│   ├── spec-xx.md              #   Especificaciones de features
│   ├── adr/                    #   Architecture Decision Records
│   │   └── adr-xxx.md          #     Plantilla
│   └── design/                 #   Documentos de diseño
│       ├── components.md
│       ├── style-guide.md
│       └── user-flow.md
│
├── scripts/                    # Scripts auxiliares
│   ├── build.sh
│   ├── lint.sh
│   ├── setup.sh
│   └── test.sh
│
├── tasks/                      # Seguimiento de tareas
│   ├── plan.md                 #   Plan actual
│   └── todo.md                 #   Lista de tareas
│
├── src/                        # Código fuente
└── tests/                      # Tests
```

---

## Configuración

### Personalizar Skills
Cada skill en `skills/` se puede modificar para adaptarlo a tu stack. Ver [CONTRIBUTING.md](CONTRIBUTING.md#añadir-una-nueva-skill) para crear skills propios.

### Comandos y Agentes
Los comandos slash y agentes se cargan automáticamente desde `commands/` y `.opencode/agents/`.

---

## Documentación

| Guía | Descripción |
|------|-------------|
| [Guía Skills](skills/using-agent-skills/SKILL.md) | Referencia detallada de todos los skills |
| [Guía de agentes](docs/opencode/02-orchestration-patterns.md) | Personas de agentes y orquestación |
| [Guía de usuario](docs/opencode/USER_GUIDE.md) | Guía completa de uso y troubleshooting |
| [Contribuir](CONTRIBUTING.md) | Directrices de contribución |

---

## Troubleshooting

| Problema | Causa posible | Solución |
|----------|---------------|----------|
| `/spec` no funciona | Plugin OpenCode no instalado | Ejecuta `cd .opencode && bun install` |
| Context7 da error de cuota | Límite de API alcanzado | Ejecuta `npx ctx7@latest login` o configura `CONTEXT7_API_KEY` |
| Los skills no cargan | Ruta incorrecta o sesión no reiniciada | Usa `skills/<skill-name>/SKILL.md` y reinicia OpenCode |
| Skills nuevos no reconocidos | Sesión con caché anterior | Reinicia OpenCode después de añadir skills en `skills/` |
| Agente no encontrado o no disponible | Agente deshabilitado u oculto en `opencode.json` | Revisa `"disable": true` o `"hidden": true` en `opencode.json` |
| Jupyter MCP no conecta | Servidor no iniciado o no habilitado | Inicia Jupyter (Docker/local) primero, luego cambia `jupyter.enabled` a `true` en `opencode.json` y reinicia |
| Excel MCP no arranca | `uvx` no instalado o dependencia faltante | Ejecuta `uvx excel-mcp-server stdio` para instalar automáticamente; requiere Python ≥3.10 |
| Git push falla con "repository moved" | URL remota apunta al repositorio antiguo | Ejecuta `git remote set-url origin https://github.com/Fisherk2/spec-driven-develop-opencode-workspace.git` |

---

## Licencia

MIT — Ver [LICENSE](LICENSE) para más detalles.

---

## Agradecimientos

Este proyecto no existiría sin el trabajo de:

- **[awesome-opencode](https://github.com/weisser-dev/awesome-opencode)** — Fuente de inspiración para la implementación de nuevas skills, los 90+ agentes especializados y la documentación de OpenCode.
- **[addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)** — Base de este proyecto. Este repositorio es un fork de ese trabajo, que sentó las bases del ecosistema de skills para agentes de IA.
- **[oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim/)** — Inspiración directa para la arquitectura de múltiples agentes principales y el diseño del sistema de orquestación mexica.

Gracias a sus autores y contribuyentes por su invaluable aporte a la comunidad.

---

*Última revisión: 2026-06-12*

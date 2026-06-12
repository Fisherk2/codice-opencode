# Contribuir

¡Gracias por tu interés en contribuir! Este proyecto es una colección de skills de ingeniería de grado de producción para agentes de codificación AI.

---

## Añadir una Nueva Skill

1. **Coloca la skill en la carpeta `skills/`**
   - Instálala manualmente creando `skills/<skill-name>/SKILL.md` con el formato adecuado
   - O instálala automáticamente con `find-skills` (que la descargará en la ubicación que indiques)
   - Asegúrate de que el nombre del directorio sea kebab-case

2. **Migra el directorio `references/` si existe**
   - Si la skill contiene un directorio `references/` interno, mueve **todo su contenido** a la carpeta raíz `references/` del proyecto
   - Esto mantiene el material de referencia centralizado y accesible para todas las skills
   - Elimina el directorio `references/` vacío dentro de la skill después de migrar

3. **Crea o ajusta el `SKILL.md`** siguiendo el formato definido en [docs/opencode/05-skills.md](docs/opencode/05-skills.md) (frontmatter, nomenclatura, anatomía) y la guía de estilo en [docs/ai-agent-setup/skill-anatomy.md](docs/ai-agent-setup/skill-anatomy.md)

4. **Actualiza la documentación de skills disponibles** (prioridad: meta-skill primero):
   - **[skills/using-agent-skills/SKILL.md](skills/using-agent-skills/SKILL.md)** — Añade la skill al árbol de "Skill Discovery" bajo la subsección **"Skill Extras"** y a la tabla "Quick Reference" con la fase **"Extra"**
   - **[docs/opencode/USER_GUIDE.md](docs/opencode/USER_GUIDE.md)** — Añade la skill a la tabla de fase apropiada y actualiza el árbol de estructura del proyecto

5. **Reinicia tu sesión de OpenCode** para que reconozca la nueva skill

### Estándar de Calidad de las Skills

Las skills deben ser:

- **Específicas** — Pasos accionables, no consejos vagos
- **Verificables** — Criterios de salida claros con requisitos de evidencia
- **Probadas en batalla** — Basadas en flujos de trabajo de ingeniería reales, no ideales teóricos
- **Mínimas** — Solo el contenido necesario para guiar al agente correctamente

### Estructura

Toda nueva skill debe tener:

- [SKILL.md](docs/opencode/05-skills.md) en el directorio de la skill (ver anatomía, frontmatter y nomenclatura en ese documento)
- Frontmatter YAML con `name` y `description` válidos

Para la anatomía detallada (secciones Overview, When to Use, Process, etc.), consulta [docs/opencode/05-skills.md](docs/opencode/05-skills.md).

### Qué No Hacer

- No dupliques contenido entre skills — referencia otras skills en su lugar
- No añadas skills que sean consejos vagos en lugar de procesos accionables
- No crees archivos de soporte a menos que el contenido supere las 100 líneas
- No pongas material de referencia dentro de los directorios de skills — usa `references/` en su lugar

---

## Añadir un Nuevo Agente

Para añadir un nuevo agente especializado, sigue estos pasos. El proyecto tiene **dos tipos de agente** con procedimientos distintos:

- **Subagente** (~96+ actualmente) — experto en un dominio concreto, invocado vía `task()` desde un agente primario
- **Agente primario** (6 actualmente: huitzilopochtli, quetzalcoatl, moctezuma, tlaloc, mictlantecuhtli, tezcatlipoca) — entrada principal para comandos slash, con capacidad de delegar a subagentes

### Añadir un Subagente

1. **Crea `agents/<nombre-agente>.md`** con el formato de frontmatter adecuado (simple para revisión/análisis, extendido para ejecución)

2. **Define el rol, alcance, formato de salida y reglas**

3. **Añade un bloque `## Composition` al final** siguiendo el formato estándar (Invoke directly when / Invoke via / Do not invoke from another persona)

4. **Actualiza el catálogo global** — Añade el agente a la tabla correspondiente en [docs/opencode/03-agent-index.md](docs/opencode/03-agent-index.md):
   - Si es de Ingeniería de Sistemas → añádelo a la sección `## 🖥️ Ingeniería de Sistemas`
   - Si es Multidisciplinar & Negocio → añádelo a la sección `## 🧩 Multidisciplinar & Negocio`

5. **Actualiza las tablas SUBAGENT DELEGATION de los agentes primarios** que puedan delegar a este nuevo agente. Esto es crítico — sin esto, el agente primario no sabrá que existe:
   - **[agents/quetzalcoatl.md](agents/quetzalcoatl.md)** — Si el agente es útil para análisis, revisión, especificaciones o documentación (code reviews, DB analysis, accessibility, research, etc.)
   - **[agents/tlaloc.md](agents/tlaloc.md)** — Si el agente es útil para implementación, build, testing o despliegue (lenguajes, frameworks, DevOps, DB, testing, etc.)
   - **[agents/mictlantecuhtli.md](agents/mictlantecuhtli.md)** — Si el agente es útil para testing, calidad, seguridad o despliegue (code review, security audit, testing, debugging, deployment, etc.)
   - Añade una fila a la tabla con: nombre del agente, qué hace mejor ("Best for"), y cuándo delegar ("Delegate when...")

6. **Actualiza el catálogo de huitzilopochtli** en [agents/huitzilopochtli.md](agents/huitzilopochtli.md):
   - Si el agente encaja en un dominio existente (Backend, Frontend, DevOps, etc.), añade su nombre a la lista separada por comas
   - Si el agente introduce un dominio nuevo, añade una fila nueva a la tabla "Catalog by Domain"

7. **Añade el nombre al Set `VALID_SUBAGENTS`** en [.opencode/plugins/sdd-pipeline.ts](.opencode/plugins/sdd-pipeline.ts). Este Set valida que los subagentes invocados vía `task()` existan en el catálogo. Si omites este paso, el plugin rechazará el subagente con un error: `Unknown subagent: <nombre>`. Consulta la tabla de dominios en [.opencode/plugins/README.md](.opencode/plugins/README.md#subagent-name-validation) para ver el formato correcto.

8. **Actualiza la tabla de dominios en [.opencode/plugins/README.md](.opencode/plugins/README.md#subagent-name-validation)** — Añade el nuevo subagente a la fila del dominio correspondiente e incrementa el contador de esa fila. Esta tabla debe reflejar exactamente el contenido de `VALID_SUBAGENTS` en `sdd-pipeline.ts`. Si omites este paso, la documentación del plugin quedará desactualizada.

9. **Reinicia tu sesión de OpenCode** para que reconozca el nuevo agente

### Añadir un Agente Primario

Los agentes primarios son entradas principales del pipeline SDD. Además de los pasos 1-3 de "Añadir un Subagente":

4. **Añade el agente al catálogo** en [docs/opencode/03-agent-index.md](docs/opencode/03-agent-index.md) (sección `## Primary Agents`)

5. **Añade el agente a la tabla** en [docs/opencode/02-orchestration-patterns.md](docs/opencode/02-orchestration-patterns.md) (sección `## Agent Personas`)

6. **Actualiza `docs/opencode/USER_GUIDE.md`** — Añade el agente a la tabla `## Agent Personas`

7. **Añade SUBAGENT DELEGATION section** al nuevo agente primario, siguiendo el patrón de los existentes (tabla de subagentes relevantes + reglas de delegación)

8. **Crea los hooks necesarios en el plugin SDD** (`.opencode/plugins/sdd-pipeline.ts`) si el agente necesita:
   - Patrón de identidad de alta confianza en `AGENT_IDENTITY_PATTERNS` (formato: `/You are \*\*Nombre\*\*/`)
   - Patrón de detección por keywords en `AGENT_DETECT_PATTERNS`
   - Mapeo de comandos slash en `COMMAND_AGENT_MAP` (si el agente tiene comandos asociados)
   - Patrón de mención en `AGENT_MENTION_PATTERNS` (formato: `/@nombre\b/i`)
   - Reglas de rol en `buildRoleRules()`
   - Agregar al Set `READ_ONLY_AGENTS` (si el agente es de solo lectura)
   - Sugerencias de fase en `PHASE_SUGGESTIONS` (si aplica)
   - Restricciones de herramientas en `tool.execute.before`

9. Si el agente habilita un nuevo patrón de orquestación, documéntalo en [docs/opencode/02-orchestration-patterns.md](docs/opencode/02-orchestration-patterns.md)

10. **Reinicia tu sesión de OpenCode**

### Reglas para Agentes y Subagentes

- Un agente es un único rol con un único formato de salida. Si necesitas un segundo rol, crea un segundo agente.
- **Los agentes primarios pueden delegar a subagentes** a través de `task()` para tareas especializadas y bien definidas. Los subagentes operan en subcontextos aislados y devuelven su resultado al agente primario. Esto no es persona-chaining — es delegación controlada dentro del mismo contexto.
- **Los subagentes NO delegan a otros subagentes.** Si un subagente necesita ayuda especializada, debe reportarlo al agente primario que lo invocó.
- **Los agentes primarios NO invocan a otros agentes primarios.** La composición entre primarios es responsabilidad de los comandos slash o del usuario.
- Un agente puede invocar skills (el *cómo*).
- Todo archivo de agente termina con un bloque "Composition" indicando dónde encaja.

### Formato del Archivo

El formato y las opciones de configuración (frontmatter YAML, modos, permisos, modelo) están documentados en [docs/opencode/01-agents.md](docs/opencode/01-agents.md). Usa los agentes existentes en `agents/` como referencia.

### Qué No Hacer

- No crear agentes que invoquen a otros agentes
- No añadir múltiples roles en un solo agente
- No duplicar funcionalidad existente

### Referencias

Para más información sobre formatos de agente, orquestación y catálogo completo:
- [docs/opencode/01-agents.md](docs/opencode/01-agents.md) — Configuración de agentes, frontmatter, permisos, modos
- [docs/opencode/02-orchestration-patterns.md](docs/opencode/02-orchestration-patterns.md) — Patrones de orquestación y agentes primarios
- [docs/opencode/03-agent-index.md](docs/opencode/03-agent-index.md) — Catálogo completo de agentes clasificados por dominio

---

## Añadir un Nuevo Comando

Los comandos slash son el punto de entrada principal para los usuarios. Cada comando activa un agente primario con un flujo de trabajo predefinido.

1. **Crea `commands/<nombre-comando>.md`** siguiendo el formato de frontmatter descrito en [docs/opencode/04-commands.md](docs/opencode/04-commands.md):
   ```yaml
   ---
   description: Verbo de acción + qué hace el comando
   agent: nombre-del-agente-primario
   ---
   ```

2. **Escribe el flujo del comando** como pasos numerados:
   - Skills referenciados inline donde se usan (`@skills/nombre-skill/SKILL.md`)
   - Usa el `question` tool en puntos de decisión (`Always use the question tool — never decide automatically`)
   - Si el agente no escribe código, incluye una instrucción de handoff: `Recommend the user run /build`

3. **Actualiza `docs/opencode/USER_GUIDE.md`**:
   - Añade el comando a la tabla `## Commands` con: Action, Command, Primary Agent, Principle
   - Añade el comando a la tabla Quick Start workflow si aplica
   - Actualiza el árbol de estructura del proyecto (commands count + entrada)

4. **Actualiza `docs/opencode/README.md`**:
   - Añade el comando a la tabla de fases del ciclo completo
   - Actualiza el diagrama Mermaid si el nuevo comando cambia el flujo SDD
   - Actualiza el conteo de comandos (línea de Características y estructura del proyecto)

5. **Actualiza el plugin SDD** si el comando introduce un nuevo mapping:
   - **[.opencode/plugins/sdd-pipeline.ts](.opencode/plugins/sdd-pipeline.ts)** — Añade el comando a `COMMAND_AGENT_MAP`
   - **[.opencode/plugins/README.md](.opencode/plugins/README.md)** — Añade el comando a la tabla Command-Agent Map

6. **Si el comando introduce una nueva fase SDD**, actualiza también:
   - **[docs/opencode/02-orchestration-patterns.md](docs/opencode/02-orchestration-patterns.md)** — Añade el comando a los patrones de orquestación

7. **Reinicia tu sesión de OpenCode** para que reconozca el nuevo comando

## Modificar Skills Existentes

- Mantén los cambios enfocados y mínimos
- Preserva la estructura y el tono existentes
- Verifica que el frontmatter YAML siga siendo válido después de las ediciones

---

## Reportar Problemas

Abre un issue si encuentras:

- Una skill que da orientación incorrecta o desactualizada
- Cobertura faltante para un flujo de trabajo de ingeniería común
- Inconsistencias entre skills

---

## Licencia

Al contribuir, aceptas que tus contribuciones serán licenciadas bajo la Licencia MIT.
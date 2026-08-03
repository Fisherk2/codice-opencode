# SDD Workflow Test — Hola Mundo

**Objetivo:** Probar el ciclo completo de SDD con los 13 comandos disponibles, uno por paso, cubriendo todos los agentes y fases del pipeline.
**Resultado esperado:** Una página web con "Hola Mundo" animada en el centro de la pantalla, auditada, simplificada, revisada, despachada, documentada, diagnosticada y evolucionada con un subtítulo nuevo.

> **Instrucciones:** Copia y pega cada prompt en orden. Observa qué agente se activa en cada paso y si el plugin inyecta las role rules correctas. El escenario es siempre el mismo: crear una página web con "Hola Mundo" animado en el centro de la pantalla.

---

## Paso 1 — ONBOARDING (`/help`)

**Agente esperado:** Huitzilopochtli
**Fase SDD:** onboarding

Paso de bienvenida. Verifica que Huitzilopochtli se active y muestre el menú de ayuda con las opciones disponibles.

```
/help Muéstrame los comandos disponibles y explícame el flujo de trabajo SDD que sigue Códice.
```

---

## Paso 2 — DEFINE (`/spec`)

**Agente esperado:** Quetzalcoatl
**Fase SDD:** define

Define la especificación del proyecto. Quetzalcoatl debe crear la documentación inicial (SPEC.md, AGENTS.md, docs/) sin escribir código.

```
/spec Quiero una página web sencilla que muestre "Hola Mundo" en el centro de la pantalla con una animación sutil de fade-in al cargar. HTML puro con CSS, sin dependencias externas.
```

---

## Paso 3 — DESIGN (`/design`)

**Agente esperado:** Quetzalcoatl
**Fase SDD:** define (design es soporte de /spec)

Diseña la apariencia visual. Quetzalcoatl debe crear docs/DESIGN.md con el sistema de diseño sin implementar código.

```
/design Quiero que mi página web tenga un diseño moderno y minimalista. El texto "Hola Mundo" debe estar en el centro exacto de la pantalla con una fuente elegante. Fondo oscuro, texto claro, animación fade-in. Guarda el diseño en docs/DESIGN.md.
```

---

## Paso 4 — PLAN (`/plan`)

**Agente esperado:** Moctezuma
**Fase SDD:** plan

Descompone el trabajo en tareas verificables. Moctezuma debe crear tasks/plan.md y tasks/todo.md sin escribir código.

```
/plan Divide esto en tareas pequeñas y verificables: 1) Crear el archivo HTML con la estructura básica, 2) Agregar CSS con centering y tipografía elegante, 3) Implementar la animación fade-in con keyframes. Cada tarea debe tener criterios de aceptación.
```

---

## Paso 5 — BUILD (`/build`)

**Agente esperado:** Tlaloc
**Fase SDD:** build

Implementa el código. Tlaloc debe crear el archivo HTML/CSS completo con "Hola Mundo" centrado y animado.

```
/build Implementa todas las tareas del plan: crea un archivo index.html con la estructura completa. HTML semántico, CSS con centering perfecto (flexbox), fondo oscuro (#0a0a0a), texto claro, fuente moderna (Inter o similar), y animación fade-in con keyframes en CSS puro.
```

---

## Paso 6 — TEST (`/test`)

**Agente esperado:** Mictlantecuhtli
**Fase SDD:** verify

Valida la implementación. Mictlantecuhtli debe verificar que el HTML sea válido, el CSS correcto, y no haya errores de sintaxis.

```
/test Verifica que el archivo index.html generado sea HTML válido, que el CSS esté correctamente estructurado, que la animación fade-in esté presente y funcional, y que no haya errores de sintaxis ni elementos huérfanos.
```

---

## Paso 7 — WEB PERF AUDIT (`/webperf`)

**Agente esperado:** Mictlantecuhtli (subagente `web-performance-auditor`)
**Fase SDD:** review (performance)

Auditoría de rendimiento web. Se ejecuta después de `/test` y antes de `/code-simplify` para que los hallazgos de rendimiento alimenten la simplificación. Verifica que se active el subagente `web-performance-auditor`.

```
/webperf Analiza el rendimiento de la página. Verifica que la animación use propiedades aceleradas por GPU (transform/opacity en lugar de top/left), que no haya layout shifts, que el CSS sea eficiente sin selectores anidados innecesarios, y que el archivo tenga un tamaño razonable.
```

---

## Paso 8 — CODE SIMPLIFY (`/code-simplify`)

**Agente esperado:** Tlaloc
**Fase SDD:** review (simplification)

Limpieza proactiva antes de la revisión. Tlaloc debe eliminar código muerto, reducir duplicación y simplificar sin cambiar el comportamiento. Incorpora los hallazgos de rendimiento del paso anterior.

```
/code-simplify Revisa el HTML/CSS generado y simplifica cualquier código innecesario. Elimina propiedades CSS redundantes, simplifica selectores, y mantén solo lo esencial para el "Hola Mundo" animado. Respeta los hallazgos de rendimiento de /webperf.
```

---

## Paso 9 — REVIEW (`/review`)

**Agente esperado:** Tezcatlipoca
**Fase SDD:** review

Revisión de cinco ejes: corrección, legibilidad, arquitectura, seguridad, rendimiento. Tezcatlipoca debe evaluar el código pulido por `/code-simplify` e incorporar los hallazgos de `/webperf`.

```
/review Revisa el código generado en index.html. Evalúa los cinco ejes: 1) ¿El HTML es válido y cumple el spec? 2) ¿El CSS es claro y mantenible? 3) ¿La animación es performante (GPU-accelerated)? 4) ¿No hay vulnerabilidades (XSS, etc.)? 5) ¿El diseño es limpio y minimalista? Incorpora los hallazgos de /webperf (paso 7) y valida que /code-simplify (paso 8) no alteró el comportamiento.
```

---

## Paso 10 — SHIP (`/ship`)

**Agente esperado:** Mictlantecuhtli
**Fase SDD:** ship

Preparación para lanzamiento. Mictlantecuhtli debe ejecutar el pre-launch checklist con fan-out paralelo (code-reviewer, security-auditor, test-engineer, accessibility-tester) y producir un veredicto GO/NO-GO.

```
/ship Prepara el archivo index.html para servir. Ejecuta el checklist de lanzamiento: verifica que el HTML funcione en navegador, que no haya problemas de seguridad, y que el archivo esté en su ubicación correcta. No necesitamos CI/CD, solo el veredicto GO/NO-GO.
```

---

## Paso 11 — DOCS UPDATE (`/docs-update`)

**Agente esperado:** Quetzalcoatl
**Fase SDD:** maintain

Actualización de documentación. Quetzalcoatl debe sincronizar la documentación con el estado actual del código, sin implementar cambios en el código.

```
/docs-update Actualiza la documentación del proyecto para reflejar el estado actual. Verifica que SPEC.md, README.md, CHANGELOG.md y docs/ estén sincronizados con el código implementado. Crea o actualiza los archivos que estén desactualizados.
```

---

## Paso 12 — DIAGNOSIS (`/diagnosis`)

**Agente esperado:** Quetzalcoatl
**Fase SDD:** maintain

Análisis y documentación de problemas. Quetzalcoatl debe analizar la página por posibles problemas y documentar hallazgos en docs/diagnosis/ sin implementar correcciones.

```
/diagnosis Analiza la página web que acabamos de crear. Busca posibles problemas: ¿hay oportunidades de mejora en accesibilidad? ¿El CSS podría ser más eficiente? ¿Hay algo que deba documentarse como deuda técnica? Documenta los hallazgos en docs/diagnosis/.
```

---

## Paso 13 — EVOLVE (`/evolve`)

**Agente esperado:** Quetzalcoatl
**Fase SDD:** define (loop)

Evolución del proyecto. Quetzalcoatl debe detectar que el proyecto es maduro, seguir la Ruta A (New Requirement), y definir un nuevo requisito sin implementar código. Esto cierra el ciclo SDD y prepara el loop de vuelta a `/plan`.

```
/evolve Necesito agregar un nuevo requisito: un subtítulo debajo de "Hola Mandarin" que diga "Hecho con SDD Pipeline" en letra más pequeña y con un color secundario sutil. Actualiza la especificación y documentación para reflejar este nuevo requisito. No implementes el código — solo define los cambios necesarios.
```

> `/evolve` debería activar Quetzalcoatl (no Tlaloc) y ejecutar el flujo de evolución: detectar proyecto maduro → Ruta A → actualizar especificación y documentación. No implementa código — solo define los nuevos requisitos. Después de este paso, el ciclo se repite con `/plan` → `/build` → `/test` → etc.

---

## Checklist de verificación

Después de completar los 13 pasos, verifica:

### Cobertura de comandos
- [ ] **Paso 1:** `/help` ejecutado — Huitzilopochtli respondió con el menú de bienvenida
- [ ] **Paso 2:** `/spec` ejecutado — Quetzalcoatl creó documentación inicial
- [ ] **Paso 3:** `/design` ejecutado — Quetzalcoatl creó docs/DESIGN.md
- [ ] **Paso 4:** `/plan` ejecutado — Moctezuma descompuso en tareas verificables
- [ ] **Paso 5:** `/build` ejecutado — Tlaloc implementó el código HTML/CSS
- [ ] **Paso 6:** `/test` ejecutado — Mictlantecuhtli validó la implementación
- [ ] **Paso 7:** `/webperf` ejecutado — `web-performance-auditor` auditó rendimiento
- [ ] **Paso 8:** `/code-simplify` ejecutado — Tlaloc simplificó el código
- [ ] **Paso 9:** `/review` ejecutado — Tezcatlipoca revisó en 5 ejes
- [ ] **Paso 10:** `/ship` ejecutado — Mictlantecuhtli preparó el lanzamiento
- [ ] **Paso 11:** `/docs-update` ejecutado — Quetzalcoatl sincronizó documentación
- [ ] **Paso 12:** `/diagnosis` ejecutado — Quetzalcoatl documentó hallazgos
- [ ] **Paso 13:** `/evolve` ejecutado — Quetzalcoatl definió nuevo requisito

### Agentes correctos
- [ ] Huitzilopochtli activado en `/help`
- [ ] Quetzalcoatl activado en `/spec`, `/design`, `/docs-update`, `/diagnosis`, `/evolve`
- [ ] Moctezuma activado en `/plan` (no Quetzalcoatl)
- [ ] Tlaloc activado en `/build` y `/code-simplify`
- [ ] Mictlantecuhtli activado en `/test`, `/webperf`, `/ship`
- [ ] Tezcatlipoca activado en `/review`

### Plugin y role rules
- [ ] El plugin inyectó las role rules correctas en cada paso
- [ ] Cada comando cambió el agente correctamente (sin conflictos de estado previo)
- [ ] Cada comando actualizó `pipeline_phase` automáticamente

### Resultado final
- [ ] El archivo `index.html` (o similar) existe y se puede abrir en navegador
- [ ] El "Hola Mundo" se muestra centrado en pantalla con animación fade-in
- [ ] `/help` mostró el menú de bienvenida con opciones
- [ ] `/evolve` activó Quetzalcoatl (no Tlaloc ni Mictlantecuhtli)
- [ ] `/webperf` activó el subagente `web-performance-auditor`

---

## Bugs conocidos corregidos

- **Command override:** Los comandos `/plan`, `/build`, etc. ahora siempre cambian el agente, sin importar el estado anterior. Antes, si Quetzalcoatl ya estaba activo, `/plan` no cambiaba a Moctezuma.
- **Phase auto-update:** Los comandos ahora también actualizan `pipeline_phase` automáticamente (ej. `/plan` → fase `plan`).
- **Subagente faltante:** `web-performance-auditor` no estaba en el catálogo de Huitzilopochtli — corregido en `1c1fb4a`.

## Limpieza

Al terminar la prueba, descarta los cambios de prueba si no deben persistir: `git checkout -- .`

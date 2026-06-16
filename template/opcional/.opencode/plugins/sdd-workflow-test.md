# SDD Workflow Test — Hola Mundo

**Objetivo:** Probar el ciclo completo de SDD con los 6 agentes primarios.
**Resultado esperado:** Una página web con "Hola Mundo" animada en el centro de la pantalla, auditada en rendimiento, y evolucionada con documentación viva.

> ⚡ **Nuevos comandos probados en esta versión:** `/webperf` (step 8) y `/evolve` (step 12)

> **Instrucciones:** Copia y pega cada prompt en orden. Observa qué agente se activa en cada paso y si el plugin inyecta las role rules correctas.

---

## Paso 1 — DEFINE (`/spec`)

**Agente esperado:** Quetzalcoatl
**Fase SDD:** define

```
/spec Quiero una página web sencilla que muestre "Hola Mundo" en el centro de la pantalla. Solo eso, sin nada más. La página debe ser HTML puro con CSS y algo de animación sutil.
```

---

## Paso 2 — DESIGN (`/design`)

**Agente esperado:** Quetzalcoatl
**Fase SDD:** define (design es soporte de /spec)

```
/design Quiero que mi página web tenga un diseño moderno y minimalista. El texto "Hola Mundo" debe estar en el centro exacto de la pantalla con una fuente elegante. Agrega una animación sutil de fade-in al cargar.
```

---

## Paso 3 — PLAN (`/plan`)

**Agente esperado:** Moctezuma
**Fase SDD:** plan

```
/plan Divide esto en tareas pequeñas: 1) Crear el archivo HTML con la estructura básica, 2) Agregar CSS con centering y tipografía, 3) Implementar la animación fade-in.
```

---

## Paso 4 — BUILD (`/build`)

**Agente esperado:** Tlaloc
**Fase SDD:** build

```
/build Implementa el primer paso del plan: crea el archivo HTML con la estructura básica y el contenido "Hola Mundo". Incluye también el CSS para centrar el texto en pantalla.
```

---

## Paso 5 — BUILD continuación (`/build`)

**Agente esperado:** Tlaloc
**Fase SDD:** build

```
/build Implementa el paso 2: agrega CSS con una fuente moderna (Geist, Inter o similar), colores elegantes (fondo oscuro, texto claro), y centra el texto perfectamente en el viewport.
```

---

## Paso 6 — BUILD continuación (`/build`)

**Agente esperado:** Tlaloc
**Fase SDD:** build

```
/build Implementa el paso 3: agrega una animación de fade-in sutil al texto "Hola Mundo" cuando se carga la página. Usa CSS puro con keyframes.
```

---

## Paso 7 — TEST (`/test`)

**Agente esperado:** Mictlantecuhtli
**Fase SDD:** verify

```
/test Verifica que el archivo HTML generado sea válido, que el CSS esté correctamente estructurado, y que la animación fade-in esté presente en el código. Revisa que no haya errores de sintaxis.
```

---

## Paso 8 — WEBPERF (`/webperf`)

**Agente esperado:** Mictlantecuhtli
**Fase SDD:** review

Prueba el comando de auditoría de rendimiento web. Va **antes de /review** para que el revisor pueda incorporar los findings de rendimiento.

```
/webperf Analiza el rendimiento de la página. Verifica que la animación use propiedades aceleradas por GPU (transform/opacity), que no haya layout shifts, y que el CSS sea eficiente.
```

---

## Paso 9 — CODE SIMPLIFY (`/code-simplify`) — Recomendado

**Agente esperado:** Tlaloc
**Fase SDD:** review (simplification)

Limpieza proactiva **antes de la revisión**: elimina código muerto, reduce duplicación, simplifica condicionales. El revisor ve código ya pulido.

```
/code-simplify Si hay código innecesario o complejo en el HTML/CSS generado, simplifícalo. Mantén solo lo esencial para el "Hola Mundo" animado.
```

---

## Paso 10 — REVIEW (`/review`)

**Agente esperado:** Tezcatlipoca
**Fase SDD:** review

```
/review Revisa el código generado. Evalúa: ¿el HTML es válido? ¿El CSS usa buenas prácticas? ¿La animación es performante (usa transform/opacity)? ¿El diseño es limpio y minimalista? Incorpora los hallazgos de /webperf (paso 8). Revisa que /code-simplify (paso 9) no haya alterado el comportamiento esperado.
```

---

## Paso 11 — SHIP (`/ship`)

**Agente esperado:** Mictlantecuhtli
**Fase SDD:** ship

```
/ship Prepara el archivo final. Asegúrate de que esté listo para servir. No necesitamos CI/CD, solo verifica que el archivo sea funcional y esté en su ubicación correcta.
```

---

## Paso 12 — EVOLVE (`/evolve`)

**Agente esperado:** Quetzalcoatl
**Fase SDD:** define

Prueba el comando de ciclo de vida maduro. En esta etapa ya tenemos código estable (`index.html`), así que `/evolve` debe detectar que existe documentación/código y seguir la **ruta A (New Requirement)**.

```
/evolve Necesito agregar un subtítulo debajo de "Hola Mundo" que diga "Hecho con SDD Pipeline" en letra más pequeña y con un color secundario sutil. Actualiza la documentación del proyecto.
```

> `/evolve` debería activar Quetzalcoatl (no Tlaloc) y ejecutar el flujo de evolución: detectar proyecto estable → ruta A → actualizar especificación y documentación. No implementa código — solo define los nuevos requisitos.

### Continuación opcional — Segundo ciclo SDD

Si quieres probar el ciclo SDD completo con `/evolve`, continúa con:

```
/plan Desglosa en tareas: 1) Agregar el subtítulo al HTML, 2) Agregar estilos CSS para el subtítulo, 3) Actualizar documentación.

/build Implementa los pasos 1 y 2: agrega el subtítulo "Hecho con SDD Pipeline" debajo de "Hola Mundo" con estilo secundario.

/test Verifica que el HTML sea válido, que el subtítulo se renderice correctamente, y que la documentación refleje el cambio.

/webperf Analiza el rendimiento de la página actualizada.

/code-simplify Simplifica cualquier código redundante después del cambio.

/review Revisa el código actualizado y la documentación. ¿Está todo consistente?

/ship Prepara la versión final con el subtítulo incluido. Verifica que el archivo esté listo.
```

---

## Checklist de verificación

Después de completar los pasos principales, verifica:

- [ ] **Pasos 1-2:** Quetzalcoatl respondió (no escribió código)
- [ ] **Paso 3:** Moctezuma descompuso en tareas (no escribió código)
- [ ] **Pasos 4-6:** Tlaloc escribió el código HTML/CSS
- [ ] **Paso 7:** Mictlantecuhtli validó el código
- [ ] **Paso 8:** `web-performance-auditor` auditó el rendimiento del HTML
- [ ] **Paso 9:** Tlaloc simplificó el código (limpieza proactiva pre-review)
- [ ] **Paso 10:** Tezcatlipoca revisó (incorporó findings de /webperf + validó /code-simplify)
- [ ] **Paso 11:** Mictlantecuhtli preparó el archivo final
- [ ] **Paso 12:** Quetzalcoatl se activó con `/evolve` (fase `define`, ruta A)
- [ ] El archivo `hola-mundo.html` (o similar) existe y se puede abrir en navegador
- [ ] El plugin inyectó las role rules correctas en cada paso
- [ ] **FIX VERIFICADO:** En el paso 3, Moctezuma se activó correctamente (no Quetzalcoatl)
- [ ] **NUEVO:** `/evolve` activa Quetzalcoatl (no Tlaloc ni Mictlantecuhtli)
- [ ] **NUEVO:** `/webperf` activa a `web-performance-auditor` subagente correctamente

## Bugs conocidos corregidos

- **Command override:** Los comandos `/plan`, `/build`, etc. ahora siempre cambian el agente, sin importar el estado anterior. Antes, si Quetzalcoatl ya estaba activo, `/plan` no cambiaba a Moctezuma.
- **Phase auto-update:** Los comandos ahora también actualizan `pipeline_phase` automáticamente (ej. `/plan` → fase `plan`).
- **Subagente faltante:** `web-performance-auditor` no estaba en el catálogo de Huitzilopochtli — corregido en `1c1fb4a`

## Limpieza

Al terminar la prueba, descarta los cambios de prueba si no deben persistir: `git checkout -- .`

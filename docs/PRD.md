# Product Requirements Document – Códice: Opencode Workspace Installer v1.0.0 (MVP)
**Fecha:** 2026-06-13 | **Autor:** Fisherk2 | **Estado:** Borrador (Pendiente de Aprobación)

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
| HU-01 | Dev Nuevo | Ejecutar un comando y seleccionar "Instalación Limpia" | Obtener una copia exacta y completa del template en mi directorio actual. | Alta | Se copian todos los archivos. Se crea `.opencode-version.json`. |
| HU-02 | Dev Experimentado | Ejecutar "Instalación a Proyecto" y ver un checklist de archivos opcionales | Añadir herramientas base sin sobrescribir mis `skills` o `agents` personalizados. | Alta | Archivos "Obligatorios" se sobrescriben. "Estándar/Opcional" se omiten si existen, o se muestran en checklist interactivo. |
| HU-03 | Dev Experimentado | Ejecutar "Actualizar Workspace" | Saber si hay una nueva versión en GitHub y aplicar solo los cambios necesarios. | Alta | El CLI consulta la API de GitHub. Si hay update, aplica fusión granular. Si no, muestra mensaje de "versión más reciente". |
| HU-04 | Mantenedor | Ejecutar `just test` o `make test` | Verificar que la lógica de fusión y la TUI funcionen correctamente antes de hacer un release. | Alta | Las pruebas unitarias (Bun/Vitest) y E2E (scripts de shell) pasan con >80% de cobertura. |
| HU-05 | Cualquiera | Que el instalador falle a mitad de proceso | Que mi proyecto no quede en un estado corrupto o a medias. | Alta | Si falla, el directorio `.opencode-staging/` se elimina y el proyecto original queda intacto (Atomicidad). |

## 4. Requisitos Funcionales
| REQ-ID | Descripción | Reglas de Negocio | Estado | Trazabilidad (TRD/Flow) |
|--------|-------------|-------------------|--------|--------------------------|
| RF-01 | Menú Interactivo TUI | Usar `@clack/prompts`. Debe ser intuitivo, con spinners y validación de entrada. | Pendiente | HU-01, HU-02, HU-03 |
| RF-02 | Motor de Fusión de Archivos | Evaluar archivo por archivo. Reglas: Obligatorio (sobrescribir), Estándar (omitir si existe), Opcional (checklist -> omitir si existe). | Pendiente | HU-02, HU-05 |
| RF-03 | Atomicidad de Operaciones | Toda escritura debe ocurrir primero en un directorio temporal (`.opencode-staging`). Solo al finalizar con éxito, se mueve a la ubicación final. | Pendiente | HU-05 |
| RF-04 | Gestión de Versiones Local | Crear/actualizar `.opencode-version.json` con el tag de la versión instalada (ej: "v1.0.0"). | Pendiente | HU-01, HU-03 |
| RF-05 | Consulta de Versión Remota | Consultar `GET https://api.github.com/repos/{owner}/{repo}/releases/latest`. Comparar con versión local usando semver. | Pendiente | HU-03 |

## 5. Requisitos No Funcionales
- **Rendimiento:** La consulta de versión remota debe tomar < 2 segundos. La extracción del template empaquetado debe tomar < 5 segundos.
- **Seguridad:** No ejecutar código arbitrario. Manejo seguro de permisos de archivos (preservar modos de ejecución si aplica). No exponer tokens en logs.
- **Usabilidad/Accesibilidad:** Mensajes de error claros y accionables (ej: "Permiso denegado en carpeta X, ejecute con sudo o revise permisos").
- **Disponibilidad/Recuperación:** Rollback automático en caso de interrupción (Fallo en disco lleno, Ctrl+C).

## 6. Métricas de Éxito (KPIs)
- **Métrica:** Tasa de éxito de instalación E2E. | **Valor Objetivo:** 100% en CI/CD. | **Método:** Pipeline de GitHub Actions.
- **Métrica:** Cobertura de pruebas (Unitarias + Integración). | **Valor Objetivo:** > 80%. | **Método:** `bun test --coverage`.
- **Métrica:** Tamaño del binario compilado. | **Valor Objetivo:** < 15 MB. | **Método:** `bun build` + análisis de tamaño.

## 7. Supuestos, Restricciones y Dependencias
- **Supuestos:** El usuario tiene permisos de escritura en el directorio de destino. El template está empaquetado dentro del binario (no requiere red para instalar, solo para actualizar).
- **Restricciones técnicas:** Desarrollado y compilado con Bun. Compatibilidad multiplataforma (Linux, macOS, Windows) debe ser considerada en las rutas de archivos (`path.join`).
- **Dependencias externas:** API de GitHub (sujeta a rate limit de 60 req/hora para IPs no autenticadas, suficiente para uso individual).

## 8. Control de Cambios
| Versión | Fecha | Autor | Cambio | Aprobado por |
|---------|-------|-------|--------|--------------|
| 0.1.0 | 2026-06-13 | Fisherk2 | Creación inicial del PRD basado en cuestionario de clarificación. | Pendiente |

---
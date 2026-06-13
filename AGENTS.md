# AGENTS.MD – Códice: Opencode Workspace Installer v1.0.0
**Fecha:** 2026-06-13 | **Autor:** Fisherk2 | **Estado:** Borrador

---

## 🎯 Contexto del Proyecto

### Descripción MVP y Propósito
**Códice** es un instalador/actualizador de línea de comandos (CLI) compilado con Bun, diseñado para desplegar plantillas de workspace de OpenCode de forma atómica, segura e inteligente. Su propósito técnico es automatizar la gestión de archivos de configuración, agentes, skills y comandos, resolviendo el problema de la fragmentación y pérdida de personalizaciones durante actualizaciones.

### Requisitos Funcionales y No Funcionales

| Categoría | Requisito | Prioridad | Criterio de Aceptación |
|-----------|-----------|-----------|------------------------|
| **Funcional** | Menú interactivo con 3 modos (Limpia, Proyecto, Actualizar) | Alta | TUI responde en <100ms, validación de entrada robusta |
| **Funcional** | Motor de fusión granular (Obligatorio/Estándar/Opcional) | Alta | 100% de archivos clasificados correctamente, cero pérdida de datos |
| **Funcional** | Atomicidad (Staging + Rename) | Alta | Interrupción no corrompe proyecto destino |
| **Funcional** | Consulta de versión remota (GitHub API) | Alta | Timeout de 3s, fallback a mensaje de error claro |
| **No Funcional** | Rendimiento | Alta | Instalación completa <5s (local), consulta API <2s |
| **No Funcional** | Portabilidad | Alta | Binarios para Linux, macOS, Windows (x64) |
| **No Funcional** | Seguridad | Alta | Prevención de Path Traversal, sin ejecución de código arbitrario |
| **No Funcional** | Observabilidad | Media | Logs estructurados en modo `--verbose` |

### Dominio y Límites del Sistema
- **Dominio:** Gestión de archivos, versionado semántico, interacción TUI.
- **Límites (In-Scope):** Instalación/actualización del template empaquetado, gestión de versiones local/remota.
- **Límites (Out-of-Scope):** Instalación de dependencias externas, soporte para múltiples fuentes de template, modificación de archivos del usuario post-instalación.

### Orden de Implementación Propuesto
1. **Núcleo de Dominio:** Entidades (`FileRule`, `SemanticVersion`), Servicios (`FileMergeEngine`, `VersionComparator`).
2. **Infraestructura:** Adaptadores (`BunFileSystem`, `GitHubRestClient`, `ClackPromptsAdapter`).
3. **Casos de Uso:** Orquestación de los 3 modos de instalación.
4. **CLI Entry Point:** Integración final y compilación.
5. **Testing & CI/CD:** Pruebas unitarias, E2E, y pipeline de GitHub Actions.

---

## 🏗️ Arquitectura y Diseño

### Patrones Arquitectónicos Aplicados
- **Clean Architecture (Robert C. Martin):** Separación estricta en capas (Domain → Application → Infrastructure) para garantizar que la lógica de negocio sea independiente de frameworks y detalles de implementación.
- **Dependency Inversion Principle (DIP):** Los casos de uso dependen de interfaces (`IFileSystem`, `IGitHubClient`), no de implementaciones concretas.
- **Strategy Pattern:** El `FileMergeEngine` utiliza estrategias de fusión (Obligatorio, Estándar, Opcional) intercambiables.
- **Command Pattern (implícito):** Cada modo de instalación (Limpia, Proyecto, Actualizar) se encapsula como un comando independiente.

### Diagrama de Componentes y Flujo de Datos

```mermaid
graph TD
    subgraph "Infrastructure Layer"
        FS[BunFileSystem Adapter]
        GH[GitHubRestClient]
        TUI[ClackPromptsAdapter]
    end

    subgraph "Application Layer"
        UC1[CleanInstallUseCase]
        UC2[ProjectInstallUseCase]
        UC3[UpdateWorkspaceUseCase]
    end

    subgraph "Domain Layer"
        ENT1[FileRule Entity]
        ENT2[WorkspaceVersion Entity]
        SRV1[FileMergeEngine Service]
        SRV2[VersionComparator Service]
    end

    TUI -->|User Input| UC1
    TUI -->|User Input| UC2
    TUI -->|User Input| UC3
    
    UC1 -->|Execute| SRV1
    UC2 -->|Execute| SRV1
    UC3 -->|Check Version| SRV2
    UC3 -->|Execute| SRV1
    
    SRV1 -->|Read/Write| FS
    SRV2 -->|HTTP GET| GH
    
    classDef domain fill:#f9f,stroke:#333,stroke-width:2px;
    class ENT1,ENT2,SRV1,SRV2 domain;
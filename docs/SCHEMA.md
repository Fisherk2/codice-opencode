# Database Schema – [Producto] v[MVP]
**Fecha:** [YYYY-MM-DD] | **Autor:** [Nombre]

## 1. Estrategia de Almacenamiento
- Tipo (SQL/NoSQL/Híbrido):
- Justificación arquitectónica:
- Motor y versión:

## 2. Modelo Entidad-Relación
- Diagrama lógico/físico (enlace o Mermaid)
- Reglas de normalización/desnormalización:

## 3. Esquema de Tablas/Colecciones
| Entidad | Campo | Tipo | Constraints | Índice | Nullable | Descripción |
|---------|-------|------|-------------|--------|----------|-------------|

## 4. Patrones de Acceso y Consultas Críticas
- Queries frecuentes:
- Estrategia de paginación/filtrado:
- Caché (qué, dónde, TTL):

## 5. Ciclo de Vida y Retención
- Creación, actualización, soft/hard delete:
- Archivado y políticas de retención:

## 6. Seguridad y Cumplimiento
- Cifrado en reposo/tránsito:
- Máscara de datos/PII:
- Auditoría (who/when/what):

## 7. Migraciones y Versionado
- Estrategia (forward-only, rollback safe):
- Herramienta:
- Convención de nombres: `YYYYMMDDHHMMSS_descripcion`

## 8. Trazabilidad
| Entidad/Campo | PRD REQ-ID | Componente | Caso de Uso |
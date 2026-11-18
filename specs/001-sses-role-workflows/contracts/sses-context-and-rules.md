# Contract: SsesContext, Business Rules, Web Crypto & Unit Tests

**Feature**: `001-sses-role-workflows`

## 1. Contrato de Utilidades Criptográficas (`src/utils/crypto.ts`)

| Función | Firma | Comportamiento |
|---------|-------|----------------|
| `canonicalStringify` | `(value: unknown) => string` | Serializa cualquier valor JSON ordenando claves alfabéticamente de forma recursiva para hashing determinístico. |
| `computeSha256Hex` | `(input: string) => Promise<string>` | Calcula el digest SHA-256 usando `globalThis.crypto.subtle.digest('SHA-256', ...)` y retorna 64 caracteres hexadecimales en minúscula. |
| `GENESIS_HASH` | `const string` | `'0'.repeat(64)` — hash anterior del primer registro del `audit_log`. |
| `computeAuditEntryHash` | `(payload: Omit<AuditLogEntry, 'hash'>) => Promise<string>` | Calcula SHA-256 sobre `canonicalStringify(payload)` encadenando `previousHash`. |
| `verifyAuditChain` | `(entries: AuditLogEntry[]) => Promise<IntegrityCheckResult>` | Recorre `entries` desde el índice `0`; valida `previousHash` contra `GENESIS_HASH` o el `hash` del registro previo y recalcula `computeAuditEntryHash`. Retorna `{ valid: boolean, totalVerified: number, brokenIndex: number | null, brokenEntryId: string | null, reason?: string }`. |

## 2. Contrato de Reglas de Negocio Puras (`src/utils/businessRules.ts`)

| Función | Firma | Regla de Negocio |
|---------|-------|------------------|
| `validarEstrategiaInput` | `(input, entidades) => ValidationResult` | Valida nombre no vacío, entidad existente con `estado === 'ACTIVA'` y `fechaFin > fechaInicio` (`FR-006`, `FR-007`). |
| `puedeEditarEstrategia` | `(estrategia: Estrategia) => boolean` | Retorna `true` únicamente si `estrategia.estado === 'SIN_ESTUDIANTES'` (`FR-008`, `FR-011`). |
| `aplicarEdicionEstrategia` | `(estrategia, cambios, entidades) => Estrategia` | Lanza error de negocio explícito si `estrategia.estado === 'CON_ESTUDIANTES'`; de lo contrario valida fechas y retorna la estrategia actualizada (`FR-011`). |
| `parsearDocumentosMasivos` | `(texto: string) => string[]` | Divide por saltos de línea, comas o `;`, limpia espacios, elimina vacíos y deduplica manteniendo orden (`FR-009`, `FR-010`). |
| `vincularEstudiantesAEstrategia` | `(estrategia, documentos, catalogoEstudiantes) => BulkLinkResult` | Resuelve documentos contra `catalogoEstudiantes`, ignora ya vinculados, agrega los nuevos, cambia `estado` a `'CON_ESTUDIANTES'` si `estudianteIds.length >= 1` y retorna `{ estrategiaActualizada, vinculados, yaVinculados, noEncontrados }` (`FR-009`..`FR-011`). |
| `validarAcompanamientoInput` | `(input, docentesEntidad) => ValidationResult` | Valida modalidad `INDIVIDUAL` (exactamente 1 docente) o `GRUPAL` (>= 2 docentes pertenecientes a la entidad de la estrategia) (`FR-014`). |
| `generarCuatroSemanasPendientes` | `(acompanamientoId: string, mes: string, estadoSincronizacion: EstadoSincronizacion) => SemanaSeguimiento[]` | Genera exactamente 4 semanas (`1..4`) en estado `'PENDIENTE'` con fechas programadas dentro del mes (`FR-015`). |
| `validarAvanceSemanal` | `(estado: EstadoSemana, motivo?: string) => ValidationResult` | Exige `motivo.trim().length >= 10` cuando `estado === 'NO_REALIZADO'` (`FR-016`, `FR-017`). |
| `enmascararDocumentoLey1581` | `(tipoDocumento: string, numeroDocumento: string) => string` | Enmascara PII conservando tipo y últimos 4 dígitos (ej. `CC ******4821`). Para documentos `<= 4` dígitos, enmascara con `******` para evitar exposición total (`FR-023`). |
| `calcularKpisCumplimiento` | `(estrategias, acompanamientos, referenciaIso?: string) => KpiResumen` | Calcula total de estrategias, estrategias `CON_ESTUDIANTES`, porcentaje de semanas `REALIZADO`, total de semanas `NO_REALIZADO` y lista de alertas de atraso (`FR-012`). |

## 3. Contrato del Contexto React (`src/context/SsesContext.tsx`)

Todas las acciones mutadoras pasan por un pipeline serializado (`commitMutation`) que:
1. Ejecuta la validación de negocio pura.
2. Calcula el nuevo estado y el snapshot `valoresAnteriores` / `valoresNuevos`.
3. Genera automáticamente un `AuditLogEntry` encadenado con `computeAuditEntryHash`.
4. Persiste en `localStorage` bajo la clave `sses_mvp_state_v1`.

### Acciones expuestas por `useSses()`
- `state: SsesState`
- `rolActivo: RolUsuario | null`
- `isReady: boolean` — `true` una vez inicializado/validado el estado y la cadena génesis.
- `seleccionarRol(rol: RolUsuario | null): void`
- `toggleModoOffline(): Promise<void>` — Alterna `isOffline`; al pasar de `true` a `false`, ejecuta automáticamente `sincronizarColaOffline()`.
- `crearEstrategia(input): Promise<MutationResult<Estrategia>>` → audita `CREAR_ESTRATEGIA`.
- `editarEstrategia(estrategiaId, cambios): Promise<MutationResult<Estrategia>>` → audita `EDITAR_ESTRATEGIA`.
- `vincularEstudiantes(estrategiaId, documentos: string[]): Promise<MutationResult<BulkLinkResult>>` → audita `VINCULAR_ESTUDIANTES`.
- `registrarAcompanamiento(input): Promise<MutationResult<Acompanamiento>>` → si `isOffline`, encola en `offlineQueue` con `Idempotency-Key` y marca `PENDIENTE_SINCRONIZACION`; si en línea, guarda como `SINCRONIZADO` y audita `REGISTRAR_ACOMPANAMIENTO`.
- `actualizarAvanceSemanal(acompanamientoId, semanaId, estado, motivo?): Promise<MutationResult<SemanaSeguimiento>>` → soporta modo offline con `Idempotency-Key` y audita `ACTUALIZAR_SEMANA`.
- `sincronizarColaOffline(): Promise<SyncResult>` → procesa `offlineQueue` deduplicando por `processedIdempotencyKeys`, actualiza registros a `SINCRONIZADO` y audita `SINCRONIZACION_OFFLINE`.
- `generarYDescargarReporteCsv(rol: 'FUNCIONARIO_MEN' | 'ENTE_CONTROL'): Promise<ConstanciaReporte>` → construye CSV (con máscara Ley 1581 si `ENTE_CONTROL`), calcula SHA-256 real, dispara descarga del archivo y audita `GENERAR_REPORTE_CSV`.
- `verificarIntegridadCadena(): Promise<IntegrityCheckResult>` → ejecuta `verifyAuditChain(state.auditLog)`.
- `restaurarDatosDeFabrica(): Promise<void>` → regenera datos sintéticos iniciales de Colombia con cadena génesis íntegra, limpia `offlineQueue` y sobrescribe `localStorage`.

## 4. Contrato de Pruebas Unitarias (`src/utils/businessRules.test.ts`)

**Restricción Constitucional (Principio VI)**: Único archivo de pruebas del proyecto, ejecutado con `npm test` (Vitest).

Contiene exactamente los **3 casos de prueba unitaria** definidos:
1. **Caso 1 — Bloqueo de edición con estudiantes**:
   - Verifica que una estrategia en `SIN_ESTUDIANTES` permite edición (`puedeEditarEstrategia === true` y `aplicarEdicionEstrategia` actualiza nombre/fechas).
   - Al vincular al menos 1 estudiante mediante `vincularEstudiantesAEstrategia`, verifica que cambia a `CON_ESTUDIANTES`, `puedeEditarEstrategia === false` y cualquier intento posterior de `aplicarEdicionEstrategia` es bloqueado con error explícito.
2. **Caso 2 — Generación de hash SHA-256**:
   - Verifica que `computeSha256Hex` (vía Web Crypto API `crypto.subtle.digest`) genera un hash hexadecimal válido de 64 caracteres idéntico al vector estándar SHA-256 conocido y determinístico; además valida que `verifyAuditChain` aprueba una cadena válida y detecta alteración al modificar un campo.
3. **Caso 3 — Enmascaramiento PII (Ley 1581)**:
   - Verifica que `enmascararDocumentoLey1581('CC', '1020304821')` produce `'CC ******4821'`, preservando únicamente los últimos 4 dígitos, y maneja de forma segura documentos cortos (`<= 4` dígitos) sin exponer información.

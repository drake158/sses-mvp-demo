# Data Model: Flujos Multi-Rol del MVP SSES (MEN Colombia)

**Feature**: `001-sses-role-workflows` | **Target File**: `src/types/sses.ts`

## 1. Tipos Enumerados y Auxiliares

```ts
export type RolUsuario =
  | 'FUNCIONARIO_MEN'
  | 'TUTOR'
  | 'ENTE_CONTROL'
  | 'OFICINA_TECNOLOGIA';

export type TipoDocumento = 'CC' | 'TI' | 'CE' | 'PPT';

export type EstadoEntidad = 'ACTIVA' | 'INACTIVA';

export type EstadoEstrategia = 'SIN_ESTUDIANTES' | 'CON_ESTUDIANTES';

export type ModalidadAcompanamiento = 'INDIVIDUAL' | 'GRUPAL';

export type EstadoSemana = 'PENDIENTE' | 'REALIZADO' | 'NO_REALIZADO';

export type EstadoSincronizacion = 'SINCRONIZADO' | 'PENDIENTE_SINCRONIZACION';

export type TipoAccionAuditoria =
  | 'INICIALIZACION_SISTEMA'
  | 'CREAR_ESTRATEGIA'
  | 'EDITAR_ESTRATEGIA'
  | 'VINCULAR_ESTUDIANTES'
  | 'REGISTRAR_ACOMPANAMIENTO'
  | 'ACTUALIZAR_SEMANA'
  | 'SINCRONIZACION_OFFLINE'
  | 'GENERAR_REPORTE_CSV'
  | 'RESTAURAR_DATOS_FABRICA';
```

## 2. Interfaces Estrictas Principales (`src/types/sses.ts`)

### `Entidad`
Representa una institución educativa colombiana del catálogo MEN.
- `id: string` — Identificador único (ej. `ENT-001`).
- `codigoDane: string` — Código DANE sintético de 12 dígitos.
- `nombre: string` — Nombre oficial sintético de la institución educativa.
- `municipio: string` — Municipio colombiano (ej. Bogotá D.C., Medellín, Cali, Barranquilla, Tunja).
- `departamento: string` — Departamento correspondiente.
- `estado: EstadoEntidad` — `'ACTIVA' | 'INACTIVA'`.

**Reglas**: Solo entidades con `estado === 'ACTIVA'` pueden seleccionarse al crear estrategias (`FR-006`).

### `Estudiante`
Representa un estudiante matriculado en una entidad educativa.
- `id: string` — Identificador único (ej. `EST-001`).
- `tipoDocumento: TipoDocumento` — `'CC' | 'TI' | 'CE' | 'PPT'`.
- `numeroDocumento: string` — Número de documento sintético (sin espacios).
- `nombreCompleto: string` — Nombre y apellidos ficticios colombianos.
- `entidadId: string` — Relación con `Entidad.id`.
- `grado: string` — Grado escolar (ej. `9°`, `10°`, `11°`).

**Reglas**: En vistas y exportaciones del `ENTE_CONTROL`, `tipoDocumento` + `numeroDocumento` deben mostrarse mediante `enmascararDocumentoLey1581` (ej. `CC ******4821`) (`FR-023`).

### `Docente`
Representa un docente vinculado a una entidad educativa.
- `id: string` — Identificador único (ej. `DOC-001`).
- `tipoDocumento: TipoDocumento`
- `numeroDocumento: string`
- `nombreCompleto: string`
- `entidadId: string` — Relación con `Entidad.id`.
- `area: string` — Área académica (ej. Matemáticas, Lenguaje, Ciencias Naturales).

**Reglas**: Sujeto a enmascaramiento Ley 1581 en vistas del `ENTE_CONTROL`. En acompañamientos `INDIVIDUAL` se selecciona exactamente 1 docente; en `GRUPAL`, 2 o más docentes de la entidad asociada a la estrategia (`FR-014`).

### `Tutor`
Representa un tutor territorial que registra acompañamientos mensuales.
- `id: string` — Identificador único (ej. `TUT-001`).
- `tipoDocumento: TipoDocumento`
- `numeroDocumento: string`
- `nombreCompleto: string`
- `zonaAsignada: string` — Zona territorial de Colombia (ej. Región Andina, Región Caribe).

**Reglas**: Sujeto a enmascaramiento Ley 1581 en vistas del `ENTE_CONTROL`.

### `Estrategia`
Representa una estrategia estudiantil gestionada por el Funcionario MEN.
- `id: string` — Identificador único (ej. `STR-001`).
- `nombre: string` — Nombre descriptivo de la estrategia (no vacío).
- `descripcion: string` — Objetivo o alcance pedagógico.
- `entidadId: string` — Relación con `Entidad.id` (debe estar `ACTIVA` al crear).
- `fechaInicio: string` — Fecha ISO `YYYY-MM-DD`.
- `fechaFin: string` — Fecha ISO `YYYY-MM-DD` (estrictamente `> fechaInicio`).
- `estado: EstadoEstrategia` — `'SIN_ESTUDIANTES' | 'CON_ESTUDIANTES'`.
- `estudianteIds: string[]` — Lista sin duplicados de `Estudiante.id` vinculados.
- `creadaEn: string` — Timestamp ISO 8601.
- `actualizadaEn: string` — Timestamp ISO 8601.

**Transición de estado (Irreversible)**:
```text
[Nueva Estrategia] ──► SIN_ESTUDIANTES (editable)
                             │
                             │ vincular >= 1 estudiante (individual o masivo)
                             ▼
                       CON_ESTUDIANTES (inmutable / edición bloqueada + banner explicativo)
```

### `SemanaSeguimiento`
Representa cada una de las 4 semanas autogeneradas dentro de un acompañamiento mensual.
- `id: string` — Identificador único (ej. `SEM-001-1`).
- `numeroSemana: 1 | 2 | 3 | 4`
- `fechaProgramada: string` — Fecha ISO `YYYY-MM-DD` estimada de cierre semanal.
- `estado: EstadoSemana` — `'PENDIENTE' | 'REALIZADO' | 'NO_REALIZADO'`.
- `motivoNoRealizado?: string` — Obligatorio y `motivo.trim().length >= 10` cuando `estado === 'NO_REALIZADO'`.
- `estadoSincronizacion: EstadoSincronizacion` — Refleja si el último cambio semanal está pendiente de sincronización offline.
- `actualizadaEn?: string` — Timestamp ISO 8601 del último reporte.

**Transición de estado**:
```text
PENDIENTE ──► REALIZADO
    │
    └───────► NO_REALIZADO (requiere motivo.trim().length >= 10)
```

### `Acompanamiento`
Representa un acompañamiento mensual registrado por un Tutor.
- `id: string` — Identificador único (ej. `ACO-001`).
- `estrategiaId: string` — Relación con `Estrategia.id`.
- `tutorId: string` — Relación con `Tutor.id`.
- `mes: string` — Periodo mensual `YYYY-MM` (ej. `2026-10`, `2026-11`).
- `modalidad: ModalidadAcompanamiento` — `'INDIVIDUAL' | 'GRUPAL'`.
- `docenteIds: string[]` — 1 elemento si `INDIVIDUAL`; >= 2 elementos si `GRUPAL`.
- `observaciones: string` — Resumen del acompañamiento.
- `semanas: SemanaSeguimiento[]` — Exactamente 4 semanas autogeneradas en `PENDIENTE`.
- `estadoSincronizacion: EstadoSincronizacion` — `'SINCRONIZADO' | 'PENDIENTE_SINCRONIZACION'`.
- `idempotencyKey: string` — Clave única que previene duplicados en sincronización offline.
- `creadoEn: string` — Timestamp ISO 8601.

### `ConstanciaReporte`
Representa la evidencia criptográfica de un reporte CSV descargado.
- `id: string` — Identificador único (ej. `REP-001`).
- `nombreArchivo: string` — Nombre del archivo descargado (ej. `sses-reporte-ley-2026-11-18.csv`).
- `generadoEn: string` — Timestamp ISO 8601.
- `rolGenerador: 'FUNCIONARIO_MEN' | 'ENTE_CONTROL'`
- `enmascaradoLey1581: boolean` — `true` para `ENTE_CONTROL`, `false` para `FUNCIONARIO_MEN`.
- `totalRegistros: number` — Cantidad de filas exportadas.
- `sha256: string` — Hash hexadecimal SHA-256 (64 caracteres) del contenido CSV exacto.

### `AuditLogEntry`
Representa una entrada inmutable y encadenada en el `audit_log`.
- `id: string` — Identificador secuencial (ej. `AUD-0001`).
- `secuencia: number` — Número entero consecutivo comenzando en `1`.
- `timestamp: string` — Timestamp ISO 8601.
- `rol: RolUsuario` — Perfil que ejecutó la acción.
- `accion: TipoAccionAuditoria` — Tipo de evento auditable.
- `entidadAfectada: string` — Tipo de recurso (ej. `Estrategia`, `Acompanamiento`, `SemanaSeguimiento`, `ConstanciaReporte`, `Sistema`).
- `registroId: string` — Identificador del registro afectado.
- `valoresAnteriores: Record<string, unknown> | null` — Snapshot JSON previo (`null` en creaciones).
- `valoresNuevos: Record<string, unknown> | null` — Snapshot JSON resultante.
- `previousHash: string` — Hash SHA-256 del registro anterior (`'0'.repeat(64)` para `secuencia === 1`).
- `hash: string` — Hash SHA-256 del contenido canónico de esta entrada incluyendo `previousHash`.

## 3. Estructuras de Estado Global y Cola Offline

### `OfflineQueueItem`
- `idempotencyKey: string` — Clave única de idempotencia.
- `tipo: 'REGISTRAR_ACOMPANAMIENTO' | 'ACTUALIZAR_SEMANA'`
- `creadoEn: string` — Timestamp ISO 8601.
- `payload: Record<string, unknown>` — Datos serializables de la operación encolada.
- `registroId: string` — ID del acompañamiento o semana afectada.

### `SsesState` (persistido en `localStorage` bajo clave `sses_mvp_state_v1`)
- `version: number` — Versión de esquema (`1`) para recuperación segura ante cambios/corrupción.
- `entidades: Entidad[]`
- `estudiantes: Estudiante[]`
- `docentes: Docente[]`
- `tutores: Tutor[]`
- `estrategias: Estrategia[]`
- `acompanamientos: Acompanamiento[]`
- `constanciasReportes: ConstanciaReporte[]`
- `auditLog: AuditLogEntry[]`
- `offlineQueue: OfflineQueueItem[]`
- `processedIdempotencyKeys: string[]`
- `isOffline: boolean`

## 4. Diseño del Conjunto de Datos Sintéticos Iniciales de Colombia (`src/data/seedData.ts`)

Para que el MVP sea inmediatamente demostrable en todos los perfiles desde el primer segundo:
- **Entidades Educativas (5)**: 4 `ACTIVA` (Bogotá D.C., Medellín, Cali, Barranquilla) y 1 `INACTIVA` (Tunja — para demostrar el rechazo/exclusión de entidades inactivas).
- **Estudiantes (12)**: Nombres y documentos colombianos ficticios (`TI` y `CC` de 8–10 dígitos), distribuidos en las entidades activas, dejando varios sin vincular para probar fácilmente búsqueda individual y carga masiva.
- **Docentes (8)**: 2 docentes por cada entidad activa, permitiendo probar tanto acompañamientos `INDIVIDUAL` (1 docente) como `GRUPAL` (2 docentes).
- **Tutores (3)**: Tutores ficticios asignados a zonas de Colombia.
- **Estrategias iniciales (3)**:
  1. Estrategia en estado `CON_ESTUDIANTES` con acompañamiento cumplido y 1 semana en atraso/alerta (para poblar KPIs y alertas de inmediato).
  2. Estrategia en estado `CON_ESTUDIANTES` con acompañamiento en progreso (semanas `REALIZADO`, `NO_REALIZADO` con motivo válido y `PENDIENTE` vencida).
  3. Estrategia en estado `SIN_ESTUDIANTES` (lista para que el evaluador pruebe edición libre y luego transición irreversible al vincular estudiantes).
- **Audit Log Génesis**: Generado de forma real mediante `crypto.subtle.digest` en la inicialización de fábrica (registro `AUD-0001` `INICIALIZACION_SISTEMA` + eventos base encadenados), de modo que presionar **"Verificar Integridad de Cadena"** inmediatamente al entrar reporte **100% cadena íntegra**.

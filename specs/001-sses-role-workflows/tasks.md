---

description: "Actionable, dependency-ordered task list for SSES MVP multi-role workflows"
---

# Tasks: Flujos Multi-Rol del MVP SSES (MEN Colombia)

**Input**: Design documents from `/specs/001-sses-role-workflows/`
**Prerequisites**: `plan.md`, `spec.md` (incluyendo aclaraciones de `Session 2026-11-18`), `research.md`, `data-model.md`, `contracts/sses-context-and-rules.md`, `contracts/ui-roles-and-exports.md`, `quickstart.md`

**Tests**: Por mandato constitucional (Principio VI de `.specify/memory/constitution.md`) y el plan técnico, se incluye estrictamente **un (1) único archivo de pruebas unitarias** en Vitest (`src/utils/businessRules.test.ts`) con los 3 casos requeridos (bloqueo de edición con estudiantes, generación/verificación SHA-256 y enmascaramiento PII Ley 1581), ejecutable vía `npm test`.

**Organization**: Las tareas están agrupadas por historia de usuario (US1–US5) para permitir implementación incremental y verificación independiente de cada perfil.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Ejecutable en paralelo (archivos distintos, sin dependencia de tareas incompletas)
- **[Story]**: Historia de usuario a la que pertenece la tarea (`[US1]` a `[US5]`); se omite en Setup, Foundational y Polish
- Todas las tareas incluyen rutas exactas de archivo

## Path Conventions

- **Proyecto único frontend**: `src/`, `.github/workflows/`, y archivos de configuración en la raíz del repositorio (`package.json`, `.npmrc`, `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización aislada del proyecto React 18 + TypeScript + Vite + Tailwind CSS v3, paleta MEN y despliegue GitHub Pages.

- [X] T001 Create `.npmrc` with `save-exact=true` and `.gitignore` excluding `node_modules/`, `dist/`, and `.venv/` at repository root
- [X] T002 Create `package.json` with exact React 18, TypeScript, Vite, Tailwind CSS v3.4, `lucide-react`, and Vitest dependencies plus scripts (`dev`, `build`, `preview`, `test: "vitest run"`) and install strictly into `./node_modules` via `npm install` (no `-g`)
- [X] T003 [P] Configure strict TypeScript compiler options in `tsconfig.json` and Vite static base `./` plus Vitest Node environment (`src/utils/businessRules.test.ts`) in `vite.config.ts`
- [X] T004 [P] Configure PostCSS in `postcss.config.js`, MEN institutional palette (`#1B365D`, `#0066CC`, `#00875A`, `#D97706`, `#DC2626`, `#F8FAFC`) in `tailwind.config.js`, base styles in `src/index.css`, and HTML shell in `index.html`
- [X] T005 [P] Create automated GitHub Pages deployment workflow (`npm ci`, `npm test`, `npm run build`, `upload-pages-artifact`, `deploy-pages`) in `.github/workflows/deploy.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tipos estrictos, criptografía Web Crypto nativa, reglas de negocio puras, exportador CSV, datos sintéticos de Colombia y `SsesContext` con auditoría encadenada automática y cola offline idempotente.

**⚠️ CRITICAL**: Ninguna historia de usuario (US1–US5) puede iniciarse hasta completar esta fase.

- [X] T006 Define all strict TypeScript interfaces and enums in `src/types/sses.ts` per `data-model.md`, enforcing canonical field types and constraints for `Entidad` (`Entidad.id`, `Entidad.codigoDane`, `Entidad.nombre`, `Entidad.municipio`, `Entidad.departamento`, `Entidad.estado`), `Estudiante` (`Estudiante.id`, `Estudiante.tipoDocumento`, `Estudiante.numeroDocumento`, `Estudiante.nombreCompleto`, `Estudiante.entidadId`, `Estudiante.grado`), `Docente` (`Docente.id`, `Docente.tipoDocumento`, `Docente.numeroDocumento`, `Docente.nombreCompleto`, `Docente.entidadId`, `Docente.area`), `Tutor` (`Tutor.id`, `Tutor.tipoDocumento`, `Tutor.numeroDocumento`, `Tutor.nombreCompleto`, `Tutor.zonaAsignada`), `Estrategia` (`Estrategia.id`, `Estrategia.nombre`, `Estrategia.descripcion`, `Estrategia.entidadId`, `Estrategia.fechaInicio`, `Estrategia.fechaFin`, `Estrategia.estado`, `Estrategia.estudianteIds`, `Estrategia.creadaEn`, `Estrategia.actualizadaEn`), `SemanaSeguimiento` (`SemanaSeguimiento.id`, `SemanaSeguimiento.numeroSemana`, `SemanaSeguimiento.fechaProgramada`, `SemanaSeguimiento.estado`, `SemanaSeguimiento.motivoNoRealizado`, `SemanaSeguimiento.estadoSincronizacion`, `SemanaSeguimiento.actualizadaEn`), `Acompanamiento` (`Acompanamiento.id`, `Acompanamiento.estrategiaId`, `Acompanamiento.tutorId`, `Acompanamiento.mes`, `Acompanamiento.modalidad`, `Acompanamiento.docenteIds`, `Acompanamiento.observaciones`, `Acompanamiento.semanas`, `Acompanamiento.estadoSincronizacion`, `Acompanamiento.idempotencyKey`, `Acompanamiento.creadoEn`), `ConstanciaReporte` (`ConstanciaReporte.id`, `ConstanciaReporte.nombreArchivo`, `ConstanciaReporte.generadoEn`, `ConstanciaReporte.rolGenerador`, `ConstanciaReporte.enmascaradoLey1581`, `ConstanciaReporte.totalRegistros`, `ConstanciaReporte.sha256`), `AuditLogEntry` (`AuditLogEntry.id`, `AuditLogEntry.secuencia`, `AuditLogEntry.timestamp`, `AuditLogEntry.rol`, `AuditLogEntry.accion`, `AuditLogEntry.entidadAfectada`, `AuditLogEntry.registroId`, `AuditLogEntry.valoresAnteriores`, `AuditLogEntry.valoresNuevos`, `AuditLogEntry.previousHash`, `AuditLogEntry.hash`), `OfflineQueueItem` (`OfflineQueueItem.idempotencyKey`, `OfflineQueueItem.tipo`, `OfflineQueueItem.creadoEn`, `OfflineQueueItem.payload`, `OfflineQueueItem.registroId`), and `SsesState` (`SsesState.version`, `SsesState.entidades`, `SsesState.estudiantes`, `SsesState.docentes`, `SsesState.tutores`, `SsesState.estrategias`, `SsesState.acompanamientos`, `SsesState.constanciasReportes`, `SsesState.auditLog`, `SsesState.offlineQueue`, `SsesState.processedIdempotencyKeys`, `SsesState.isOffline`)
- [X] T007 [P] Implement native Web Crypto SHA-256 utilities (`canonicalStringify`, `computeSha256Hex`, `GENESIS_HASH`, `computeAuditEntryHash`, `verifyAuditChain`) using `globalThis.crypto.subtle.digest` in `src/utils/crypto.ts` honoring `data-model.md` (`AuditLogEntry.secuencia`, `AuditLogEntry.previousHash`, `AuditLogEntry.hash`, `AuditLogEntry.valoresAnteriores`, `AuditLogEntry.valoresNuevos`) and `contracts/sses-context-and-rules.md`
- [X] T008 [P] Implement pure domain business rules (`validarEstrategiaInput`, `puedeEditarEstrategia`, `aplicarEdicionEstrategia`, `parsearDocumentosMasivos`, `vincularEstudiantesAEstrategia`, `validarAcompanamientoInput`, `generarCuatroSemanasPendientes`, `validarAvanceSemanal`, `enmascararDocumentoLey1581`, `calcularKpisCumplimiento`) in `src/utils/businessRules.ts` honoring `data-model.md` (`Entidad.estado`, `Estrategia.nombre`, `Estrategia.entidadId`, `Estrategia.fechaInicio`, `Estrategia.fechaFin`, `Estrategia.estado`, `Estrategia.estudianteIds`, `Estudiante.entidadId`, `Estudiante.tipoDocumento`, `Estudiante.numeroDocumento`, `Docente.entidadId`, `Acompanamiento.modalidad`, `Acompanamiento.docenteIds`, `Acompanamiento.semanas`, `SemanaSeguimiento.numeroSemana`, `SemanaSeguimiento.estado`, `SemanaSeguimiento.motivoNoRealizado`), applying the FR-009/FR-010 narrowing that `vincularEstudiantesAEstrategia` accepts only students where `Estudiante.entidadId === Estrategia.entidadId` (reporting rejected other-entity documents) and the FR-011 rule allowing additional student links while `Estrategia.estado === 'CON_ESTUDIANTES'` without unlocking base-field edits
- [X] T009 [P] Implement RFC-4180 UTF-8 BOM CSV builder, role-aware Ley 1581 masking, SHA-256 receipt creation, and browser download trigger in `src/utils/csvExport.ts` honoring `data-model.md` (`ConstanciaReporte.nombreArchivo`, `ConstanciaReporte.rolGenerador`, `ConstanciaReporte.enmascaradoLey1581`, `ConstanciaReporte.totalRegistros`, `ConstanciaReporte.sha256`, `Estudiante.tipoDocumento`, `Estudiante.numeroDocumento`) and `contracts/ui-roles-and-exports.md`
- [X] T010 Implement realistic Colombian synthetic seed generator (`buildInitialSsesState`) with 5 entities (4 `ACTIVA`, 1 `INACTIVA`), 12 students, 8 teachers, 3 tutors, 3 strategies (`SIN_ESTUDIANTES` and `CON_ESTUDIANTES`), monthly accompaniments with compliant/pending/overdue weeks, and a real Web Crypto genesis-chained `auditLog` in `src/data/seedData.ts` honoring `data-model.md` (`SsesState.version`, `SsesState.entidades`, `SsesState.estudiantes`, `SsesState.docentes`, `SsesState.tutores`, `SsesState.estrategias`, `SsesState.acompanamientos`, `SsesState.auditLog`)
- [X] T011 Implement `SsesProvider` and `useSses` hook with `localStorage` persistence (`sses_mvp_state_v1`, safe fallback on missing/corrupted storage), serialized async `commitMutation` pipeline that automatically appends a chained `AuditLogEntry` on every mutation, idempotent offline queue synchronization (`OfflineQueueItem.idempotencyKey`, `SsesState.offlineQueue`, `SsesState.processedIdempotencyKeys`, `SsesState.isOffline` per `data-model.md`), `simularAlteracionAuditoria` demo helper (FR-027), and `restaurarDatosDeFabrica` in `src/context/SsesContext.tsx`

**Checkpoint**: Base arquitectónica completa — las 5 historias de usuario pueden construirse y verificarse sobre `SsesContext` y `src/utils/`.

---

## Phase 3: User Story 1 - Acceso Multi-Rol sin Contraseña y Gestión del Escenario Demo (Priority: P1) 🎯 MVP

**Goal**: Permitir el ingreso inmediato sin contraseñas mediante un Selector Interactivo de Rol, alternar rápidamente entre los 4 perfiles desde el Navbar con estado preservado, ver datos sintéticos de Colombia precargados y ejecutar *"Restaurar datos de fábrica"*.

**Independent Test**: Abrir la aplicación desde cero, seleccionar cada uno de los 4 perfiles en el selector inicial, cambiar de rol desde el switcher rápido del Navbar verificando persistencia de datos, y ejecutar *"Restaurar datos de fábrica"* comprobando el reinicio limpio del estado y la cadena de auditoría.

### Implementation for User Story 1

- [X] T012 [P] [US1] Implement passwordless interactive 4-role selector landing screen with MEN institutional branding (`#1B365D`, `#0066CC`, `#F8FAFC`) in `src/components/layout/RoleSelector.tsx`
- [X] T013 [P] [US1] Implement persistent institutional `Navbar` with quick role switcher (`FUNCIONARIO_MEN`, `TUTOR`, `ENTE_CONTROL`, `OFICINA_TECNOLOGIA`), header connectivity simulator toggle (`"En línea / Sin conexión"` with queued item count badge), and `"Restaurar datos de fábrica"` confirmation control in `src/components/layout/Navbar.tsx`
- [X] T014 [US1] Wire `SsesProvider` in `src/main.tsx` and assemble application shell (`RoleSelector` when no role selected, `Navbar` + role container + safe initialization loader) in `src/App.tsx`

**Checkpoint**: User Story 1 completamente funcional e independientemente verificable (navegación multi-rol, estado persistido y restablecimiento de fábrica).

---

## Phase 4: User Story 2 - Gestión de Estrategias Estudiantiles, Inmutabilidad y Tablero de Cumplimiento (Priority: P1)

**Goal**: Habilitar al **Funcionario MEN** para crear estrategias en entidades activas (`fechaFin > fechaInicio`), editar estrategias en `SIN_ESTUDIANTES`, vincular estudiantes de la misma entidad de forma individual o masiva bloqueando permanentemente la edición en `CON_ESTUDIANTES` con banner explicativo, visualizar KPIs/alertas de atraso y descargar reportes CSV con constancia SHA-256.

**Independent Test**: Ingresar como Funcionario MEN, verificar rechazo de `fechaFin <= fechaInicio` y exclusión de entidad inactiva, crear estrategia `SIN_ESTUDIANTES`, editarla, vincular estudiantes individualmente y por carga masiva (incluyendo documento de otra entidad/inexistente/duplicado), confirmar bloqueo permanente con banner explicativo (permitiendo vincular estudiantes adicionales), revisar KPIs/alertas y descargar CSV con constancia SHA-256.

### Implementation for User Story 2

- [X] T015 [P] [US2] Implement reusable compliance KPI cards (total strategies, strategies with students, weekly completion percentage, delay alerts count) and overdue/delay alerts list with MEN semantic colors (`#00875A`, `#D97706`, `#DC2626`) in `src/components/common/KpiDashboard.tsx`
- [X] T016 [P] [US2] Implement SHA-256 `ConstanciaReporte` receipt panel with copy-to-clipboard hash and history display in `src/components/common/ReportReceiptCard.tsx`
- [X] T017 [US2] Implement Funcionario MEN workspace (create strategy restricted to `Entidad.estado === 'ACTIVA'` with `Estrategia.fechaFin > Estrategia.fechaInicio`, edit form enabled only when `Estrategia.estado === 'SIN_ESTUDIANTES'`, permanent edit lock with red/amber explanatory immutability banner when `Estrategia.estado === 'CON_ESTUDIANTES'`, individual entity-filtered student search + bulk pasted document list with detailed summary per FR-009/FR-010/FR-011, `KpiDashboard`, and CSV download with SHA-256 receipt) in `src/components/roles/FuncionarioMenView.tsx`
- [X] T018 [US2] Connect `FuncionarioMenView` to `FUNCIONARIO_MEN` role routing inside `src/App.tsx`

**Checkpoint**: User Stories 1 y 2 operativas de forma independiente y completa.

---

## Phase 5: User Story 3 - Acompañamientos Mensuales, Seguimiento Semanal y Simulador Modo Offline (Priority: P2)

**Goal**: Habilitar al **Tutor** para registrar acompañamientos mensuales `INDIVIDUAL` (1 docente) o `GRUPAL` (>= 2 docentes de la entidad) autogenerando 4 semanas `PENDIENTE`, actualizar avances semanales (`REALIZADO` o `NO_REALIZADO` exigiendo motivo >= 10 caracteres útiles) y operar en modo simulado **"Sin conexión"** con cola local, insignia **"Pendiente de sincronización"** y sincronización automática idempotente al reconectar.

**Independent Test**: Ingresar como Tutor, registrar acompañamiento individual (1 docente) y verificar 4 semanas `PENDIENTE`, probar validación de motivo < 10 y >= 10 caracteres en `NO_REALIZADO`, activar toggle **"Sin conexión"** en el Navbar, registrar acompañamiento grupal (>= 2 docentes) y un avance semanal verificando insignia ámbar **"Pendiente de sincronización"**, y volver a **"En línea"** confirmando sincronización automática con 0 duplicados.

### Implementation for User Story 3

- [X] T019 [US3] Implement Tutor workspace (offline status banner, monthly accompaniment creation form enforcing `Acompanamiento.modalidad` + `Acompanamiento.docenteIds` per `data-model.md` and auto-generating 4 `PENDIENTE` weeks, accompaniment list with amber `"Pendiente de sincronización"` badges and `Acompanamiento.idempotencyKey`, and weekly progress controls enforcing `SemanaSeguimiento.estado` + `SemanaSeguimiento.motivoNoRealizado` >= 10 trimmed chars) in `src/components/roles/TutorView.tsx`
- [X] T020 [US3] Connect `TutorView` to `TUTOR` role routing inside `src/App.tsx`

**Checkpoint**: User Stories 1, 2 y 3 operativas de forma independiente, con sincronización offline idempotente verificada.

---

## Phase 6: User Story 4 - Supervisión en Solo Lectura y Protección de Datos Ley 1581 (Priority: P3)

**Goal**: Habilitar al **Ente de Control** con una vista estrictamente de solo lectura que muestre KPIs, estrategias, participantes y seguimientos con todos los números de documento enmascarados automáticamente (`CC ******4821`) y permita descargar reportes de ley CSV enmascarados con constancia SHA-256.

**Independent Test**: Ingresar como Ente de Control, verificar ausencia total de controles de escritura, comprobar enmascaramiento Ley 1581 en todas las tablas de estudiantes, docentes y tutores, y descargar un reporte de ley CSV verificando que los documentos dentro del archivo están enmascarados y se muestra la constancia SHA-256.

### Implementation for User Story 4

- [X] T021 [US4] Implement strictly read-only Ente de Control workspace (Ley 1581 compliance banner, `KpiDashboard`, read-only strategies/students/teachers/tutors/follow-ups tables applying `enmascararDocumentoLey1581` to every `Estudiante.numeroDocumento`, `Docente.numeroDocumento`, and `Tutor.numeroDocumento` per `data-model.md`, statutory CSV download with `ConstanciaReporte.enmascaradoLey1581 = true`, and `ReportReceiptCard`) in `src/components/roles/EnteControlView.tsx`
- [X] T022 [US4] Connect `EnteControlView` to `ENTE_CONTROL` role routing inside `src/App.tsx`

**Checkpoint**: User Stories 1–4 operativas de forma independiente con cumplimiento total de Ley 1581 en pantalla y CSV.

---

## Phase 7: User Story 5 - Consulta de Auditoría Inmutable y Verificación de Cadena Criptográfica (Priority: P3)

**Goal**: Habilitar a la **Oficina de Tecnología (Auditoría)** para consultar el `audit_log` inmutable (timestamp, rol, acción, JSON anterior vs. nuevo y hash SHA-256 encadenado), verificar la integridad criptográfica completa con **"Verificar Integridad de Cadena"** y demostrar la detección de alteraciones mediante **"Simular alteración (Demo)"**.

**Independent Test**: Ejecutar acciones en otros roles, ingresar como Oficina de Tecnología, inspeccionar los eventos en `audit_log` con su JSON anterior vs. nuevo y hashes encadenados, presionar **"Verificar Integridad de Cadena"** confirmando dictamen verde íntegro, luego accionar **"Simular alteración (Demo)"** y volver a verificar confirmando detección roja del primer registro alterado (y reversión limpia con *"Restaurar datos de fábrica"*).

### Implementation for User Story 5

- [X] T023 [US5] Implement Oficina de Tecnología (Auditoría) workspace (role/action filters, append-only `audit_log` table displaying `AuditLogEntry.secuencia`, `AuditLogEntry.timestamp`, `AuditLogEntry.rol`, `AuditLogEntry.accion`, `AuditLogEntry.previousHash`, `AuditLogEntry.hash` and expandable side-by-side JSON diff of `AuditLogEntry.valoresAnteriores` vs `AuditLogEntry.valoresNuevos` per `data-model.md`, `"Verificar Integridad de Cadena"` button with emerald/red verdict banner, and clearly labeled `"Simular alteración (Demo)"` button per FR-027) in `src/components/roles/AuditoriaView.tsx`
- [X] T024 [US5] Connect `AuditoriaView` to `OFICINA_TECNOLOGIA` role routing inside `src/App.tsx`

**Checkpoint**: Todas las 5 historias de usuario (4 perfiles + selector/fábrica) operativas e integradas.

---

## Phase 8: Polish, Unit Testing & Cross-Cutting Verification

**Purpose**: Implementar el único archivo de pruebas unitarias autorizado, validar compilación estática para GitHub Pages, ejecutar la guía `quickstart.md` con cero errores en consola y asegurar higiene final del repositorio.

- [X] T025 Implement the single authorized Vitest test file `src/utils/businessRules.test.ts` covering the 3 required unit test cases per `contracts/sses-context-and-rules.md`: (1) strategy edit lock once students are linked (`SIN_ESTUDIANTES` vs `CON_ESTUDIANTES`, including entity-match validation and additional linking), (2) real Web Crypto SHA-256 hash generation + audit chain integrity & tamper detection, and (3) Ley 1581 PII document masking (`CC ******4821` and short-document edge case)
- [X] T026 Run `npm test` and `npm run build` locally to confirm all 3 unit tests pass, TypeScript compiles with zero errors, and `dist/index.html` references relative `./` asset paths
- [X] T027 Execute end-to-end manual validation across all 6 scenarios in `specs/001-sses-role-workflows/quickstart.md` verifying zero browser console errors, offline sync idempotency, Ley 1581 CSV masking, audit tamper detection, and factory reset
- [X] T028 Remove the temporary `SYNC IMPACT REPORT` HTML comment from `.specify/memory/constitution.md` and verify constitutional compliance (`.npmrc` with `save-exact=true`, single test file `src/utils/businessRules.test.ts`, `base: './'` in `vite.config.ts`, `.github/workflows/deploy.yml`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup — T001..T005)**: Sin dependencias; inicia de inmediato.
- **Phase 2 (Foundational — T006..T011)**: Depende de Phase 1; **BLOQUEA** todas las historias de usuario (`T006` debe completarse antes de `T007`–`T011`; `T010` depende de `T006`–`T008`; `T011` depende de `T006`–`T010`).
- **Phase 3 (US1 — T012..T014)**: Depende de Phase 2 (`T011`). Entrega el shell multi-rol MVP.
- **Phase 4 (US2 — T015..T018)**: Depende de Phase 2 (`T011`) y `T014` para integrarse en `src/App.tsx`.
- **Phase 5 (US3 — T019..T020)**: Depende de Phase 2 (`T011`) y `T014`; independiente de US2 en desarrollo de vista.
- **Phase 6 (US4 — T021..T022)**: Depende de Phase 2 (`T011`) y reutiliza `KpiDashboard` (`T015`) y `ReportReceiptCard` (`T016`).
- **Phase 7 (US5 — T023..T024)**: Depende de Phase 2 (`T011`) y `T014`; independiente de US2–US4 en desarrollo de vista.
- **Phase 8 (Polish & Verification — T025..T028)**: `T025` puede ejecutarse tan pronto terminen `T007` y `T008`; `T026`–`T028` dependen de completar todas las fases previas.

### Parallel Opportunities

- **Setup**: `T003`, `T004`, `T005` en paralelo tras `T001`–`T002`.
- **Foundational**: `T007` (`crypto.ts`), `T008` (`businessRules.ts`) y `T009` (`csvExport.ts`) en paralelo tras `T006` (`sses.ts`).
- **US1**: `T012` (`RoleSelector.tsx`) y `T013` (`Navbar.tsx`) en paralelo.
- **US2**: `T015` (`KpiDashboard.tsx`) y `T016` (`ReportReceiptCard.tsx`) en paralelo antes de `T017` (`FuncionarioMenView.tsx`).
- **Cross-Story**: Tras completar `T014`–`T016`, las vistas `FuncionarioMenView.tsx` (`T017`), `TutorView.tsx` (`T019`), `EnteControlView.tsx` (`T021`) y `AuditoriaView.tsx` (`T023`) tocan archivos distintos y pueden construirse en paralelo.

---

## Parallel Example: Foundational & Role Views

```bash
# Fase 2 en paralelo tras T006 (src/types/sses.ts):
Task: "T007 [P] Implement native Web Crypto SHA-256 utilities in src/utils/crypto.ts"
Task: "T008 [P] Implement pure domain business rules in src/utils/businessRules.ts"
Task: "T009 [P] Implement RFC-4180 UTF-8 BOM CSV builder in src/utils/csvExport.ts"

# Vistas de roles en paralelo tras T014-T016:
Task: "T017 [US2] Implement Funcionario MEN workspace in src/components/roles/FuncionarioMenView.tsx"
Task: "T019 [US3] Implement Tutor workspace in src/components/roles/TutorView.tsx"
Task: "T021 [US4] Implement strictly read-only Ente de Control workspace in src/components/roles/EnteControlView.tsx"
Task: "T023 [US5] Implement Oficina de Tecnología (Auditoría) workspace in src/components/roles/AuditoriaView.tsx"
```

---

## Implementation Strategy

### MVP First (Phase 1 + Phase 2 + US1 + US2)

1. Completar **Phase 1 (Setup)** y **Phase 2 (Foundational)** para asegurar aislamiento `.npmrc`, Web Crypto SHA-256 real y `SsesContext` auditado.
2. Completar **Phase 3 (US1)** y **Phase 4 (US2)** para contar con un MVP demostrable completo del núcleo MEN (selector de roles, datos Colombia, estrategias inmutables, KPIs y CSV SHA-256).
3. Validar con `T025` (`src/utils/businessRules.test.ts`) y `npm run build`.

### Incremental Delivery

1. Setup + Foundational → Arquitectura base y reglas puras listas.
2. US1 → Navegación multi-rol sin login + *"Restaurar datos de fábrica"*.
3. US2 → Perfil Funcionario MEN completo.
4. US3 → Perfil Tutor + Modo Offline idempotente.
5. US4 → Perfil Ente de Control solo lectura + Ley 1581.
6. US5 → Perfil Oficina de Tecnología + verificación criptográfica de cadena y simulación de alteración.
7. Phase 8 → Pruebas unitarias Vitest, build estático GitHub Pages y validación integral `quickstart.md`.

---

## Notes

- Respetar estrictamente el Principio VI: **NO** crear archivos de prueba adicionales fuera de `src/utils/businessRules.test.ts`.
- Respetar estrictamente el Principio II: **NO** ejecutar `npm install -g`; todas las dependencias van en `./node_modules` con `.npmrc` (`save-exact=true`).
- Confirmar que toda mutación del estado pasa por `commitMutation` en `src/context/SsesContext.tsx` para garantizar continuidad criptográfica en `audit_log`.

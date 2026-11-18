# Contract: UI Role Workspaces, MEN Visual Palette & CSV Exports

**Feature**: `001-sses-role-workflows`

## 1. Paleta Institucional del MEN (Obligatoria — Principio IV)

| Token Tailwind | Hex | Uso Semántico |
|----------------|-----|---------------|
| `men-navy` | `#1B365D` | Encabezado principal, identidad MEN, títulos institucionales |
| `men-blue` | `#0066CC` | Botones primarios, enlaces, tabs activos, selector de rol |
| `men-emerald` | `#00875A` | Estados cumplidos (`REALIZADO`, cadena íntegra, sincronizado, entidad `ACTIVA`) |
| `men-amber` | `#D97706` | Alertas preventivas, modo **"Sin conexión"**, insignia **"Pendiente de sincronización"**, `PENDIENTE` |
| `men-red` | `#DC2626` | Bloqueos (`CON_ESTUDIANTES` banner de inmutabilidad), atrasos, `NO_REALIZADO`, cadena comprometida |
| `men-bg` | `#F8FAFC` | Fondo base general de la aplicación |

## 2. Shell Principal y Selector de Rol

- **Pantalla Inicial (`RoleSelector`)**:
  - Encabezado institucional MEN Colombia — SSES MVP Demo.
  - 4 tarjetas interactivas (sin contraseñas): Funcionario MEN, Tutor, Ente de Control, Oficina de Tecnología (Auditoría), cada una describiendo sus permisos y capacidades clave.
- **Navbar Persistente (`Navbar`)**:
  - Identidad SSES / MEN Colombia (click vuelve al selector inicial).
  - **Switcher rápido de rol** (`<select>` o grupo de botones accesibles) para cambiar al instante entre los 4 perfiles.
  - **Toggle Modo Offline ("En línea / Sin conexión")** visible en el header (con contador de cola cuando hay ítems pendientes de sincronización).
  - **Botón "Restaurar datos de fábrica"** con confirmación modal o doble paso para evitar clics accidentales.

## 3. Vistas por Perfil

1. **Funcionario MEN (`FuncionarioMenView`)**:
   - **Tablero de Cumplimiento**: Tarjetas KPI (Estrategias Totales, Con Estudiantes, % Cumplimiento Semanal, Alertas de Atraso) + panel de alertas en rojo/ámbar + botón **"Descargar Reporte CSV (SHA-256)"** con tarjeta de última constancia generada.
   - **Gestión de Estrategias**:
     - Formulario de creación (solo lista entidades con `estado === 'ACTIVA'`, validación inline `fechaFin > fechaInicio`).
     - Listado de estrategias con badge de estado (`SIN_ESTUDIANTES` vs `CON_ESTUDIANTES`).
     - Modal/panel de edición habilitado únicamente en `SIN_ESTUDIANTES`.
     - En estrategias `CON_ESTUDIANTES`: botón de editar permanentemente deshabilitado + **banner explicativo visible** informando que la estrategia quedó inmutable tras vincular estudiantes.
     - Panel de vinculación de estudiantes con 2 pestañas: **Búsqueda individual** y **Carga masiva (pegar documentos)** mostrando resumen inmediato de vinculados, ya vinculados y no encontrados.

2. **Tutor (`TutorView`)**:
   - Indicador contextual cuando el toggle del header está en **"Sin conexión"** (en color ámbar `#D97706`), mostrando la cantidad de registros en cola local.
   - **Formulario de Acompañamiento Mensual**: selección de estrategia, tutor, mes (`YYYY-MM`), modalidad (`INDIVIDUAL` = selector único de 1 docente; `GRUPAL` = checkboxes multi-docente con validación >= 2 docentes de la entidad) y observaciones. Al guardar crea automáticamente 4 semanas `PENDIENTE`.
   - **Listado de Acompañamientos y Seguimiento Semanal**:
     - Muestra insignia ámbar **"Pendiente de sincronización"** + `Idempotency-Key` abreviado en registros creados/editados sin conexión.
     - Para cada acompañamiento despliega sus 4 semanas (`Semana 1` a `Semana 4`) con acción para marcar `REALIZADO` o `NO_REALIZADO` (desplegando campo obligatorio de motivo con contador y validación `>= 10` caracteres).

3. **Ente de Control (`EnteControlView`)**:
   - Banner superior de **Vista de Solo Lectura — Protección de Datos Ley 1581**.
   - KPIs de cumplimiento y alertas en modo solo lectura (sin ningún botón de crear, editar, vincular o registrar avance).
   - Tablas de estrategias, estudiantes vinculados, docentes y seguimientos mostrando todos los documentos enmascarados automáticamente (`CC ******4821`).
   - Botón **"Descargar Reporte de Ley CSV (SHA-256)"** que exporta con enmascaramiento Ley 1581 aplicado y muestra el historial de constancias SHA-256.

4. **Oficina de Tecnología — Auditoría (`AuditoriaView`)**:
   - Encabezado con botón prominente **"Verificar Integridad de Cadena"** que muestra resultado en verde esmeralda (`#00875A`) si toda la cadena SHA-256 coincide o en rojo (`#DC2626`) señalando el primer registro alterado.
   - Filtros por rol y tipo de acción.
   - Tabla/timeline inmutable del `audit_log` con `secuencia`, `timestamp`, `rol`, `accion`, `entidadAfectada`, `previousHash`, `hash` (copiable/verificable) y visor expandible lado a lado de `valoresAnteriores` vs `valoresNuevos` en JSON formateado.

## 4. Esquema de Reportes CSV Descargables

Columnas del archivo CSV (`UTF-8 con BOM`, separador `,`, RFC-4180):
`estrategia_id,estrategia_nombre,entidad_codigo_dane,entidad_nombre,estado_estrategia,fecha_inicio,fecha_fin,estudiante_documento,estudiante_nombre,semanas_realizadas,semanas_no_realizadas,semanas_pendientes,porcentaje_cumplimiento`

- Cuando `rolGenerador === 'ENTE_CONTROL'`, la columna `estudiante_documento` SIEMPRE contiene el valor devuelto por `enmascararDocumentoLey1581(tipoDocumento, numeroDocumento)` (ej. `CC ******4821`).
- Cuando `rolGenerador === 'FUNCIONARIO_MEN'`, contiene el documento institucional completo (`CC 1020304821`).
- El hash SHA-256 se calcula sobre el string exacto del archivo CSV descargado y se almacena en `ConstanciaReporte` y `AuditLogEntry`.

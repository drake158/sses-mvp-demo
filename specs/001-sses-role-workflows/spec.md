# Feature Specification: Flujos Multi-Rol del MVP SSES (MEN Colombia)

**Feature Branch**: `001-sses-role-workflows`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "El MVP no tendrá login real con contraseñas; iniciará con un Selector Interactivo de Rol (y un switcher rápido en el Navbar) para navegar entre 4 perfiles: 1. Funcionario MEN (crear estrategias asociadas a entidades educativas activas con fecha fin > fecha inicio, inmutabilidad SIN_ESTUDIANTES vs CON_ESTUDIANTES con asociación individual o masiva y banner explicativo, tablero de cumplimiento con KPIs/alertas de atraso y reportes CSV con constancia SHA-256); 2. Tutor (acompañamientos mensuales Individual/Grupal autogenerando 4 semanas PENDIENTE, simulador Modo Offline con toggle En línea/Sin conexión, cola local con badge Pendiente de sincronización y sincronización automática con Idempotency-Key, avance semanal REALIZADO o NO_REALIZADO con motivo >= 10 caracteres); 3. Ente de Control (vista solo lectura, indicadores y reportes de ley con constancia SHA-256, enmascaramiento automático Ley 1581 mostrando solo últimos 4 dígitos ej. CC ******4821); 4. Oficina de Tecnología / Auditoría (audit_log inmutable con timestamp, rol, acción, valores anteriores vs nuevos en JSON, hash SHA-256 encadenado al registro previo y botón Verificar Integridad de Cadena)."

## Clarifications

### Session 2026-11-18

- Q: Una vez que una estrategia pasa a estado `CON_ESTUDIANTES` y bloquea permanentemente la edición de sus datos base, ¿debe permitirse seguir vinculando estudiantes adicionales? → A: Bloquear permanentemente la edición de datos base de la estrategia (nombre, descripción, fechas y entidad) con banner explicativo, permitiendo seguir vinculando estudiantes adicionales.
- Q: Al vincular estudiantes a una estrategia (búsqueda individual o carga masiva), ¿deben aceptarse únicamente estudiantes de la misma entidad educativa de la estrategia o cualquiera del catálogo? → A: Permitir vincular únicamente estudiantes pertenecientes a la misma entidad educativa asociada a la estrategia, rechazando con aviso los documentos de otras entidades.
- Q: En la vista de Oficina de Tecnología (Auditoría), ¿incluir un botón auxiliar de demostración ("Simular alteración") junto a "Verificar Integridad de Cadena" o mantener la vista sin controles de alteración? → A: Incluir un botón claramente etiquetado como "Simular alteración (Demo)" para demostrar en vivo la detección de alteración criptográfica (reversible mediante "Restaurar datos de fábrica").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acceso Multi-Rol sin Contraseña y Gestión del Escenario Demo (Priority: P1)

Como evaluador o usuario de demostración del SSES, quiero iniciar la aplicación mediante un Selector Interactivo de Rol (sin formularios de inicio de sesión ni contraseñas) y cambiar rápidamente entre los 4 perfiles desde la barra de navegación superior, contando desde el primer momento con datos sintéticos realistas del sistema educativo colombiano y un control para restaurar los datos de fábrica.

**Why this priority**: Es la puerta de entrada obligatoria para navegar y demostrar los cuatro perfiles funcionales del SSES sin fricción de autenticación y garantiza demostraciones repetibles.

**Independent Test**: Se puede probar de forma independiente abriendo la aplicación desde cero, seleccionando cualquiera de los 4 perfiles en la pantalla inicial, alternando entre ellos desde el selector rápido de la barra superior, verificando la carga de datos colombianos realistas y ejecutando "Restaurar datos de fábrica" para confirmar que el escenario vuelve a su estado base limpio.

**Acceptance Scenarios**:

1. **Given** un usuario que ingresa a la aplicación por primera vez, **When** carga la vista inicial, **Then** el sistema presenta un Selector Interactivo de Rol con los 4 perfiles (Funcionario MEN, Tutor, Ente de Control y Oficina de Tecnología) sin solicitar usuario ni contraseña.
2. **Given** un usuario ubicado dentro de cualquiera de los 4 perfiles, **When** selecciona otro perfil en el selector rápido de la barra de navegación superior, **Then** la interfaz cambia inmediatamente a la vista y permisos del perfil elegido preservando los datos registrados en la sesión.
3. **Given** un usuario que ha creado o modificado registros durante una demostración, **When** acciona el botón "Restaurar datos de fábrica" y confirma la acción, **Then** el sistema restablece los datos sintéticos iniciales de Colombia, limpia cualquier operación pendiente de sincronización y reinicia el registro de auditoría a su estado base consistente.

---

### User Story 2 - Gestión de Estrategias Estudiantiles, Inmutabilidad y Tablero de Cumplimiento (Priority: P1)

Como **Funcionario MEN**, quiero crear estrategias estudiantiles vinculadas a entidades educativas activas, editarlas únicamente mientras no tengan estudiantes asociados, vincular estudiantes de forma individual o masiva (bloqueando permanentemente la edición a partir de ese momento), consultar el tablero de cumplimiento con indicadores y alertas de atraso, y descargar reportes en CSV con constancia criptográfica SHA-256.

**Why this priority**: Representa el núcleo operativo y regulatorio del SSES; todas las demás vistas (acompañamientos de tutores, vigilancia del ente de control y auditoría) dependen de la existencia de estrategias y estudiantes vinculados.

**Independent Test**: Se puede probar de forma independiente ingresando como Funcionario MEN, intentando crear una estrategia con fechas inválidas (rechazada), creando una estrategia válida en estado `SIN_ESTUDIANTES`, editándola exitosamente, vinculándole uno o más estudiantes (individual y masivamente) para verificar el bloqueo permanente con banner explicativo, revisando KPIs/alertas y descargando un reporte CSV con constancia SHA-256.

**Acceptance Scenarios**:

1. **Given** un Funcionario MEN en el módulo de creación de estrategias, **When** selecciona una entidad educativa activa e ingresa una fecha de fin posterior a la fecha de inicio, **Then** la estrategia se crea en estado `SIN_ESTUDIANTES` y queda habilitada para edición.
2. **Given** un Funcionario MEN creando o editando una estrategia, **When** ingresa una fecha de fin igual o anterior a la fecha de inicio, o intenta asociar una entidad educativa inactiva, **Then** el sistema impide guardar y muestra un mensaje de validación claro.
3. **Given** una estrategia en estado `SIN_ESTUDIANTES`, **When** el Funcionario MEN edita sus datos básicos (como nombre, descripción o fechas válidas), **Then** el sistema guarda los cambios y registra la modificación en auditoría.
4. **Given** una estrategia en estado `SIN_ESTUDIANTES`, **When** el Funcionario MEN vincula al menos un estudiante mediante búsqueda individual o carga masiva pegando una lista de números de documento, **Then** el estado cambia permanentemente a `CON_ESTUDIANTES`, las acciones de edición de la estrategia quedan deshabilitadas de forma irreversible y se muestra un banner explicativo indicando la regla de inmutabilidad.
5. **Given** una estrategia en estado `CON_ESTUDIANTES`, **When** el Funcionario MEN consulta el tablero de cumplimiento, **Then** visualiza los KPIs consolidados, las alertas de atraso correspondientes y puede generar un reporte descargable en CSV acompañado de su constancia SHA-256 visible y verificable.

---

### User Story 3 - Acompañamientos Mensuales, Seguimiento Semanal y Simulador Modo Offline (Priority: P2)

Como **Tutor**, quiero registrar acompañamientos mensuales individuales o grupales que generen automáticamente 4 semanas de seguimiento en estado `PENDIENTE`, reportar el avance semanal exigiendo justificación cuando no se realice, y operar en modo simulado sin conexión para encolar mis registros y sincronizarlos automáticamente al reconectar sin crear duplicados.

**Why this priority**: Modela el trabajo de campo de los tutores en territorio colombiano (donde la conectividad intermitente es crítica) y alimenta directamente los indicadores de cumplimiento del SSES.

**Independent Test**: Se puede probar ingresando como Tutor, registrando un acompañamiento individual (1 docente) y uno grupal (varios docentes) para verificar la creación automática de 4 semanas `PENDIENTE`, actualizando semanas a `REALIZADO` y `NO_REALIZADO` (validando motivo mínimo de 10 caracteres), y activando el interruptor "Sin conexión" para guardar registros en cola con insignia "Pendiente de sincronización" y luego reconectar comprobando sincronización automática sin duplicación.

**Acceptance Scenarios**:

1. **Given** un Tutor en línea seleccionando una estrategia activa, **When** registra un acompañamiento mensual en modalidad `Individual` seleccionando exactamente 1 docente (o en modalidad `Grupal` seleccionando 2 o más docentes de la estrategia), **Then** el sistema guarda el acompañamiento y genera automáticamente 4 semanas de seguimiento (Semana 1 a Semana 4) en estado `PENDIENTE`.
2. **Given** un acompañamiento con semanas en estado `PENDIENTE`, **When** el Tutor marca una semana como `REALIZADO`, **Then** el estado de la semana cambia a `REALIZADO` y se actualiza el porcentaje de cumplimiento visible en los tableros.
3. **Given** un acompañamiento con una semana en seguimiento, **When** el Tutor selecciona `NO_REALIZADO` e ingresa un motivo con menos de 10 caracteres (o vacío), **Then** el sistema rechaza el guardado e indica que el motivo debe tener al menos 10 caracteres; al ingresar 10 o más caracteres, guarda el estado `NO_REALIZADO` con su justificación.
4. **Given** un Tutor que activa el interruptor de conectividad en el encabezado al estado **"Sin conexión"**, **When** registra un nuevo acompañamiento o un avance semanal, **Then** el registro se almacena en la cola local del dispositivo con la insignia visible **"Pendiente de sincronización"** y una clave de idempotencia única (`Idempotency-Key`).
5. **Given** uno o más registros encolados con insignia "Pendiente de sincronización", **When** el Tutor cambia el interruptor a **"En línea"**, **Then** el sistema sincroniza automáticamente cada operación pendiente utilizando su `Idempotency-Key`, elimina la insignia de pendiente, garantiza que no se creen registros duplicados ante reintentos y registra los eventos correspondientes en auditoría.

---

### User Story 4 - Supervisión en Solo Lectura y Protección de Datos Ley 1581 (Priority: P3)

Como **Ente de Control**, quiero consultar los indicadores de cumplimiento y descargar reportes de ley en CSV con constancia SHA-256 dentro de una vista estrictamente de solo lectura, asegurando que todos los números de documento aparezcan enmascarados automáticamente mostrando solo los últimos 4 dígitos conforme a la Ley 1581.

**Why this priority**: Demuestra el cumplimiento normativo colombiano de transparencia y habeas data (Ley 1581 de 2012) en la rendición de cuentas hacia órganos de control.

**Independent Test**: Se puede probar ingresando como Ente de Control, verificando la ausencia total de botones o formularios de creación/edición, comprobando que todos los documentos de estudiantes, docentes y tutores en pantalla se muestran enmascarados (ej. `CC ******4821`), y descargando un reporte de ley CSV para confirmar tanto la constancia SHA-256 como el enmascaramiento de documentos dentro del archivo exportado.

**Acceptance Scenarios**:

1. **Given** un usuario en el perfil Ente de Control, **When** navega por el tablero de indicadores, listados de estrategias, participantes y seguimientos, **Then** la interfaz es estrictamente de solo lectura y no presenta ni permite ejecutar acciones de creación, edición, vinculación o registro de avances.
2. **Given** cualquier pantalla o tabla visible para el Ente de Control que muestre números de documento de identidad, **When** se despliega la información, **Then** todos los números de documento se muestran automáticamente enmascarados conservando únicamente el tipo de documento y los últimos 4 dígitos (por ejemplo, `CC ******4821`).
3. **Given** un Ente de Control que solicita un reporte de ley, **When** ejecuta la descarga del archivo CSV, **Then** el archivo descargado incluye los documentos enmascarados según la Ley 1581, se muestra la constancia criptográfica SHA-256 correspondiente al contenido generado y la generación del reporte queda registrada en auditoría.

---

### User Story 5 - Consulta de Auditoría Inmutable y Verificación de Cadena Criptográfica (Priority: P3)

Como miembro de la **Oficina de Tecnología (Auditoría)**, quiero inspeccionar el registro inmutable `audit_log` con el detalle de cada operación del sistema (marca de tiempo, rol, acción, comparación JSON de valores anteriores frente a nuevos y hash SHA-256 encadenado al registro previo) y ejecutar una verificación de integridad de toda la cadena para confirmar que no ha habido alteraciones.

**Why this priority**: Garantiza trazabilidad completa, no repudio y verificación técnica de integridad sobre todas las operaciones críticas del SSES.

**Independent Test**: Se puede probar realizando varias acciones previas en otros roles (crear estrategia, editarla, vincular estudiantes, registrar acompañamiento y descargar reporte), ingresando luego como Oficina de Tecnología para inspeccionar el `audit_log` cronológico con sus JSON de antes/después y hashes encadenados, y presionando "Verificar Integridad de Cadena" para recibir la confirmación de cadena íntegra (y validando que una alteración simulada sea detectada).

**Acceptance Scenarios**:

1. **Given** operaciones previas de creación, edición, vinculación de estudiantes, registro de acompañamientos/avances, sincronización o generación de reportes, **When** la Oficina de Tecnología consulta el `audit_log`, **Then** cada evento aparece registrado de forma inmutable con `timestamp`, rol ejecutor, nombre de acción, objeto JSON de valores anteriores frente a valores nuevos, hash previo y su propio hash SHA-256 encadenado.
2. **Given** un historial de registros en el `audit_log`, **When** el auditor acciona el botón **"Verificar Integridad de Cadena"**, **Then** el sistema recalcula los hashes SHA-256 en secuencia desde el registro génesis hasta el último registro y muestra un resultado explícito indicando que la cadena es íntegra junto con el total de registros verificados.
3. **Given** un `audit_log` en el que algún registro fue alterado (ya sea mediante el botón auxiliar **"Simular alteración (Demo)"** o por manipulación externa del almacenamiento), **When** el auditor acciona **"Verificar Integridad de Cadena"**, **Then** el sistema detecta la inconsistencia criptográfica, marca la verificación como fallida/comprometida e identifica el primer registro donde se rompió la cadena (pudiendo volver a un estado íntegro mediante "Restaurar datos de fábrica").

---

### Edge Cases

- **Carga masiva de documentos mixta o con duplicados**: Cuando el Funcionario MEN pega una lista con documentos válidos de la entidad, documentos de otra entidad educativa, documentos ya vinculados a la estrategia, duplicados repetidos en el mismo texto y números inexistentes, el sistema vincula únicamente los estudiantes válidos de la misma entidad aún no asociados, evita duplicados y presenta un resumen detallado de vinculados, omitidos por duplicidad, rechazados por pertenecer a otra entidad y no encontrados. Si ningún documento resulta válido, la estrategia permanece en `SIN_ESTUDIANTES`.
- **Bloqueo al intentar editar estrategia `CON_ESTUDIANTES`**: Incluso si se intenta invocar la edición por navegación directa o estado previo abierto, la regla de negocio impide modificar una estrategia con estado `CON_ESTUDIANTES` y mantiene visible el banner explicativo.
- **Entidades educativas inactivas**: Las entidades educativas marcadas como inactivas en el catálogo sintético no se permiten como destino al crear una nueva estrategia (y si se muestran en catálogos de referencia, se identifican claramente como inactivas y no seleccionables).
- **Acompañamiento grupal con menos de 2 docentes o individual sin docente**: El sistema impide guardar un acompañamiento `Individual` que no tenga exactamente 1 docente seleccionado, o uno `Grupal` con menos de 2 docentes seleccionados.
- **Motivo de `NO_REALIZADO` compuesto solo por espacios**: La validación de longitud mínima de 10 caracteres evalúa el texto sin espacios iniciales ni finales (*trimmed*), rechazando entradas como 10 espacios en blanco.
- **Reconexión repetida o doble clic durante sincronización offline**: Si el usuario alterna rápidamente entre "Sin conexión" y "En línea" o dispara dos veces el guardado de la misma operación encolada, la verificación de `Idempotency-Key` garantiza que el registro se aplique exactamente una vez sin duplicados.
- **Documentos cortos bajo Ley 1581**: Si un documento de identidad tiene 4 caracteres o menos, el enmascaramiento protege el valor sin exponer más dígitos ni fallar (por ejemplo, enmascarando con asteriscos cuando no haya prefijo ocultable o mostrando el formato seguro definido).
- **Restauración de datos con operaciones offline pendientes**: Al ejecutar "Restaurar datos de fábrica" mientras hay registros en la cola offline o el simulador está en "Sin conexión", el sistema limpia la cola pendiente, restablece los datos sintéticos y reinicia la cadena de auditoría de forma consistente.
- **Datos persistidos ausentes o dañados**: Si el almacenamiento local contiene información incompleta o corrupta al iniciar, el sistema se recupera automáticamente cargando los datos sintéticos iniciales de Colombia sin producir errores visibles para el usuario.

## Requirements *(mandatory)*

### Functional Requirements

#### Navegación, Perfiles y Escenario Base

- **FR-001**: El sistema MUST iniciar con un Selector Interactivo de Rol que permita elegir entre exactamente 4 perfiles —**Funcionario MEN**, **Tutor**, **Ente de Control** y **Oficina de Tecnología (Auditoría)**— sin requerir autenticación con usuario ni contraseña.
- **FR-002**: El sistema MUST incluir un selector rápido de rol permanente en la barra de navegación superior que permita cambiar entre los 4 perfiles en cualquier momento sin perder el estado de los datos actuales.
- **FR-003**: El sistema MUST precargar al inicio un conjunto de datos sintéticos realistas del contexto educativo colombiano (entidades educativas activas e inactivas, estudiantes, docentes, tutores, estrategias y registros iniciales consistentes) cuando no existan datos previos guardados en la sesión del usuario.
- **FR-004**: El sistema MUST proporcionar un botón visible **"Restaurar datos de fábrica"** que restablezca todos los datos, la cola de sincronización pendiente y el registro de auditoría al estado sintético inicial de Colombia.
- **FR-005**: El sistema MUST diferenciar visualmente los estados operativos (cumplimiento, alertas/modo sin conexión y bloqueos/atrasos) de manera coherente con la identidad visual institucional del MEN establecida en la constitución del proyecto.

#### Perfil 1: Funcionario MEN

- **FR-006**: El Funcionario MEN MUST poder crear estrategias estudiantiles asociadas únicamente a entidades educativas en estado **ACTIVA**.
- **FR-007**: Al crear o editar una estrategia, el sistema MUST validar que la fecha de fin sea estrictamente posterior a la fecha de inicio (`fecha_fin > fecha_inicio`) y bloquear el guardado con un mensaje claro cuando no se cumpla.
- **FR-008**: Toda estrategia nueva MUST crearse con estado inicial `SIN_ESTUDIANTES`, permitiendo su edición completa mientras permanezca en dicho estado.
- **FR-009**: El Funcionario MEN MUST poder asociar a una estrategia únicamente estudiantes pertenecientes a la misma entidad educativa asociada a dicha estrategia, mediante dos mecanismos: (a) búsqueda y selección individual filtrada por entidad, y (b) carga masiva pegando una lista de números de documento.
- **FR-010**: En la carga masiva de documentos, el sistema MUST ignorar duplicados ya vinculados, rechazar con aviso los documentos pertenecientes a otras entidades educativas, asociar los estudiantes válidos de la entidad de la estrategia y mostrar un resumen claro de cuántos documentos fueron vinculados, omitidos por duplicidad, rechazados por otra entidad o no encontrados.
- **FR-011**: Al asociar al menos 1 estudiante a una estrategia en estado `SIN_ESTUDIANTES`, el sistema MUST cambiar automáticamente su estado a `CON_ESTUDIANTES`, bloquear de forma permanente toda edición posterior de los datos base de la estrategia (nombre, descripción, fechas y entidad educativa) y mostrar un banner explicativo visible indicando la regla de inmutabilidad; la estrategia `CON_ESTUDIANTES` MUST seguir permitiendo la vinculación de estudiantes adicionales (sin desbloquear la edición de sus datos base).
- **FR-012**: El Funcionario MEN MUST disponer de un tablero de cumplimiento que muestre KPIs consolidados (como total de estrategias, estrategias con estudiantes, porcentaje de cumplimiento semanal y cantidad de alertas) y un listado de alertas de atraso.
- **FR-013**: El Funcionario MEN MUST poder generar y descargar reportes de cumplimiento en formato CSV acompañados de una constancia criptográfica SHA-256 calculada sobre el contenido exportado.

#### Perfil 2: Tutor

- **FR-014**: El Tutor MUST poder registrar acompañamientos mensuales vinculados a una estrategia, eligiendo modalidad **Individual** (exactamente 1 docente) o **Grupal** (2 o más docentes pertenecientes a la estrategia/entidad educativa asociada).
- **FR-015**: Al guardar un acompañamiento mensual, el sistema MUST autogenerar exactamente 4 semanas de seguimiento (Semanas 1 a 4) con estado inicial `PENDIENTE`.
- **FR-016**: El Tutor MUST poder actualizar el avance de cada semana de seguimiento a estado `REALIZADO` o `NO_REALIZADO`.
- **FR-017**: Cuando el Tutor marque una semana como `NO_REALIZADO`, el sistema MUST exigir un motivo obligatorio de al menos 10 caracteres útiles (excluyendo espacios iniciales y finales) antes de permitir el guardado.
- **FR-018**: El sistema MUST incluir en el encabezado un interruptor interactivo de simulación de conectividad (**"En línea"** / **"Sin conexión"**) accesible durante la operación del Tutor.
- **FR-019**: Cuando el Tutor guarde un acompañamiento mensual o un avance semanal mientras el interruptor esté en **"Sin conexión"**, el sistema MUST encolar la operación en almacenamiento local del dispositivo, asignarle un `Idempotency-Key` único y mostrar el registro en la interfaz con la insignia visible **"Pendiente de sincronización"**.
- **FR-020**: Cuando el interruptor regrese de **"Sin conexión"** a **"En línea"**, el sistema MUST sincronizar automáticamente todas las operaciones pendientes utilizando su `Idempotency-Key`, impidiendo la creación de registros duplicados incluso ante reintentos, retirando la insignia de pendiente y registrando las operaciones sincronizadas en auditoría.

#### Perfil 3: Ente de Control

- **FR-021**: El perfil Ente de Control MUST operar estrictamente en modo de solo lectura, sin exponer ni habilitar acciones de creación, edición, vinculación de estudiantes, registro de acompañamientos o cambio de avances.
- **FR-022**: El Ente de Control MUST poder consultar los indicadores de cumplimiento y los detalles de seguimiento en modo de solo lectura, así como descargar reportes de ley en formato CSV con constancia criptográfica SHA-256.
- **FR-023**: Bajo la regla de protección de datos personales (Ley 1581), el sistema MUST enmascarar automáticamente todos los números de documento visibles en las pantallas del Ente de Control y en los archivos CSV descargados por este perfil, preservando únicamente el tipo de documento y los últimos 4 dígitos (por ejemplo, `CC ******4821`).

#### Perfil 4: Oficina de Tecnología (Auditoría)

- **FR-024**: El sistema MUST mantener un registro de auditoría (`audit_log`) inmutable y de solo anexado (*append-only*) donde se registre automáticamente toda creación de estrategia, edición de estrategia, vinculación de estudiantes, registro de acompañamiento, actualización de avance semanal, sincronización offline y generación de reporte CSV.
- **FR-025**: Cada entrada del `audit_log` MUST contener: marca de tiempo (`timestamp`), rol que ejecutó la acción, tipo de acción, valores anteriores frente a valores nuevos en formato JSON estructurado, hash del registro anterior (`previousHash`) y hash SHA-256 propio calculado sobre el contenido del registro encadenado al hash previo.
- **FR-026**: La Oficina de Tecnología MUST poder visualizar el `audit_log` completo (con filtros o búsqueda básica por rol/acción) e inspeccionar la comparación JSON de valores anteriores vs. nuevos de cada evento.
- **FR-027**: La Oficina de Tecnología MUST contar con un botón **"Verificar Integridad de Cadena"** que recalcule secuencialmente el hash SHA-256 de todos los registros desde el origen y muestre un dictamen claro indicando si la cadena está íntegra o señalando exactamente el primer registro comprometido; adicionalmente, para facilitar demostraciones en vivo, la vista MUST ofrecer un botón auxiliar claramente rotulado **"Simular alteración (Demo)"** que altere un registro sin afectar los flujos normales de inmutabilidad (reversible con **"Restaurar datos de fábrica"**).

### Key Entities *(include if feature involves data)*

- **Entidad Educativa**: Institución educativa colombiana con identificador, código DANE sintético, nombre, municipio/departamento y estado (`ACTIVA` o `INACTIVA`).
- **Estudiante**: Persona matriculada en el catálogo sintético con tipo de documento, número de documento, nombre completo y entidad educativa asociada.
- **Docente**: Educador vinculado a una entidad educativa con tipo de documento, número de documento, nombre completo y área/asignatura.
- **Tutor**: Profesional asignado a acompañamientos con tipo de documento, número de documento, nombre completo y región/zona asignada.
- **Estrategia Estudiantil**: Iniciativa gestionada por el Funcionario MEN asociada a una Entidad Educativa activa, con nombre, descripción, fecha de inicio, fecha de fin, estado de inmutabilidad (`SIN_ESTUDIANTES` o `CON_ESTUDIANTES`) y lista de estudiantes vinculados.
- **Acompañamiento Mensual**: Sesión o ciclo mensual registrado por un Tutor para una estrategia, con mes/periodo, modalidad (`INDIVIDUAL` o `GRUPAL`), docente(s) participante(s), estado de sincronización (`SINCRONIZADO` o `PENDIENTE_SINCRONIZACION`), `idempotencyKey` y exactamente 4 semanas de seguimiento asociadas.
- **Semana de Seguimiento**: Unidad semanal (1 a 4) perteneciente a un Acompañamiento Mensual, con estado (`PENDIENTE`, `REALIZADO` o `NO_REALIZADO`), motivo obligatorio cuando es `NO_REALIZADO` (mínimo 10 caracteres), marca de atraso y fecha de actualización.
- **Operación Encolada Offline**: Registro pendiente almacenado en el dispositivo durante el modo "Sin conexión", identificado por un `idempotencyKey` único, tipo de operación, carga útil y estado de sincronización.
- **Constancia de Reporte CSV**: Registro de exportación generada por Funcionario MEN o Ente de Control que vincula el nombre del reporte, fecha/hora, rol generador, indicador de enmascaramiento Ley 1581 y el hash SHA-256 del contenido CSV.
- **Registro de Auditoría (`audit_log`)**: Evento inmutable con identificador secuencial, `timestamp`, `role`, `action`, `previousValues` (JSON), `newValues` (JSON), `previousHash` y `hash` (SHA-256 encadenado).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede seleccionar cualquiera de los 4 perfiles desde la pantalla inicial o alternar entre perfiles desde la barra superior en menos de 2 segundos y sin pasos de contraseña.
- **SC-002**: El 100% de las reglas de validación de negocio críticas —fecha fin posterior a fecha inicio, bloqueo irreversible al pasar a `CON_ESTUDIANTES`, generación automática de 4 semanas `PENDIENTE`, exigencia de motivo >= 10 caracteres en `NO_REALIZADO`, enmascaramiento Ley 1581 y verificación de cadena SHA-256— se cumplen consistentemente sin fallos inesperados ni interrupciones del flujo de usuario.
- **SC-003**: Un Funcionario MEN puede crear una estrategia, editarla en estado `SIN_ESTUDIANTES`, vincular un lote de estudiantes y descargar un reporte CSV con constancia SHA-256 en menos de 3 minutos en su primer intento.
- **SC-004**: El 100% de las operaciones realizadas por un Tutor en modo "Sin conexión" se encolan con insignia "Pendiente de sincronización" y se sincronizan automáticamente al volver a "En línea" con 0 registros duplicados.
- **SC-005**: El 100% de los números de documento visibles en la vista del Ente de Control y en sus reportes CSV descargados cumplen el formato enmascarado Ley 1581 (mostrando únicamente los últimos 4 dígitos).
- **SC-006**: El 100% de las acciones mutadoras y descargas de reportes quedan registradas en el `audit_log` y superan satisfactoriamente el recálculo completo mediante "Verificar Integridad de Cadena" en menos de 2 segundos para un historial típico de demostración (hasta 500 eventos).
- **SC-007**: Accionar "Restaurar datos de fábrica" devuelve toda la aplicación a su estado inicial sintético de Colombia en menos de 2 segundos con cadena de auditoría íntegra.

## Assumptions

- **Sin backend real ni autenticación**: El MVP es demostrativo y opera completamente en el cliente; los 4 perfiles se simulan mediante selección interactiva de rol y no requieren contraseñas ni tokens externos.
- **Separadores aceptados en carga masiva de documentos**: El campo de pegado masivo del Funcionario MEN acepta números de documento separados por saltos de línea, comas o puntos y comas, ignorando espacios sobrantes y líneas vacías.
- **Regla de docentes por modalidad**: En el registro de acompañamiento mensual del Tutor, la modalidad `Individual` exige exactamente 1 docente y la modalidad `Grupal` exige 2 o más docentes asociados a la entidad educativa de la estrategia seleccionada.
- **Definición operativa de alertas de atraso**: En el tablero de cumplimiento, una alerta de atraso se dispara cuando existen semanas de seguimiento vencidas en estado `PENDIENTE`, semanas marcadas como `NO_REALIZADO` o estrategias próximas a vencer con cumplimiento inferior al esperado (los datos sintéticos iniciales incluirán al menos un caso cumplido, un caso pendiente/alerta y un caso en atraso para hacer evidente la demostración).
- **Formato de enmascaramiento Ley 1581**: Para documentos estándar de más de 4 dígitos, se conserva el tipo de documento (ej. `CC`, `TI`) seguido de un espacio, asteriscos por cada dígito oculto (o mínimo 6 asteriscos como en `CC ******4821`) y los últimos 4 dígitos visibles.
- **Verificación de alteración en auditoría**: La cadena inicial precargada nace criptográficamente válida desde un registro génesis; el botón "Verificar Integridad de Cadena" valida tanto los registros precargados como todos los generados durante la sesión.
- **Idioma y contexto geográfico**: Toda la interfaz, etiquetas, mensajes de error y datos sintéticos están redactados en español de Colombia, usando nombres de instituciones, municipios y documentos estrictamente ficticios.

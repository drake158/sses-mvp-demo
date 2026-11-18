# Quickstart Validation Guide: Flujos Multi-Rol del MVP SSES

**Feature**: `001-sses-role-workflows`

Esta guía describe cómo instalar en completo aislamiento, verificar las pruebas unitarias, compilar para GitHub Pages y validar de punta a punta los 4 perfiles del MVP SSES.

## 1. Prerrequisitos y Aislamiento (Principio II)

- Node.js 20 LTS y npm (sin instalaciones globales `-g`).
- Verificar que existe `.npmrc` en la raíz con `save-exact=true`.
- Instalar dependencias estrictamente en `./node_modules`:

```powershell
npm install
```

## 2. Verificación Automatizada y Compilación (Principios V y VI)

1. **Ejecutar el único archivo de pruebas unitarias (`src/utils/businessRules.test.ts`)**:
   ```powershell
   npm test
   ```
   **Resultado esperado**: Los 3 casos unitarios (bloqueo de edición con estudiantes, generación/verificación SHA-256 y enmascaramiento PII Ley 1581) pasan al 100%.

2. **Compilar para producción (validando TypeScript y `base: './'`)**:
   ```powershell
   npm run build
   ```
   **Resultado esperado**: Compilación sin errores en `dist/` con referencias relativas `./assets/...`.

3. **Levantar vista previa local**:
   ```powershell
   npm run preview
   ```

## 3. Escenarios de Validación Funcional (Cero Errores en Consola)

Abrir DevTools del navegador (pestaña **Console**) y verificar cero errores durante todo el recorrido:

1. **Selector de Rol y Datos Iniciales (US1)**:
   - Al abrir la URL aparece el Selector Interactivo de Rol con los 4 perfiles y sin formulario de contraseña.
   - Seleccionar **Funcionario MEN** y verificar que el switcher rápido en el Navbar permite cambiar entre roles en 1 clic.
2. **Estrategias, Inmutabilidad y Reporte CSV (US2)**:
   - Intentar crear una estrategia con `fechaFin <= fechaInicio` → debe bloquearse con mensaje claro; verificar que la entidad inactiva no es seleccionable.
   - Crear una estrategia válida en estado `SIN_ESTUDIANTES`, editar su nombre exitosamente y luego vincular estudiantes (individualmente o pegando documentos en carga masiva).
   - Confirmar transición a `CON_ESTUDIANTES`, bloqueo irreversible de edición y aparición del banner explicativo.
   - Descargar el reporte CSV y comprobar la constancia SHA-256 visible.
3. **Tutor y Modo Offline Idempotente (US3)**:
   - Cambiar a **Tutor** desde el Navbar.
   - Registrar un acompañamiento `INDIVIDUAL` (1 docente) y comprobar la autogeneración de 4 semanas `PENDIENTE`.
   - Intentar marcar una semana como `NO_REALIZADO` con motivo de 5 caracteres → debe rechazarse; ingresar >= 10 caracteres → debe guardarse.
   - Cambiar el toggle del header a **"Sin conexión"**, registrar un acompañamiento `GRUPAL` (2 docentes) y confirmar la insignia ámbar **"Pendiente de sincronización"**.
   - Cambiar el toggle nuevamente a **"En línea"** y verificar sincronización automática sin duplicados.
4. **Ente de Control y Ley 1581 (US4)**:
   - Cambiar a **Ente de Control** y confirmar ausencia total de acciones de escritura.
   - Verificar que todos los documentos en pantalla y en el CSV de ley descargado aparecen enmascarados (`CC ******4821`) junto con su constancia SHA-256.
5. **Oficina de Tecnología — Auditoría (US5)**:
   - Cambiar a **Oficina de Tecnología** y verificar que todas las acciones anteriores aparecen en el `audit_log` con `timestamp`, rol, acción, JSON anterior vs. nuevo y hash SHA-256 encadenado.
   - Presionar **"Verificar Integridad de Cadena"** y confirmar el dictamen de cadena íntegra.
6. **Restaurar Datos de Fábrica (US1 / Principio III)**:
   - Presionar **"Restaurar datos de fábrica"** en el Navbar y verificar que el sistema vuelve al dataset sintético inicial de Colombia con cadena de auditoría íntegra.

Para el contrato detallado de funciones, interfaces y esquema CSV consultar [data-model.md](./data-model.md), [sses-context-and-rules.md](./contracts/sses-context-and-rules.md) y [ui-roles-and-exports.md](./contracts/ui-roles-and-exports.md).

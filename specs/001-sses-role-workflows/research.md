# Technical Research & Decisions: Flujos Multi-Rol del MVP SSES (MEN Colombia)

**Feature**: `001-sses-role-workflows` | **Date**: 2026-11-18

## 1. Framework de Estilos y Componentes UI

- **Decision**: Seleccionar **Tailwind CSS v3.4** junto con `lucide-react` para iconografía institucional limpia, descartando MUI v6.
- **Rationale**:
  - La constitución (Principio I) exige elegir una única opción entre Tailwind CSS o MUI v6 sin mezclar ambos.
  - Tailwind CSS genera un bundle CSS purgado extremadamente liviano (< 20 KB comprimido), ideal para despliegue estático rápido en GitHub Pages.
  - Permite definir tokens semánticos exactos de la paleta del MEN en `tailwind.config.js` (`men-navy: #1B365D`, `men-blue: #0066CC`, `men-emerald: #00875A`, `men-amber: #D97706`, `men-red: #DC2626`, `men-bg: #F8FAFC`) garantizando 100% fidelidad al Principio IV sin overrides complejos de tema.
  - Evita el peso de Emotion/MUI en `./node_modules` y acelera la compilación con Vite.
- **Alternatives considered**:
  - *MUI v6*: Provee componentes listos (tablas, diálogos), pero introduce mayor tamaño de paquete, dependencias de CSS-in-JS adicionales y mayor sobrecarga para personalizar exactamente los tokens gubernamentales en un MVP liviano.

## 2. Cálculo Real de SHA-256 con Web Crypto API Nativa

- **Decision**: Implementar un módulo puro `src/utils/crypto.ts` basado exclusivamente en `globalThis.crypto.subtle.digest('SHA-256', data)` usando `TextEncoder` y conversión hexadecimal en minúsculas de 64 caracteres.
- **Rationale**:
  - Cero librerías criptográficas externas (`crypto-js`, `js-sha256`, etc.), cumpliendo el requisito del usuario y manteniendo el bundle mínimo.
  - `globalThis.crypto.subtle` es nativo en todos los navegadores modernos bajo contextos seguros (`https://*.github.io`, `http://localhost`) y también está disponible de forma nativa en Node.js 18+/20+ dentro del entorno de pruebas de Vitest.
  - Para garantizar determinismo en el encadenamiento del `audit_log` (evitando falsos fallos por distinto orden de propiedades en objetos JSON), se implementará una serialización JSON canónica (`canonicalStringify`) que ordena recursivamente las claves de todo objeto antes de calcular el hash.
  - La cadena de auditoría iniciará con un `previousHash` génesis constante (`'0'.repeat(64)`). El payload hasheado de cada `AuditLogEntry` incluirá exactamente `{ id, timestamp, rol, accion, entidadAfectada, registroId, valoresAnteriores, valoresNuevos, previousHash }`.
- **Alternatives considered**:
  - *Librerías externas (`js-sha256` / `crypto-js`)*: Rechazadas explícitamente por el plan para evitar dependencias pesadas y aprovechar Web Crypto nativa.
  - *Hash síncrono no criptográfico*: Rechazado porque incumple la constancia real SHA-256 exigida por la especificación y las pruebas unitarias.

## 3. Pipeline Serializado de Mutaciones y Auditoría Automática en React Context

- **Decision**: Centralizar todas las operaciones mutadoras en `SsesContext` (`src/context/SsesContext.tsx`) a través de una función interna `commitMutation(...)` respaldada por una cola de promesas (`mutationQueueRef`) y una referencia sincronizada al último estado (`stateRef`).
- **Rationale**:
  - Como el cálculo de SHA-256 con `crypto.subtle.digest` es asíncrono, ejecutar dos mutaciones rápidas seguidas sobre un estado de React no serializado podría leer el mismo `previousHash` y romper la cadena del `audit_log`.
  - Encadenar cada mutación en una cola FIFO de promesas garantiza que:
    1. Toda mutación (creación/edición de estrategia, vinculación individual o masiva de estudiantes, registro de acompañamiento, avance semanal, sincronización offline y generación de reporte CSV) pase obligatoriamente por el mismo punto de escritura.
    2. Cada mutación calcule automáticamente el `AuditLogEntry` encadenado al último `hash` confirmado, actualice el estado de React y persista atómicamente en `localStorage`.
    3. Ningún componente UI pueda mutar el estado saltándose el registro de auditoría.
- **Alternatives considered**:
  - *`useReducer` síncrono + `useEffect` para auditar*: Rechazado porque separa la mutación de la generación del hash, complica capturar valores anteriores vs. nuevos exactos y puede producir entradas desordenadas o duplicadas en React 18 StrictMode.
  - *Redux Toolkit / Zustand*: Rechazados porque la constitución (Principio III) exige explícitamente `localStorage` + React Context.

## 4. Simulador de Modo Offline e Idempotencia (`Idempotency-Key`)

- **Decision**: Mantener en `SsesState` los campos `isOffline: boolean`, `offlineQueue: OfflineQueueItem[]` y `processedIdempotencyKeys: string[]`, todos persistidos en `localStorage`.
- **Rationale**:
  - Cuando el Tutor guarda un acompañamiento o un avance semanal con `isOffline === true`:
    - Se genera un `idempotencyKey` determinístico/único (UUID vía `crypto.randomUUID()` con fallback seguro).
    - El registro se refleja inmediatamente en la vista del Tutor con `estadoSincronizacion: 'PENDIENTE_SINCRONIZACION'` y la insignia ámbar **"Pendiente de sincronización"**, y la operación se añade a `offlineQueue`.
  - Cuando el interruptor cambia a `En línea` (`isOffline === false`):
    - Un efecto controlado dispara `sincronizarColaOffline()`, que recorre `offlineQueue` en orden FIFO.
    - Para cada ítem, verifica si `item.idempotencyKey` ya existe en `processedIdempotencyKeys`: si ya fue procesado, lo descarta sin duplicar; si es nuevo, marca el registro como `SINCRONIZADO`, agrega la clave a `processedIdempotencyKeys`, remueve el ítem de `offlineQueue` y registra el evento `SINCRONIZACION_OFFLINE` en el `audit_log`.
- **Alternatives considered**:
  - *Service Worker / IndexedDB real*: Descartado para este MVP porque añade complejidad de caché en GitHub Pages (`base: './'`) y no es necesario para demostrar fielmente la cola local, la insignia y la idempotencia exigidas.

## 5. Exportación CSV con Constancia SHA-256 y Enmascaramiento Ley 1581

- **Decision**: Crear `src/utils/csvExport.ts` para serializar reportes RFC-4180 con BOM UTF-8 (`\uFEFF`), aplicar automáticamente `enmascararDocumentoLey1581` cuando el rol es `ENTE_CONTROL`, calcular el SHA-256 sobre el texto CSV exacto y registrar una `ConstanciaReporte` + `AuditLogEntry`.
- **Rationale**:
  - El BOM UTF-8 asegura que tildes y la letra `ñ` (comunes en nombres y municipios colombianos) se abran correctamente en Microsoft Excel en español.
  - Calcular el hash sobre el contenido exacto descargado permite al usuario verificar de forma real la constancia SHA-256 con herramientas externas (`certutil -hashfile` / `sha256sum`).
  - La función de enmascaramiento es una regla pura compartida entre las vistas del Ente de Control y el exportador CSV, garantizando 100% consistencia en pantalla y en archivo.
- **Alternatives considered**:
  - *Generación de PDF con jsPDF*: Fuera de alcance; la especificación exige explícitamente reportes descargables en formato CSV con constancia SHA-256.

## 6. Navegación, Aislamiento de Entorno y Despliegue en GitHub Pages

- **Decision**:
  - Navegación controlada por estado de React (`rolActivo: RolUsuario | null` + pestañas internas por rol), evitando `BrowserRouter` y eliminando riesgos de errores 404 en GitHub Pages bajo subrutas.
  - `.npmrc` en la raíz con `save-exact=true` y dependencias instaladas exclusivamente en `./node_modules`.
  - `vite.config.ts` configurado con `base: './'`.
  - `.github/workflows/deploy.yml` usando `actions/checkout@v4`, `actions/setup-node@v4` (Node 20), `npm ci`, `npm test`, `npm run build` y publicación oficial con `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`.
- **Rationale**: Cumple íntegramente los Principios II, V y VI de la constitución, garantizando que el despliegue falle si la compilación o las pruebas unitarias fallan.
- **Alternatives considered**:
  - *React Router con HashRouter*: Innecesario para 4 vistas basadas en rol; el estado en memoria sincronizado con `SsesContext` es más simple, más rápido (< 100 ms de cambio de rol) y sin dependencias adicionales.

## 7. Estrategia de Pruebas Unitarias Focalizadas (Vitest)

- **Decision**: Configurar Vitest en `vite.config.ts` (o `vitest.config.ts` integrado) apuntando al único archivo `src/utils/businessRules.test.ts` ejecutado mediante `npm test` (`vitest run`), con exactamente los 3 casos unitarios requeridos.
- **Rationale**:
  - Cumple estrictamente el Principio VI de la constitución (1 único archivo de pruebas: `src/utils/businessRules.test.ts`) y los 3 casos solicitados explícitamente:
    1. Bloqueo de edición de estrategia cuando tiene estudiantes (`SIN_ESTUDIANTES` vs `CON_ESTUDIANTES`).
    2. Generación de hash SHA-256 real con Web Crypto API (y verificación de encadenamiento).
    3. Enmascaramiento PII bajo Ley 1581 (`CC ******4821` y casos borde).
  - Usar entorno `node` en Vitest permite ejecutar `crypto.subtle.digest` de forma nativa, instantánea y sin dependencias pesadas de simulación DOM.
- **Alternatives considered**:
  - *Jest + ts-jest + jsdom*: Descartado porque la constitución exige Vitest y Node nativo simplifica la ejecución de pruebas puras de reglas de negocio.

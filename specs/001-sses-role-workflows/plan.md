# Implementation Plan: Flujos Multi-Rol del MVP SSES (MEN Colombia)

**Branch**: `master` (`001-sses-role-workflows`) | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-sses-role-workflows/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Construir un MVP estático (*Frontend-Only*) en **React 18 + TypeScript + Vite + Tailwind CSS v3** para demostrar el sistema **SSES del Ministerio de Educación Nacional de Colombia** desplegable en GitHub Pages (`base: './'`). La arquitectura modular centraliza tipos estrictos en `src/types/sses.ts`, reglas de negocio puras en `src/utils/businessRules.ts`, hashing criptográfico real SHA-256 usando la **Web Crypto API nativa** (`crypto.subtle.digest`) en `src/utils/crypto.ts`, exportación CSV con enmascaramiento Ley 1581 en `src/utils/csvExport.ts` y un contexto React persistido en `localStorage` (`src/context/SsesContext.tsx`) cuyo pipeline serializado de mutaciones dispara automáticamente el registro encadenado en `audit_log`. La calidad se verifica con cero errores en consola y un único archivo de pruebas unitarias en Vitest (`src/utils/businessRules.test.ts`) con 3 casos focalizados: bloqueo de edición con estudiantes, generación/verificación de hash SHA-256 y enmascaramiento PII Ley 1581.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) sobre React 18.3 y Node.js 20 LTS (tooling local / CI)

**Primary Dependencies**: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss` v3.4 (opción única elegida frente a MUI v6), `postcss`, `autoprefixer`, `lucide-react`; cero librerías criptográficas externas (se usa Web Crypto API nativa `globalThis.crypto.subtle.digest`)

**Storage**: `localStorage` del navegador (`sses_mvp_state_v1`) coordinado mediante React Context (`SsesContext`) precargado con datos sintéticos de Colombia y botón *"Restaurar datos de fábrica"*

**Testing**: Vitest ejecutado localmente vía `npm test`, estrictamente acotado a un (1) archivo: `src/utils/businessRules.test.ts` (3 casos unitarios)

**Target Platform**: Navegadores modernos de escritorio y tablet (contexto seguro HTTPS en GitHub Pages y `http://localhost` en desarrollo)

**Project Type**: Static Single-Page Web Application (Frontend-Only MVP)

**Performance Goals**: Cambio instantáneo entre roles (< 2 s, objetivo real < 100 ms), recálculo completo de verificación de cadena SHA-256 en < 2 s para hasta 500 eventos, bundle estático liviano para carga rápida en GitHub Pages

**Constraints**: Cero instalaciones globales (`-g`), `.npmrc` con `save-exact=true`, dependencias estrictamente en `./node_modules`, paleta institucional MEN obligatoria (`#1B365D`, `#0066CC`, `#00875A`, `#D97706`, `#DC2626`, `#F8FAFC`), `base: './'` en `vite.config.ts`, despliegue automático en `.github/workflows/deploy.yml`, cero errores en consola del navegador

**Scale/Scope**: 4 perfiles funcionales sin login real (Funcionario MEN, Tutor, Ente de Control, Oficina de Tecnología), 9 interfaces estrictas de dominio, simulador offline con cola e `Idempotency-Key`, reportes CSV con constancia SHA-256 y `audit_log` criptográficamente encadenado

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio Constitucional | Pre-Phase 0 | Post-Phase 1 | Evidencia de Cumplimiento en el Diseño |
|--------------------------|-------------|--------------|----------------------------------------|
| **I. Arquitectura Estática Frontend-Only y Stack Controlado** | PASS | PASS | React 18 + TypeScript + Vite + **Tailwind CSS** (opción única fijada en `research.md`; sin MUI v6 ni backend). |
| **II. Aislamiento Estricto de Dependencias y Entorno** | PASS | PASS | `.npmrc` con `save-exact=true`, todas las dependencias en `./node_modules`, cero instalaciones `-g`, sin scripts Python requeridos. |
| **III. Persistencia Simulada y Datos Sintéticos de Colombia** | PASS | PASS | `SsesContext` + `localStorage` con recuperación segura ante corrupción, seed realista de Colombia en `src/data/seedData.ts` y botón *"Restaurar datos de fábrica"* en `Navbar`. |
| **IV. Identidad Visual Institucional del MEN** | PASS | PASS | Tokens exactos configurados en `tailwind.config.js` (`#1B365D`, `#0066CC`, `#00875A`, `#D97706`, `#DC2626`, `#F8FAFC`) y mapeo semántico documentado en `contracts/ui-roles-and-exports.md`. |
| **V. Despliegue Estático Reproducible en GitHub Pages** | PASS | PASS | `vite.config.ts` con `base: './'`, navegación por estado sin history fallback de servidor y `.github/workflows/deploy.yml` para GitHub Pages. |
| **VI. Calidad Funcional Cero-Errores y Pruebas Focalizadas** | PASS | PASS | Un único archivo de pruebas Vitest `src/utils/businessRules.test.ts` (3 casos definidos) vía `npm test`; validación manual de cero errores en consola en `quickstart.md`. |

**Gate Decision**: **APPROVED** — Sin violaciones ni excepciones pendientes antes ni después del diseño de Fase 1.

## Project Structure

### Documentation (this feature)

```text
specs/001-sses-role-workflows/
├── plan.md              # Este archivo (/speckit-plan)
├── research.md          # Decisiones técnicas de Fase 0
├── data-model.md        # Interfaces estrictas, transiciones y diseño de seed Colombia
├── quickstart.md        # Guía de validación local y escenarios E2E manuales
├── contracts/
│   ├── sses-context-and-rules.md  # Contratos de tipos, crypto, reglas, Context y 3 tests
│   └── ui-roles-and-exports.md    # Contratos de vistas por rol, paleta MEN y esquema CSV
└── tasks.md             # Salida de /speckit-tasks (NO creada por /speckit-plan)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    └── deploy.yml                   # CI/CD: npm ci, npm test, npm run build y GitHub Pages

.npmrc                               # save-exact=true (Principio II)
.gitignore                           # Excluye node_modules, dist, .venv
index.html                           # Título institucional MEN Colombia y raíz #root
package.json                         # Scripts dev, build, preview, test (vitest run)
postcss.config.js                    # PostCSS para Tailwind CSS
tailwind.config.js                   # Paleta institucional MEN (#1B365D, #0066CC, #00875A, #D97706, #DC2626, #F8FAFC)
tsconfig.json                        # TypeScript strict mode
vite.config.ts                       # base: './' y configuración de Vitest

src/
├── main.tsx                         # Punto de entrada React 18 + SsesProvider
├── App.tsx                          # Shell principal: RoleSelector o Navbar + vista del rol activo
├── index.css                        # Directivas Tailwind y estilos base #F8FAFC
├── types/
│   └── sses.ts                      # Interfaces estrictas: Entidad, Estrategia, Estudiante, Docente,
│                                    # Tutor, Acompanamiento, SemanaSeguimiento, ConstanciaReporte,
│                                    # AuditLogEntry y tipos auxiliares
├── data/
│   └── seedData.ts                  # Dataset sintético realista de Colombia + generador de cadena génesis SHA-256
├── utils/
│   ├── crypto.ts                    # Web Crypto API nativa (crypto.subtle.digest), canonicalStringify y verifyAuditChain
│   ├── businessRules.ts             # Reglas puras: fechas, inmutabilidad, carga masiva, 4 semanas, motivo >= 10, Ley 1581, KPIs
│   ├── csvExport.ts                 # Generación CSV RFC-4180 (UTF-8 BOM), máscara Ley 1581, SHA-256 y descarga
│   └── businessRules.test.ts        # ÚNICO archivo de pruebas Vitest (3 casos: inmutabilidad, SHA-256, PII Ley 1581)
├── context/
│   └── SsesContext.tsx              # React Context + localStorage + pipeline serializado de mutaciones con audit_log automático + cola offline idempotente
└── components/
    ├── layout/
    │   ├── RoleSelector.tsx         # Pantalla inicial interactiva de selección de los 4 perfiles (sin login)
    │   └── Navbar.tsx               # Switcher rápido de rol, toggle "En línea / Sin conexión" y botón "Restaurar datos de fábrica"
    ├── common/
    │   ├── KpiDashboard.tsx         # Tarjetas KPI de cumplimiento y alertas de atraso (reutilizado en MEN y Ente de Control)
    │   └── ReportReceiptCard.tsx    # Visualización y copiado de ConstanciaReporte con hash SHA-256
    └── roles/
        ├── FuncionarioMenView.tsx   # Crear/editar estrategias, banner inmutabilidad CON_ESTUDIANTES, vinculación individual/masiva, KPIs y CSV
        ├── TutorView.tsx            # Acompañamientos Individual/Grupal, 4 semanas PENDIENTE, avance semanal (motivo >= 10), badges offline
        ├── EnteControlView.tsx      # Vista 100% solo lectura, documentos enmascarados Ley 1581 y descarga CSV de ley con SHA-256
        └── AuditoriaView.tsx        # Tabla/timeline inmutable de audit_log, visor JSON antes/después y botón "Verificar Integridad de Cadena"
```

**Structure Decision**: Se adopta una arquitectura de **proyecto frontend único** en la raíz del repositorio (`src/`), con separación estricta entre capa de contratos (`src/types/sses.ts`), lógica de dominio pura y criptografía nativa (`src/utils/`), datos sintéticos (`src/data/`), estado global auditado (`src/context/SsesContext.tsx`) y vistas por rol (`src/components/roles/`). Esta estructura mantiene el proyecto limpio, modular, fácil de auditar y alineado con el despliegue estático en GitHub Pages sin sobrecarga de monorepo.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No aplica*: El diseño cumple al 100% con los seis principios constitucionales sin ninguna violación que requiera justificación.

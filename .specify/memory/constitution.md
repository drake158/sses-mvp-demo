# SSES MVP Demo (MEN Colombia) Constitution

## Core Principles

### I. Arquitectura Estática Frontend-Only y Stack Controlado

La aplicación DEBE construirse estrictamente como un MVP estático (*Frontend-Only*) para demostrar el sistema SSES del Ministerio de Educación Nacional (MEN) de Colombia, sin servidor backend ni servicios externos obligatorios en tiempo de ejecución. El stack tecnológico DEBE utilizar **React 18**, **TypeScript**, **Vite** y **Tailwind CSS** (o, en su defecto, **MUI v6** como única alternativa de estilos; NO DEBEN combinarse ambos frameworks visuales en el mismo proyecto).

*Justificación*: Garantiza portabilidad directa hacia GitHub Pages, elimina complejidad de infraestructura para demostraciones y mantiene coherencia técnica con tipado estático estricto.

### II. Aislamiento Estricto de Dependencias y Entorno

NO DEBEN ejecutarse instalaciones globales de paquetes (`-g` en npm ni instalaciones globales en Python). Todas las dependencias JavaScript/TypeScript DEBEN residir estrictamente en `./node_modules`, gobernadas por un archivo `.npmrc` en la raíz del repositorio con `save-exact=true`. Si el proyecto requiere scripts auxiliares en Python, DEBE crearse y utilizarse obligatoriamente un entorno virtual local en `./.venv`.

*Justificación*: Asegura entornos determinísticos, reproducibles y libres de contaminación en máquinas locales y en flujos de CI/CD.

### III. Persistencia Simulada y Datos Sintéticos de Colombia

La gestión de estado y persistencia del MVP DEBE implementarse mediante `localStorage` coordinado con **React Context**. Al inicializarse sin datos previos, la aplicación DEBE precargar un conjunto de datos sintéticos realistas de Colombia que represente entidades educativas, estudiantes, docentes y tutores (sin utilizar datos personales reales). La interfaz DEBE incluir un botón accesible de **"Restaurar datos de fábrica"** que restablezca `localStorage` y el contexto al estado sintético inicial.

*Justificación*: Habilita demostraciones interactivas completas y repetibles sin base de datos remota, permitiendo reiniciar el escenario en un clic entre presentaciones.

### IV. Identidad Visual Institucional del MEN

La interfaz de usuario DEBE mantener una línea gráfica gubernamental limpia, legible y consistente basada obligatoriamente en la siguiente paleta semántica:

- **Azul Institucional (`#1B365D`)**: Encabezados, barra principal y acentos de identidad institucional.
- **Azul Secundario (`#0066CC`)**: Acciones primarias, enlaces y elementos interactivos.
- **Verde Esmeralda (`#00875A`)**: Indicadores de cumplimiento, aprobación y estado exitoso.
- **Ámbar (`#D97706`)**: Alertas operativas, advertencias y estado offline/pendiente.
- **Rojo (`#DC2626`)**: Bloqueos, atrasos críticos y errores.
- **Fondos (`#F8FAFC`)**: Superficie base de pantallas y contenedores principales.

Los colores semánticos DEBEN emplearse únicamente según el significado anterior para evitar ambigüedad visual.

*Justificación*: Refuerza la identidad institucional del Ministerio de Educación Nacional y facilita la lectura inmediata del estado de seguimiento en el SSES.

### V. Despliegue Estático Reproducible en GitHub Pages

El empaquetado con Vite DEBE configurar `base: './'` en `vite.config.ts` para asegurar que todos los activos estáticos se resuelvan mediante rutas relativas. El repositorio DEBE mantener un flujo automatizado en `.github/workflows/deploy.yml` para compilar y publicar el sitio estático en GitHub Pages. Todas las rutas y recursos de la aplicación DEBEN operar correctamente en alojamiento estático sin reescritura de servidor.

*Justificación*: Garantiza despliegues repetibles y sin enlaces rotos bajo subrutas de GitHub Pages.

### VI. Calidad Funcional Cero-Errores y Pruebas Focalizadas

El desarrollo DEBE priorizar el 100% de funcionalidad operativa en todos los flujos del MVP, garantizando ejecución limpia sin errores ni excepciones no controladas en la consola del navegador. La cobertura de pruebas unitarias DEBE mantenerse estrictamente acotada a **un (1) único archivo de pruebas con Vitest** ubicado en `src/utils/businessRules.test.ts`, ejecutable localmente mediante `npm test`. NO DEBEN agregarse suites paralelas ni archivos de prueba adicionales fuera de dicha ruta sin enmienda previa de esta constitución.

*Justificación*: Protege las reglas de negocio críticas del SSES con una verificación rápida y determinística mientras mantiene el alcance del MVP enfocado en la demostración funcional.

## Restricciones Técnicas y Estándares de Implementación

- **Selección única de librería UI**: En el plan técnico inicial DEBE fijarse una sola opción entre Tailwind CSS o MUI v6 y respetarse en toda la aplicación.
- **Determinismo de paquetes**: El archivo `.npmrc` con `save-exact=true` y el archivo de bloqueo (`package-lock.json`) DEBEN versionarse en el repositorio; `./node_modules` y `./.venv` DEBEN permanecer excluidos del control de versiones.
- **Privacidad de datos sintéticos**: Todos los registros precargados de entidades educativas, estudiantes, docentes y tutores DEBEN ser estrictamente ficticios y culturalmente representativos de Colombia.
- **Estabilidad en cliente**: Las operaciones sobre `localStorage` DEBEN manejar de forma segura estados corruptos o ausentes, recurriendo automáticamente a los datos sintéticos iniciales sin producir fallos en consola.

## Flujo de Desarrollo, Verificación y Despliegue

Todo cambio funcional antes de integrarse o publicarse DEBE superar las siguientes compuertas de calidad:

1. **Verificación de tipos y compilación**: Compilación limpia de TypeScript y empaquetado estático con Vite sin errores.
2. **Pruebas unitarias de reglas de negocio**: Ejecución local exitosa de `npm test` validando exclusivamente `src/utils/businessRules.test.ts` mediante Vitest.
3. **Verificación funcional en navegador**: Revisión de flujos principales del MVP con cero errores en consola, comprobando persistencia en `localStorage` y restablecimiento mediante **"Restaurar datos de fábrica"**.
4. **Conformidad de aislamiento y despliegue**: Confirmación de ausencia de dependencias globales, vigencia de `.npmrc` (`save-exact=true`), `base: './'` en `vite.config.ts` y validez del flujo `.github/workflows/deploy.yml`.

## Governance

Esta constitución prevalece sobre cualquier otra práctica, convención o decisión técnica informal del proyecto.

- **Procedimiento de enmienda**: Cualquier adición, eliminación o modificación de principios o restricciones DEBE realizarse mediante actualización formal de `.specify/memory/constitution.md`, documentando el motivo del cambio y verificando coherencia con las especificaciones, planes y tareas activas.
- **Política de versionado**: Se aplica versionado semántico (`MAJOR.MINOR.PATCH`):
  - **MAJOR**: Eliminación o redefinición incompatible de principios fundamentales (por ejemplo, abandonar arquitectura Frontend-Only, cambiar el stack base o alterar la restricción de pruebas).
  - **MINOR**: Adición de nuevos principios, secciones o expansión sustantiva de reglas normativas.
  - **PATCH**: Aclaraciones de redacción, correcciones tipográficas o refinamientos no normativos.
- **Revisión de cumplimiento**: Toda especificación, plan técnico, plan de tareas y revisión de código DEBE verificar explícitamente el cumplimiento de los seis principios constitucionales. Cualquier excepción temporal DEBE justificarse por escrito antes de su implementación.

**Version**: 1.0.0 | **Ratified**: 2026-11-18 | **Last Amended**: 2026-11-18

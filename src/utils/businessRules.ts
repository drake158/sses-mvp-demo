import type {
  Acompanamiento,
  AcompanamientoInput,
  AlertaAtraso,
  BulkLinkResult,
  Docente,
  Entidad,
  EstadoSemana,
  EstadoSincronizacion,
  Estrategia,
  EstrategiaInput,
  Estudiante,
  KpiResumen,
  SemanaSeguimiento,
  ValidationResult,
} from '../types/sses';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH_REGEX = /^\d{4}-\d{2}$/;

/**
 * Validates creation/edition inputs for a student strategy:
 * - Non-empty name
 * - Existing entity with estado === 'ACTIVA' (FR-006)
 * - Valid ISO dates with fechaFin strictly > fechaInicio (FR-007)
 */
export function validarEstrategiaInput(
  input: EstrategiaInput,
  entidades: Entidad[]
): ValidationResult {
  const errors: string[] = [];

  if (!input.nombre || input.nombre.trim().length < 3) {
    errors.push('El nombre de la estrategia debe tener al menos 3 caracteres.');
  }

  const entidad = entidades.find((e) => e.id === input.entidadId);
  if (!entidad) {
    errors.push('Debe seleccionar una entidad educativa válida.');
  } else if (entidad.estado !== 'ACTIVA') {
    errors.push(
      `La entidad "${entidad.nombre}" se encuentra INACTIVA y no puede asociarse a una estrategia.`
    );
  }

  if (!ISO_DATE_REGEX.test(input.fechaInicio)) {
    errors.push('La fecha de inicio debe tener formato válido (AAAA-MM-DD).');
  }

  if (!ISO_DATE_REGEX.test(input.fechaFin)) {
    errors.push('La fecha de fin debe tener formato válido (AAAA-MM-DD).');
  }

  if (
    ISO_DATE_REGEX.test(input.fechaInicio) &&
    ISO_DATE_REGEX.test(input.fechaFin) &&
    input.fechaFin <= input.fechaInicio
  ) {
    errors.push(
      'La fecha de fin debe ser estrictamente posterior a la fecha de inicio.'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * A strategy can only have its base fields edited while in SIN_ESTUDIANTES state (FR-008, FR-011).
 */
export function puedeEditarEstrategia(estrategia: Estrategia): boolean {
  return estrategia.estado === 'SIN_ESTUDIANTES';
}

/**
 * Applies edits to a strategy, enforcing permanent immutability once CON_ESTUDIANTES (FR-011).
 */
export function aplicarEdicionEstrategia(
  estrategia: Estrategia,
  cambios: EstrategiaInput,
  entidades: Entidad[]
): Estrategia {
  if (!puedeEditarEstrategia(estrategia)) {
    throw new Error(
      'Edición bloqueada: la estrategia está en estado CON_ESTUDIANTES y sus datos base son permanentemente inmutables.'
    );
  }

  const validacion = validarEstrategiaInput(cambios, entidades);
  if (!validacion.valid) {
    throw new Error(validacion.errors.join(' '));
  }

  return {
    ...estrategia,
    nombre: cambios.nombre.trim(),
    descripcion: cambios.descripcion.trim(),
    entidadId: cambios.entidadId,
    fechaInicio: cambios.fechaInicio,
    fechaFin: cambios.fechaFin,
    actualizadaEn: new Date().toISOString(),
  };
}

function normalizarNumeroDocumento(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }
  const withoutPrefix = trimmed.replace(/^(CC|TI|CE|PPT)\s+/i, '');
  return withoutPrefix.replace(/\s+/g, '');
}

/**
 * Parses bulk document input separated by newlines, commas, or semicolons,
 * trimming spaces, removing empties, and deduplicating while preserving order.
 */
export function parsearDocumentosMasivos(texto: string): string[] {
  const tokens = texto.split(/[\r\n,;]+/);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const token of tokens) {
    const clean = normalizarNumeroDocumento(token);
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      result.push(clean);
    }
  }

  return result;
}

/**
 * Links students by document number to a strategy:
 * - Accepts ONLY students belonging to estrategia.entidadId (FR-009 / FR-010)
 * - Reports duplicates already linked, students from other entities, and not-found docs
 * - Transitions estado to CON_ESTUDIANTES if estudianteIds.length >= 1
 * - Allows linking additional students when already CON_ESTUDIANTES without unlocking base edits (FR-011)
 */
export function vincularEstudiantesAEstrategia(
  estrategia: Estrategia,
  documentos: string[],
  catalogoEstudiantes: Estudiante[]
): BulkLinkResult {
  const docIndex = new Map<string, Estudiante>();
  for (const estudiante of catalogoEstudiantes) {
    docIndex.set(estudiante.numeroDocumento.trim(), estudiante);
  }

  const dedupedDocs: string[] = [];
  const seenInput = new Set<string>();
  for (const rawDoc of documentos) {
    const clean = normalizarNumeroDocumento(rawDoc);
    if (clean && !seenInput.has(clean)) {
      seenInput.add(clean);
      dedupedDocs.push(clean);
    }
  }

  const existingIds = new Set<string>(estrategia.estudianteIds);
  const vinculados: Estudiante[] = [];
  const yaVinculados: string[] = [];
  const otraEntidad: string[] = [];
  const noEncontrados: string[] = [];

  for (const doc of dedupedDocs) {
    const estudiante = docIndex.get(doc);
    if (!estudiante) {
      noEncontrados.push(doc);
      continue;
    }

    if (estudiante.entidadId !== estrategia.entidadId) {
      otraEntidad.push(doc);
      continue;
    }

    if (existingIds.has(estudiante.id)) {
      yaVinculados.push(doc);
      continue;
    }

    existingIds.add(estudiante.id);
    vinculados.push(estudiante);
  }

  const nuevosEstudianteIds = Array.from(existingIds);
  const nuevoEstado =
    nuevosEstudianteIds.length >= 1 ? 'CON_ESTUDIANTES' : 'SIN_ESTUDIANTES';

  const estrategiaActualizada: Estrategia = {
    ...estrategia,
    estudianteIds: nuevosEstudianteIds,
    estado: nuevoEstado,
    actualizadaEn:
      vinculados.length > 0 ? new Date().toISOString() : estrategia.actualizadaEn,
  };

  return {
    estrategiaActualizada,
    vinculados,
    yaVinculados,
    otraEntidad,
    noEncontrados,
  };
}

/**
 * Validates monthly accompaniment creation:
 * - INDIVIDUAL requires exactly 1 teacher from the strategy's entity
 * - GRUPAL requires 2 or more teachers from the strategy's entity (FR-014)
 */
export function validarAcompanamientoInput(
  input: AcompanamientoInput,
  docentesEntidad: Docente[]
): ValidationResult {
  const errors: string[] = [];

  if (!input.estrategiaId) {
    errors.push('Debe seleccionar una estrategia.');
  }

  if (!input.tutorId) {
    errors.push('Debe seleccionar un tutor responsable.');
  }

  if (!ISO_MONTH_REGEX.test(input.mes)) {
    errors.push('El mes del acompañamiento debe tener formato AAAA-MM.');
  }

  const validDocenteIds = new Set(docentesEntidad.map((d) => d.id));
  const uniqueSelected = Array.from(new Set(input.docenteIds));

  const invalidDocentes = uniqueSelected.filter((id) => !validDocenteIds.has(id));
  if (invalidDocentes.length > 0) {
    errors.push(
      'Todos los docentes seleccionados deben pertenecer a la entidad educativa de la estrategia.'
    );
  }

  if (input.modalidad === 'INDIVIDUAL' && uniqueSelected.length !== 1) {
    errors.push(
      'La modalidad INDIVIDUAL requiere seleccionar exactamente 1 docente.'
    );
  }

  if (input.modalidad === 'GRUPAL' && uniqueSelected.length < 2) {
    errors.push(
      'La modalidad GRUPAL requiere seleccionar al menos 2 docentes de la entidad educativa.'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Auto-generates exactly 4 PENDIENTE follow-up weeks (Weeks 1..4) for a monthly accompaniment (FR-015).
 */
export function generarCuatroSemanasPendientes(
  acompanamientoId: string,
  mes: string,
  estadoSincronizacion: EstadoSincronizacion
): SemanaSeguimiento[] {
  const [year, month] = ISO_MONTH_REGEX.test(mes)
    ? mes.split('-')
    : new Date().toISOString().slice(0, 7).split('-');

  const diasProgramados = ['07', '14', '21', '28'] as const;
  const numeros: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];

  return numeros.map((numeroSemana, index) => ({
    id: `${acompanamientoId}-S${numeroSemana}`,
    numeroSemana,
    fechaProgramada: `${year}-${month}-${diasProgramados[index]}`,
    estado: 'PENDIENTE',
    estadoSincronizacion,
  }));
}

/**
 * Validates weekly follow-up update:
 * - NO_REALIZADO requires a trimmed reason of at least 10 characters (FR-016, FR-017).
 */
export function validarAvanceSemanal(
  estado: EstadoSemana,
  motivo?: string
): ValidationResult {
  if (estado === 'NO_REALIZADO') {
    const trimmed = (motivo ?? '').trim();
    if (trimmed.length < 10) {
      return {
        valid: false,
        errors: [
          'Cuando la semana se marca como NO_REALIZADO, debe ingresar un motivo de al menos 10 caracteres útiles (sin contar espacios iniciales o finales).',
        ],
      };
    }
  }

  return { valid: true, errors: [] };
}

/**
 * Masks PII document numbers under Colombia Ley 1581 (FR-023):
 * - Preserves document type and last 4 digits (e.g. `CC ******4821`)
 * - Protects short documents (<= 4 digits) with `******` so no digits leak
 */
export function enmascararDocumentoLey1581(
  tipoDocumento: string,
  numeroDocumento: string
): string {
  const tipo = tipoDocumento.trim().toUpperCase();
  const numero = numeroDocumento.trim();

  if (numero.length <= 4) {
    return `${tipo} ******`;
  }

  const last4 = numero.slice(-4);
  const maskedLength = Math.max(6, numero.length - 4);
  return `${tipo} ${'*'.repeat(maskedLength)}${last4}`;
}

/**
 * Computes consolidated compliance KPIs and delay alerts for MEN and Control dashboards (FR-012).
 */
export function calcularKpisCumplimiento(
  estrategias: Estrategia[],
  acompanamientos: Acompanamiento[],
  referenciaIso?: string
): KpiResumen {
  const referenciaFecha = (referenciaIso ?? new Date().toISOString()).slice(0, 10);
  const estrategiaById = new Map(estrategias.map((e) => [e.id, e]));

  let totalSemanas = 0;
  let semanasRealizadas = 0;
  let semanasNoRealizadas = 0;
  let semanasPendientes = 0;
  const alertas: AlertaAtraso[] = [];

  const statsPorEstrategia = new Map<
    string,
    { total: number; realizadas: number }
  >();

  for (const acomp of acompanamientos) {
    const estrategia = estrategiaById.get(acomp.estrategiaId);
    const estrategiaNombre = estrategia?.nombre ?? acomp.estrategiaId;
    const stats = statsPorEstrategia.get(acomp.estrategiaId) ?? {
      total: 0,
      realizadas: 0,
    };

    for (const semana of acomp.semanas) {
      totalSemanas += 1;
      stats.total += 1;

      if (semana.estado === 'REALIZADO') {
        semanasRealizadas += 1;
        stats.realizadas += 1;
      } else if (semana.estado === 'NO_REALIZADO') {
        semanasNoRealizadas += 1;
        alertas.push({
          id: `ALR-NR-${semana.id}`,
          severidad: 'ADVERTENCIA',
          tipo: 'SEMANA_NO_REALIZADA',
          estrategiaId: acomp.estrategiaId,
          estrategiaNombre,
          detalle: `Mes ${acomp.mes} · Semana ${semana.numeroSemana} marcada como NO REALIZADA: "${semana.motivoNoRealizado ?? 'Sin detalle'}"`,
          fechaReferencia: semana.fechaProgramada,
        });
      } else {
        semanasPendientes += 1;
        if (semana.fechaProgramada < referenciaFecha) {
          alertas.push({
            id: `ALR-VEN-${semana.id}`,
            severidad: 'CRITICA',
            tipo: 'SEMANA_VENCIDA',
            estrategiaId: acomp.estrategiaId,
            estrategiaNombre,
            detalle: `Mes ${acomp.mes} · Semana ${semana.numeroSemana} vencida (programada para ${semana.fechaProgramada}) aún en estado PENDIENTE.`,
            fechaReferencia: semana.fechaProgramada,
          });
        }
      }
    }

    statsPorEstrategia.set(acomp.estrategiaId, stats);
  }

  // Flag strategies nearing end date (< 15 days) with < 50% completion
  const refMs = Date.parse(`${referenciaFecha}T00:00:00Z`);
  for (const estrategia of estrategias) {
    if (estrategia.estado !== 'CON_ESTUDIANTES') {
      continue;
    }
    const finMs = Date.parse(`${estrategia.fechaFin}T00:00:00Z`);
    const daysLeft = Math.ceil((finMs - refMs) / (1000 * 60 * 60 * 24));
    const stats = statsPorEstrategia.get(estrategia.id);
    const pct =
      stats && stats.total > 0
        ? Math.round((stats.realizadas / stats.total) * 100)
        : 0;

    if (daysLeft >= 0 && daysLeft <= 15 && pct < 50) {
      alertas.push({
        id: `ALR-PROX-${estrategia.id}`,
        severidad: 'ADVERTENCIA',
        tipo: 'ESTRATEGIA_PROXIMA_VENCER',
        estrategiaId: estrategia.id,
        estrategiaNombre: estrategia.nombre,
        detalle: `Estrategia vence en ${daysLeft} día(s) (${estrategia.fechaFin}) con cumplimiento actual del ${pct}%.`,
        fechaReferencia: estrategia.fechaFin,
      });
    }
  }

  alertas.sort((a, b) => {
    if (a.severidad !== b.severidad) {
      return a.severidad === 'CRITICA' ? -1 : 1;
    }
    return a.fechaReferencia.localeCompare(b.fechaReferencia);
  });

  const estrategiasConEstudiantes = estrategias.filter(
    (e) => e.estado === 'CON_ESTUDIANTES'
  ).length;
  const totalEstudiantesVinculados = estrategias.reduce(
    (acc, e) => acc + e.estudianteIds.length,
    0
  );
  const porcentajeCumplimiento =
    totalSemanas === 0
      ? 0
      : Math.round((semanasRealizadas / totalSemanas) * 100);

  return {
    totalEstrategias: estrategias.length,
    estrategiasConEstudiantes,
    estrategiasSinEstudiantes: estrategias.length - estrategiasConEstudiantes,
    totalEstudiantesVinculados,
    totalSemanas,
    semanasRealizadas,
    semanasNoRealizadas,
    semanasPendientes,
    porcentajeCumplimiento,
    totalAlertas: alertas.length,
    alertas,
  };
}

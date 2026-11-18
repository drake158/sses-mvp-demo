import type {
  Acompanamiento,
  AuditLogEntry,
  Docente,
  Entidad,
  Estrategia,
  Estudiante,
  RolUsuario,
  SsesState,
  TipoAccionAuditoria,
  Tutor,
} from '../types/sses';
import { computeAuditEntryHash, GENESIS_HASH } from '../utils/crypto';

export const SSES_SCHEMA_VERSION = 1;

const SEED_ENTIDADES: Entidad[] = [
  {
    id: 'ENT-001',
    codigoDane: '111001000101',
    nombre: 'I.E.D. Técnico Bicentenario de Bogotá',
    municipio: 'Bogotá D.C.',
    departamento: 'Cundinamarca',
    estado: 'ACTIVA',
  },
  {
    id: 'ENT-002',
    codigoDane: '105001000202',
    nombre: 'I.E. Maestro Guillermo Vélez de Medellín',
    municipio: 'Medellín',
    departamento: 'Antioquia',
    estado: 'ACTIVA',
  },
  {
    id: 'ENT-003',
    codigoDane: '176001000303',
    nombre: 'I.E. Politécnico Valle del Cauca',
    municipio: 'Cali',
    departamento: 'Valle del Cauca',
    estado: 'ACTIVA',
  },
  {
    id: 'ENT-004',
    codigoDane: '108001000404',
    nombre: 'I.E. Distrital Puerta de Oro',
    municipio: 'Barranquilla',
    departamento: 'Atlántico',
    estado: 'ACTIVA',
  },
  {
    id: 'ENT-005',
    codigoDane: '115001000505',
    nombre: 'I.E. Rural Los Andes de Tunja',
    municipio: 'Tunja',
    departamento: 'Boyacá',
    estado: 'INACTIVA',
  },
];

const SEED_ESTUDIANTES: Estudiante[] = [
  {
    id: 'EST-001',
    tipoDocumento: 'TI',
    numeroDocumento: '1020304821',
    nombreCompleto: 'Valentina Morales Cárdenas',
    entidadId: 'ENT-001',
    grado: '10°',
  },
  {
    id: 'EST-002',
    tipoDocumento: 'TI',
    numeroDocumento: '1020304822',
    nombreCompleto: 'Santiago Rojas Quintero',
    entidadId: 'ENT-001',
    grado: '10°',
  },
  {
    id: 'EST-003',
    tipoDocumento: 'CC',
    numeroDocumento: '1014289451',
    nombreCompleto: 'Mariana Ospina Beltrán',
    entidadId: 'ENT-001',
    grado: '11°',
  },
  {
    id: 'EST-004',
    tipoDocumento: 'TI',
    numeroDocumento: '1037651901',
    nombreCompleto: 'Juan Esteban Restrepo Gómez',
    entidadId: 'ENT-002',
    grado: '9°',
  },
  {
    id: 'EST-005',
    tipoDocumento: 'TI',
    numeroDocumento: '1037651902',
    nombreCompleto: 'Camila Andrea Montoya Álvarez',
    entidadId: 'ENT-002',
    grado: '10°',
  },
  {
    id: 'EST-006',
    tipoDocumento: 'CC',
    numeroDocumento: '1037651903',
    nombreCompleto: 'Mateo Giraldo Londoño',
    entidadId: 'ENT-002',
    grado: '11°',
  },
  {
    id: 'EST-007',
    tipoDocumento: 'TI',
    numeroDocumento: '1144087311',
    nombreCompleto: 'Sofía Caicedo Valderrama',
    entidadId: 'ENT-003',
    grado: '10°',
  },
  {
    id: 'EST-008',
    tipoDocumento: 'TI',
    numeroDocumento: '1144087312',
    nombreCompleto: 'Samuel Mina Angulo',
    entidadId: 'ENT-003',
    grado: '10°',
  },
  {
    id: 'EST-009',
    tipoDocumento: 'CC',
    numeroDocumento: '1144087313',
    nombreCompleto: 'Isabella Velasco Hurtado',
    entidadId: 'ENT-003',
    grado: '11°',
  },
  {
    id: 'EST-010',
    tipoDocumento: 'TI',
    numeroDocumento: '1045712601',
    nombreCompleto: 'Nicolás De La Hoz Barros',
    entidadId: 'ENT-004',
    grado: '9°',
  },
  {
    id: 'EST-011',
    tipoDocumento: 'TI',
    numeroDocumento: '1045712602',
    nombreCompleto: 'Laura Daniela Pertuz Mendoza',
    entidadId: 'ENT-004',
    grado: '10°',
  },
  {
    id: 'EST-012',
    tipoDocumento: 'CC',
    numeroDocumento: '1045712603',
    nombreCompleto: 'Andrés Felipe Escorcia Villa',
    entidadId: 'ENT-004',
    grado: '11°',
  },
];

const SEED_DOCENTES: Docente[] = [
  {
    id: 'DOC-001',
    tipoDocumento: 'CC',
    numeroDocumento: '79845123',
    nombreCompleto: 'Carlos Alberto Pineda Vargas',
    entidadId: 'ENT-001',
    area: 'Matemáticas',
  },
  {
    id: 'DOC-002',
    tipoDocumento: 'CC',
    numeroDocumento: '52910482',
    nombreCompleto: 'Claudia Patricia Torres Mejía',
    entidadId: 'ENT-001',
    area: 'Lenguaje',
  },
  {
    id: 'DOC-003',
    tipoDocumento: 'CC',
    numeroDocumento: '71782340',
    nombreCompleto: 'Jhon Jairo Castaño Ríos',
    entidadId: 'ENT-002',
    area: 'Ciencias Naturales',
  },
  {
    id: 'DOC-004',
    tipoDocumento: 'CC',
    numeroDocumento: '43891205',
    nombreCompleto: 'Luz Marina Zapata Henao',
    entidadId: 'ENT-002',
    area: 'Ciencias Sociales',
  },
  {
    id: 'DOC-005',
    tipoDocumento: 'CC',
    numeroDocumento: '94512876',
    nombreCompleto: 'Óscar Eduardo Arboleda Cruz',
    entidadId: 'ENT-003',
    area: 'Tecnología e Informática',
  },
  {
    id: 'DOC-006',
    tipoDocumento: 'CC',
    numeroDocumento: '31948210',
    nombreCompleto: 'Diana Marcela Palacios Paz',
    entidadId: 'ENT-003',
    area: 'Inglés',
  },
  {
    id: 'DOC-007',
    tipoDocumento: 'CC',
    numeroDocumento: '72284519',
    nombreCompleto: 'Rafael Enrique Cantillo Orozco',
    entidadId: 'ENT-004',
    area: 'Matemáticas',
  },
  {
    id: 'DOC-008',
    tipoDocumento: 'CC',
    numeroDocumento: '32891407',
    nombreCompleto: 'Yolanda Isabel Barrios Romero',
    entidadId: 'ENT-004',
    area: 'Competencias Ciudadanas',
  },
];

const SEED_TUTORES: Tutor[] = [
  {
    id: 'TUT-001',
    tipoDocumento: 'CC',
    numeroDocumento: '80124589',
    nombreCompleto: 'Alejandro Ramírez Salgado',
    zonaAsignada: 'Región Andina — Centro',
  },
  {
    id: 'TUT-002',
    tipoDocumento: 'CC',
    numeroDocumento: '43982164',
    nombreCompleto: 'Carolina Vélez Echeverri',
    zonaAsignada: 'Región Andina — Antioquia',
  },
  {
    id: 'TUT-003',
    tipoDocumento: 'CC',
    numeroDocumento: '72310945',
    nombreCompleto: 'Jorge Luis Mendoza Carrillo',
    zonaAsignada: 'Región Caribe y Pacífico',
  },
];

const SEED_ESTRATEGIAS: Estrategia[] = [
  {
    id: 'STR-001',
    nombre: 'Jornada Única de Refuerzo en Lectoescritura y Matemáticas',
    descripcion:
      'Acompañamiento intensivo para cierre de brechas de aprendizaje en educación media en Bogotá D.C.',
    entidadId: 'ENT-001',
    fechaInicio: '2026-08-01',
    fechaFin: '2026-12-15',
    estado: 'CON_ESTUDIANTES',
    estudianteIds: ['EST-001', 'EST-002'],
    creadaEn: '2026-08-01T09:00:00.000Z',
    actualizadaEn: '2026-08-03T14:30:00.000Z',
  },
  {
    id: 'STR-002',
    nombre: 'Plan Territorial de Permanencia Escolar Media',
    descripcion:
      'Tutorías focalizadas y seguimiento socioemocional para prevenir deserción en grados 9° a 11° en Medellín.',
    entidadId: 'ENT-002',
    fechaInicio: '2026-09-01',
    fechaFin: '2026-12-10',
    estado: 'CON_ESTUDIANTES',
    estudianteIds: ['EST-004', 'EST-005'],
    creadaEn: '2026-09-01T10:15:00.000Z',
    actualizadaEn: '2026-09-02T11:20:00.000Z',
  },
  {
    id: 'STR-003',
    nombre: 'Semillero de Transición a la Educación Superior',
    descripcion:
      'Preparación en competencias STEM e inglés para estudiantes próximos a graduarse en Cali.',
    entidadId: 'ENT-003',
    fechaInicio: '2026-11-01',
    fechaFin: '2027-03-31',
    estado: 'SIN_ESTUDIANTES',
    estudianteIds: [],
    creadaEn: '2026-11-01T08:45:00.000Z',
    actualizadaEn: '2026-11-01T08:45:00.000Z',
  },
];

const SEED_ACOMPANAMIENTOS: Acompanamiento[] = [
  {
    id: 'ACO-001',
    estrategiaId: 'STR-001',
    tutorId: 'TUT-001',
    mes: '2026-10',
    modalidad: 'GRUPAL',
    docenteIds: ['DOC-001', 'DOC-002'],
    observaciones:
      'Mesa pedagógica grupal con docentes de Matemáticas y Lenguaje para articulación de guías.',
    estadoSincronizacion: 'SINCRONIZADO',
    idempotencyKey: 'seed-idem-aco-001',
    creadoEn: '2026-10-02T13:00:00.000Z',
    semanas: [
      {
        id: 'ACO-001-S1',
        numeroSemana: 1,
        fechaProgramada: '2026-10-07',
        estado: 'REALIZADO',
        estadoSincronizacion: 'SINCRONIZADO',
        actualizadaEn: '2026-10-07T16:10:00.000Z',
      },
      {
        id: 'ACO-001-S2',
        numeroSemana: 2,
        fechaProgramada: '2026-10-14',
        estado: 'REALIZADO',
        estadoSincronizacion: 'SINCRONIZADO',
        actualizadaEn: '2026-10-14T15:40:00.000Z',
      },
      {
        id: 'ACO-001-S3',
        numeroSemana: 3,
        fechaProgramada: '2026-10-21',
        estado: 'REALIZADO',
        estadoSincronizacion: 'SINCRONIZADO',
        actualizadaEn: '2026-10-21T17:05:00.000Z',
      },
      {
        id: 'ACO-001-S4',
        numeroSemana: 4,
        fechaProgramada: '2026-10-28',
        estado: 'PENDIENTE',
        estadoSincronizacion: 'SINCRONIZADO',
      },
    ],
  },
  {
    id: 'ACO-002',
    estrategiaId: 'STR-002',
    tutorId: 'TUT-002',
    mes: '2026-11',
    modalidad: 'INDIVIDUAL',
    docenteIds: ['DOC-003'],
    observaciones:
      'Acompañamiento individual en aula de Ciencias Naturales con enfoque en retención escolar.',
    estadoSincronizacion: 'SINCRONIZADO',
    idempotencyKey: 'seed-idem-aco-002',
    creadoEn: '2026-11-02T14:20:00.000Z',
    semanas: [
      {
        id: 'ACO-002-S1',
        numeroSemana: 1,
        fechaProgramada: '2026-11-07',
        estado: 'REALIZADO',
        estadoSincronizacion: 'SINCRONIZADO',
        actualizadaEn: '2026-11-07T16:30:00.000Z',
      },
      {
        id: 'ACO-002-S2',
        numeroSemana: 2,
        fechaProgramada: '2026-11-14',
        estado: 'NO_REALIZADO',
        motivoNoRealizado:
          'Suspensión temporal de jornada por mantenimiento eléctrico en la sede principal.',
        estadoSincronizacion: 'SINCRONIZADO',
        actualizadaEn: '2026-11-14T18:00:00.000Z',
      },
      {
        id: 'ACO-002-S3',
        numeroSemana: 3,
        fechaProgramada: '2026-11-21',
        estado: 'PENDIENTE',
        estadoSincronizacion: 'SINCRONIZADO',
      },
      {
        id: 'ACO-002-S4',
        numeroSemana: 4,
        fechaProgramada: '2026-11-28',
        estado: 'PENDIENTE',
        estadoSincronizacion: 'SINCRONIZADO',
      },
    ],
  },
];

interface SeedAuditBlueprint {
  timestamp: string;
  rol: RolUsuario;
  accion: TipoAccionAuditoria;
  entidadAfectada: string;
  registroId: string;
  valoresAnteriores: Record<string, unknown> | null;
  valoresNuevos: Record<string, unknown> | null;
}

const SEED_AUDIT_BLUEPRINTS: SeedAuditBlueprint[] = [
  {
    timestamp: '2026-08-01T08:00:00.000Z',
    rol: 'OFICINA_TECNOLOGIA',
    accion: 'INICIALIZACION_SISTEMA',
    entidadAfectada: 'Sistema',
    registroId: 'SSES-MVP-COLOMBIA',
    valoresAnteriores: null,
    valoresNuevos: {
      entidadesCargadas: SEED_ENTIDADES.length,
      estudiantesCargados: SEED_ESTUDIANTES.length,
      docentesCargados: SEED_DOCENTES.length,
      tutoresCargados: SEED_TUTORES.length,
      esquemaVersion: SSES_SCHEMA_VERSION,
    },
  },
  {
    timestamp: '2026-08-01T09:00:00.000Z',
    rol: 'FUNCIONARIO_MEN',
    accion: 'CREAR_ESTRATEGIA',
    entidadAfectada: 'Estrategia',
    registroId: 'STR-001',
    valoresAnteriores: null,
    valoresNuevos: {
      id: 'STR-001',
      nombre: SEED_ESTRATEGIAS[0].nombre,
      entidadId: 'ENT-001',
      estado: 'SIN_ESTUDIANTES',
      fechaInicio: '2026-08-01',
      fechaFin: '2026-12-15',
    },
  },
  {
    timestamp: '2026-08-03T14:30:00.000Z',
    rol: 'FUNCIONARIO_MEN',
    accion: 'VINCULAR_ESTUDIANTES',
    entidadAfectada: 'Estrategia',
    registroId: 'STR-001',
    valoresAnteriores: {
      estado: 'SIN_ESTUDIANTES',
      estudianteIds: [],
    },
    valoresNuevos: {
      estado: 'CON_ESTUDIANTES',
      estudianteIds: ['EST-001', 'EST-002'],
    },
  },
  {
    timestamp: '2026-10-02T13:00:00.000Z',
    rol: 'TUTOR',
    accion: 'REGISTRAR_ACOMPANAMIENTO',
    entidadAfectada: 'Acompanamiento',
    registroId: 'ACO-001',
    valoresAnteriores: null,
    valoresNuevos: {
      id: 'ACO-001',
      estrategiaId: 'STR-001',
      mes: '2026-10',
      modalidad: 'GRUPAL',
      docenteIds: ['DOC-001', 'DOC-002'],
      semanasGeneradas: 4,
    },
  },
  {
    timestamp: '2026-11-01T08:45:00.000Z',
    rol: 'FUNCIONARIO_MEN',
    accion: 'CREAR_ESTRATEGIA',
    entidadAfectada: 'Estrategia',
    registroId: 'STR-003',
    valoresAnteriores: null,
    valoresNuevos: {
      id: 'STR-003',
      nombre: SEED_ESTRATEGIAS[2].nombre,
      entidadId: 'ENT-003',
      estado: 'SIN_ESTUDIANTES',
      fechaInicio: '2026-11-01',
      fechaFin: '2027-03-31',
    },
  },
];

/**
 * Builds the factory synthetic Colombian SSES state with a real Web Crypto
 * SHA-256 genesis-chained audit log.
 */
export async function buildInitialSsesState(): Promise<SsesState> {
  const auditLog: AuditLogEntry[] = [];
  let previousHash = GENESIS_HASH;

  for (let i = 0; i < SEED_AUDIT_BLUEPRINTS.length; i += 1) {
    const bp = SEED_AUDIT_BLUEPRINTS[i];
    const secuencia = i + 1;
    const payload = {
      id: `AUD-${String(secuencia).padStart(4, '0')}`,
      secuencia,
      timestamp: bp.timestamp,
      rol: bp.rol,
      accion: bp.accion,
      entidadAfectada: bp.entidadAfectada,
      registroId: bp.registroId,
      valoresAnteriores: bp.valoresAnteriores,
      valoresNuevos: bp.valoresNuevos,
      previousHash,
    };
    const hash = await computeAuditEntryHash(payload);
    auditLog.push({ ...payload, hash });
    previousHash = hash;
  }

  return {
    version: SSES_SCHEMA_VERSION,
    entidades: structuredClone(SEED_ENTIDADES),
    estudiantes: structuredClone(SEED_ESTUDIANTES),
    docentes: structuredClone(SEED_DOCENTES),
    tutores: structuredClone(SEED_TUTORES),
    estrategias: structuredClone(SEED_ESTRATEGIAS),
    acompanamientos: structuredClone(SEED_ACOMPANAMIENTOS),
    constanciasReportes: [],
    auditLog,
    offlineQueue: [],
    processedIdempotencyKeys: ['seed-idem-aco-001', 'seed-idem-aco-002'],
    isOffline: false,
  };
}

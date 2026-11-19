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
  | 'CREAR_ESTUDIANTE'
  | 'CARGA_MASIVA_ESTUDIANTES'
  | 'EDITAR_ESTUDIANTE'
  | 'ELIMINAR_ESTUDIANTE'
  | 'CREAR_TUTOR'
  | 'EDITAR_TUTOR'
  | 'ELIMINAR_TUTOR'
  | 'REGISTRAR_ACOMPANAMIENTO'
  | 'ACTUALIZAR_SEMANA'
  | 'SINCRONIZACION_OFFLINE'
  | 'GENERAR_REPORTE_CSV'
  | 'RESTAURAR_DATOS_FABRICA';

export interface Entidad {
  id: string;
  codigoDane: string;
  nombre: string;
  municipio: string;
  departamento: string;
  estado: EstadoEntidad;
}

export interface Estudiante {
  id: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombreCompleto: string;
  entidadId: string;
  grado: string;
}

export interface Docente {
  id: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombreCompleto: string;
  entidadId: string;
  area: string;
}

export interface Tutor {
  id: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombreCompleto: string;
  zonaAsignada: string;
}

export interface Estrategia {
  id: string;
  nombre: string;
  descripcion: string;
  entidadId: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoEstrategia;
  estudianteIds: string[];
  creadaEn: string;
  actualizadaEn: string;
}

export interface SemanaSeguimiento {
  id: string;
  numeroSemana: 1 | 2 | 3 | 4;
  fechaProgramada: string;
  estado: EstadoSemana;
  motivoNoRealizado?: string;
  estadoSincronizacion: EstadoSincronizacion;
  actualizadaEn?: string;
}

export interface Acompanamiento {
  id: string;
  estrategiaId: string;
  tutorId: string;
  mes: string;
  modalidad: ModalidadAcompanamiento;
  docenteIds: string[];
  observaciones: string;
  semanas: SemanaSeguimiento[];
  estadoSincronizacion: EstadoSincronizacion;
  idempotencyKey: string;
  creadoEn: string;
}

export interface ConstanciaReporte {
  id: string;
  nombreArchivo: string;
  generadoEn: string;
  rolGenerador: 'FUNCIONARIO_MEN' | 'ENTE_CONTROL';
  enmascaradoLey1581: boolean;
  totalRegistros: number;
  sha256: string;
}

export interface AuditLogEntry {
  id: string;
  secuencia: number;
  timestamp: string;
  rol: RolUsuario;
  accion: TipoAccionAuditoria;
  entidadAfectada: string;
  registroId: string;
  valoresAnteriores: Record<string, unknown> | null;
  valoresNuevos: Record<string, unknown> | null;
  previousHash: string;
  hash: string;
}

export interface OfflineQueueItem {
  idempotencyKey: string;
  tipo: 'REGISTRAR_ACOMPANAMIENTO' | 'ACTUALIZAR_SEMANA';
  creadoEn: string;
  payload: Record<string, unknown>;
  registroId: string;
}

export interface SsesState {
  version: number;
  entidades: Entidad[];
  estudiantes: Estudiante[];
  docentes: Docente[];
  tutores: Tutor[];
  estrategias: Estrategia[];
  acompanamientos: Acompanamiento[];
  constanciasReportes: ConstanciaReporte[];
  auditLog: AuditLogEntry[];
  offlineQueue: OfflineQueueItem[];
  processedIdempotencyKeys: string[];
  isOffline: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface EstrategiaInput {
  nombre: string;
  descripcion: string;
  entidadId: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface BulkLinkResult {
  estrategiaActualizada: Estrategia;
  vinculados: Estudiante[];
  yaVinculados: string[];
  otraEntidad: string[];
  noEncontrados: string[];
}

export interface EstudianteInput {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombreCompleto: string;
  entidadId: string;
  grado: string;
}

export interface BulkCreateEstudianteError {
  linea: number;
  contenido: string;
  motivo: string;
}

export interface BulkCreateEstudiantesResult {
  creados: Estudiante[];
  duplicados: string[];
  invalidos: BulkCreateEstudianteError[];
}

export interface TutorInput {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombreCompleto: string;
  zonaAsignada: string;
}

export interface AcompanamientoInput {
  estrategiaId: string;
  tutorId: string;
  mes: string;
  modalidad: ModalidadAcompanamiento;
  docenteIds: string[];
  observaciones: string;
}

export interface AlertaAtraso {
  id: string;
  severidad: 'CRITICA' | 'ADVERTENCIA';
  tipo: 'SEMANA_VENCIDA' | 'SEMANA_NO_REALIZADA' | 'ESTRATEGIA_PROXIMA_VENCER';
  estrategiaId: string;
  estrategiaNombre: string;
  detalle: string;
  fechaReferencia: string;
}

export interface KpiResumen {
  totalEstrategias: number;
  estrategiasConEstudiantes: number;
  estrategiasSinEstudiantes: number;
  totalEstudiantesVinculados: number;
  totalSemanas: number;
  semanasRealizadas: number;
  semanasNoRealizadas: number;
  semanasPendientes: number;
  porcentajeCumplimiento: number;
  totalAlertas: number;
  alertas: AlertaAtraso[];
}

export interface IntegrityCheckResult {
  valid: boolean;
  totalVerified: number;
  brokenIndex: number | null;
  brokenEntryId: string | null;
  reason?: string;
}

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; errors?: string[] };

export interface SyncResult {
  syncedCount: number;
  skippedDuplicates: number;
  remainingCount: number;
}

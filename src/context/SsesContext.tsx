import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  buildInitialSsesState,
  SSES_SCHEMA_VERSION,
} from '../data/seedData';
import type {
  Acompanamiento,
  AcompanamientoInput,
  AuditLogEntry,
  BulkCreateEstudiantesResult,
  BulkLinkResult,
  ConstanciaReporte,
  EstadoSemana,
  Estrategia,
  EstrategiaInput,
  Estudiante,
  EstudianteInput,
  IntegrityCheckResult,
  MutationResult,
  OfflineQueueItem,
  RolUsuario,
  SemanaSeguimiento,
  SsesState,
  SyncResult,
  TipoAccionAuditoria,
  Tutor,
  TutorInput,
} from '../types/sses';
import {
  aplicarEdicionEstrategia,
  generarCuatroSemanasPendientes,
  normalizarGradoNumerico,
  procesarCargaMasivaEstudiantes,
  validarAcompanamientoInput,
  validarAvanceSemanal,
  validarEstrategiaInput,
  validarEstudianteInput,
  validarTutorInput,
  vincularEstudiantesAEstrategia,
} from '../utils/businessRules';
import {
  computeAuditEntryHash,
  GENESIS_HASH,
  verifyAuditChain,
} from '../utils/crypto';
import {
  buildComplianceCsvReport,
  triggerCsvDownload,
} from '../utils/csvExport';

export const STORAGE_KEY = 'sses_mvp_state_v1';

function generateIdempotencyKey(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidSsesState(candidate: unknown): candidate is SsesState {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }
  const s = candidate as Partial<SsesState>;
  return (
    s.version === SSES_SCHEMA_VERSION &&
    Array.isArray(s.entidades) &&
    Array.isArray(s.estudiantes) &&
    Array.isArray(s.docentes) &&
    Array.isArray(s.tutores) &&
    Array.isArray(s.estrategias) &&
    Array.isArray(s.acompanamientos) &&
    Array.isArray(s.constanciasReportes) &&
    Array.isArray(s.auditLog) &&
    Array.isArray(s.offlineQueue) &&
    Array.isArray(s.processedIdempotencyKeys) &&
    typeof s.isOffline === 'boolean'
  );
}

function readStoredState(): SsesState | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isValidSsesState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persistState(state: SsesState): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Graceful degradation if storage quota is exceeded in private browsing
  }
}

interface AuditEventDescriptor {
  rol: RolUsuario;
  accion: TipoAccionAuditoria;
  entidadAfectada: string;
  registroId: string;
  valoresAnteriores: Record<string, unknown> | null;
  valoresNuevos: Record<string, unknown> | null;
}

export interface SsesContextValue {
  state: SsesState;
  rolActivo: RolUsuario | null;
  isReady: boolean;
  isBrowserOffline: boolean;
  lastSyncNotification: string | null;
  clearSyncNotification: () => void;
  seleccionarRol: (rol: RolUsuario | null) => void;
  toggleModoOffline: () => Promise<SyncResult | null>;
  crearEstrategia: (input: EstrategiaInput) => Promise<MutationResult<Estrategia>>;
  editarEstrategia: (
    estrategiaId: string,
    cambios: EstrategiaInput
  ) => Promise<MutationResult<Estrategia>>;
  vincularEstudiantes: (
    estrategiaId: string,
    documentos: string[]
  ) => Promise<MutationResult<BulkLinkResult>>;
  crearEstudiante: (
    input: EstudianteInput
  ) => Promise<MutationResult<Estudiante>>;
  crearEstudiantesMasivo: (
    entidadId: string,
    textoCsv: string
  ) => Promise<MutationResult<BulkCreateEstudiantesResult>>;
  editarEstudiante: (
    estudianteId: string,
    input: EstudianteInput
  ) => Promise<MutationResult<Estudiante>>;
  eliminarEstudiante: (
    estudianteId: string
  ) => Promise<MutationResult<{ id: string }>>;
  crearTutor: (input: TutorInput) => Promise<MutationResult<Tutor>>;
  editarTutor: (
    tutorId: string,
    input: TutorInput
  ) => Promise<MutationResult<Tutor>>;
  eliminarTutor: (
    tutorId: string
  ) => Promise<MutationResult<{ id: string }>>;
  registrarAcompanamiento: (
    input: AcompanamientoInput
  ) => Promise<MutationResult<Acompanamiento>>;
  actualizarAvanceSemanal: (
    acompanamientoId: string,
    semanaId: string,
    estado: EstadoSemana,
    motivo?: string
  ) => Promise<MutationResult<SemanaSeguimiento>>;
  sincronizarColaOffline: () => Promise<SyncResult>;
  generarYDescargarReporteCsv: (
    rol: 'FUNCIONARIO_MEN' | 'ENTE_CONTROL'
  ) => Promise<ConstanciaReporte>;
  verificarIntegridadCadena: () => Promise<IntegrityCheckResult>;
  simularAlteracionAuditoria: () => Promise<{ alteredEntryId: string } | null>;
  restaurarDatosDeFabrica: () => Promise<void>;
}

const EMPTY_STATE: SsesState = {
  version: SSES_SCHEMA_VERSION,
  entidades: [],
  estudiantes: [],
  docentes: [],
  tutores: [],
  estrategias: [],
  acompanamientos: [],
  constanciasReportes: [],
  auditLog: [],
  offlineQueue: [],
  processedIdempotencyKeys: [],
  isOffline: false,
};

const SsesContext = createContext<SsesContextValue | undefined>(undefined);

export const SsesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<SsesState>(EMPTY_STATE);
  const [rolActivo, setRolActivo] = useState<RolUsuario | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isBrowserOffline, setIsBrowserOffline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine === false : false
  );
  const [lastSyncNotification, setLastSyncNotification] = useState<
    string | null
  >(null);

  const stateRef = useRef<SsesState>(EMPTY_STATE);
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  const clearSyncNotification = useCallback(() => {
    setLastSyncNotification(null);
  }, []);

  const applyNewState = useCallback((next: SsesState) => {
    stateRef.current = next;
    setState(next);
    persistState(next);
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const browserOffline =
        typeof navigator !== 'undefined' && navigator.onLine === false;
      const stored = readStoredState();
      if (stored) {
        const reconciled =
          browserOffline && !stored.isOffline
            ? { ...stored, isOffline: true }
            : stored;
        if (active) {
          applyNewState(reconciled);
          setIsReady(true);
        }
        return;
      }

      const initial = await buildInitialSsesState();
      const reconciled = browserOffline
        ? { ...initial, isOffline: true }
        : initial;
      if (active) {
        applyNewState(reconciled);
        setIsReady(true);
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [applyNewState]);

  /**
   * Serializes all state mutations through a FIFO promise queue so each
   * async Web Crypto SHA-256 audit entry chains cleanly from the latest hash.
   */
  const enqueueMutation = useCallback(
    <T,>(task: () => Promise<T>): Promise<T> => {
      const resultPromise = mutationQueueRef.current.then(task, task);
      mutationQueueRef.current = resultPromise.then(
        () => undefined,
        () => undefined
      );
      return resultPromise;
    },
    []
  );

  const commitMutation = useCallback(
    async <T,>(
      executor: (
        current: SsesState
      ) => Promise<{
        nextState: SsesState;
        audit: AuditEventDescriptor;
        result: T;
      }>
    ): Promise<T> => {
      return enqueueMutation(async () => {
        const current = stateRef.current;
        const { nextState, audit, result } = await executor(current);

        const lastEntry = nextState.auditLog[nextState.auditLog.length - 1];
        const secuencia = (lastEntry?.secuencia ?? 0) + 1;
        const previousHash = lastEntry ? lastEntry.hash : GENESIS_HASH;
        const auditPayload = {
          id: `AUD-${String(secuencia).padStart(4, '0')}`,
          secuencia,
          timestamp: new Date().toISOString(),
          rol: audit.rol,
          accion: audit.accion,
          entidadAfectada: audit.entidadAfectada,
          registroId: audit.registroId,
          valoresAnteriores: audit.valoresAnteriores,
          valoresNuevos: audit.valoresNuevos,
          previousHash,
        };

        const hash = await computeAuditEntryHash(auditPayload);
        const newEntry: AuditLogEntry = { ...auditPayload, hash };

        const finalState: SsesState = {
          ...nextState,
          auditLog: [...nextState.auditLog, newEntry],
        };

        applyNewState(finalState);
        return result;
      });
    },
    [applyNewState, enqueueMutation]
  );

  const seleccionarRol = useCallback((rol: RolUsuario | null) => {
    setRolActivo(rol);
  }, []);

  const sincronizarColaOffline = useCallback(async (): Promise<SyncResult> => {
    return enqueueMutation(async () => {
      const current = stateRef.current;
      if (current.offlineQueue.length === 0) {
        return { syncedCount: 0, skippedDuplicates: 0, remainingCount: 0 };
      }

      const processedSet = new Set(current.processedIdempotencyKeys);
      let updatedAcompanamientos = current.acompanamientos;
      let syncedCount = 0;
      let skippedDuplicates = 0;
      const syncedKeys: string[] = [];

      for (const item of current.offlineQueue) {
        if (processedSet.has(item.idempotencyKey)) {
          skippedDuplicates += 1;
          continue;
        }

        if (item.tipo === 'REGISTRAR_ACOMPANAMIENTO') {
          updatedAcompanamientos = updatedAcompanamientos.map((acomp) => {
            if (acomp.id !== item.registroId) {
              return acomp;
            }
            return {
              ...acomp,
              estadoSincronizacion: 'SINCRONIZADO',
              semanas: acomp.semanas.map((sem) => ({
                ...sem,
                estadoSincronizacion: 'SINCRONIZADO',
              })),
            };
          });
        } else if (item.tipo === 'ACTUALIZAR_SEMANA') {
          const acompId = String(item.payload.acompanamientoId ?? '');
          const semanaId = String(item.payload.semanaId ?? item.registroId);
          updatedAcompanamientos = updatedAcompanamientos.map((acomp) => {
            if (acomp.id !== acompId) {
              return acomp;
            }
            return {
              ...acomp,
              semanas: acomp.semanas.map((sem) =>
                sem.id === semanaId
                  ? { ...sem, estadoSincronizacion: 'SINCRONIZADO' }
                  : sem
              ),
            };
          });
        }

        processedSet.add(item.idempotencyKey);
        syncedKeys.push(item.idempotencyKey);
        syncedCount += 1;
      }

      const nextBase: SsesState = {
        ...current,
        acompanamientos: updatedAcompanamientos,
        offlineQueue: [],
        processedIdempotencyKeys: Array.from(processedSet),
      };

      const lastEntry = nextBase.auditLog[nextBase.auditLog.length - 1];
      const secuencia = (lastEntry?.secuencia ?? 0) + 1;
      const previousHash = lastEntry ? lastEntry.hash : GENESIS_HASH;
      const auditPayload = {
        id: `AUD-${String(secuencia).padStart(4, '0')}`,
        secuencia,
        timestamp: new Date().toISOString(),
        rol: 'TUTOR' as RolUsuario,
        accion: 'SINCRONIZACION_OFFLINE' as TipoAccionAuditoria,
        entidadAfectada: 'ColaOffline',
        registroId: `SYNC-${secuencia}`,
        valoresAnteriores: {
          pendientesEnCola: current.offlineQueue.length,
        },
        valoresNuevos: {
          sincronizados: syncedCount,
          duplicadosOmitidos: skippedDuplicates,
          idempotencyKeys: syncedKeys,
        },
        previousHash,
      };
      const hash = await computeAuditEntryHash(auditPayload);

      const finalState: SsesState = {
        ...nextBase,
        auditLog: [...nextBase.auditLog, { ...auditPayload, hash }],
      };
      applyNewState(finalState);

      return {
        syncedCount,
        skippedDuplicates,
        remainingCount: 0,
      };
    });
  }, [applyNewState, enqueueMutation]);

  const toggleModoOffline = useCallback(async (): Promise<SyncResult | null> => {
    const browserOfflineNow =
      typeof navigator !== 'undefined' && navigator.onLine === false;
    if (browserOfflineNow && stateRef.current.isOffline) {
      return null;
    }

    let becameOnline = false;
    await enqueueMutation(async () => {
      const current = stateRef.current;
      const nextOffline = !current.isOffline;
      becameOnline = current.isOffline && !nextOffline;
      applyNewState({
        ...current,
        isOffline: nextOffline,
      });
    });

    if (becameOnline && stateRef.current.offlineQueue.length > 0) {
      return sincronizarColaOffline();
    }
    return null;
  }, [applyNewState, enqueueMutation, sincronizarColaOffline]);

  useEffect(() => {
    if (!isReady || typeof window === 'undefined') {
      return;
    }

    const handleBrowserOffline = () => {
      setIsBrowserOffline(true);
      void enqueueMutation(async () => {
        const current = stateRef.current;
        if (!current.isOffline) {
          applyNewState({ ...current, isOffline: true });
        }
      });
    };

    const handleBrowserOnline = async () => {
      setIsBrowserOffline(false);
      await enqueueMutation(async () => {
        const current = stateRef.current;
        if (current.isOffline) {
          applyNewState({ ...current, isOffline: false });
        }
      });

      if (stateRef.current.offlineQueue.length > 0) {
        const syncResult = await sincronizarColaOffline();
        if (syncResult.syncedCount > 0) {
          setLastSyncNotification(
            `Red restablecida · ${syncResult.syncedCount} operación(es) sincronizada(s)`
          );
        }
      }
    };

    window.addEventListener('offline', handleBrowserOffline);
    window.addEventListener('online', handleBrowserOnline);
    return () => {
      window.removeEventListener('offline', handleBrowserOffline);
      window.removeEventListener('online', handleBrowserOnline);
    };
  }, [isReady, applyNewState, enqueueMutation, sincronizarColaOffline]);

  const crearEstrategia = useCallback(
    async (input: EstrategiaInput): Promise<MutationResult<Estrategia>> => {
      const validation = validarEstrategiaInput(
        input,
        stateRef.current.entidades
      );
      if (!validation.valid) {
        return {
          ok: false,
          error: validation.errors[0],
          errors: validation.errors,
        };
      }

      return commitMutation(async (current) => {
        const recheck = validarEstrategiaInput(input, current.entidades);
        if (!recheck.valid) {
          throw new Error(recheck.errors.join(' '));
        }

        const nextNum = current.estrategias.length + 1;
        const now = new Date().toISOString();
        const nueva: Estrategia = {
          id: `STR-${String(nextNum).padStart(3, '0')}`,
          nombre: input.nombre.trim(),
          descripcion: input.descripcion.trim(),
          entidadId: input.entidadId,
          fechaInicio: input.fechaInicio,
          fechaFin: input.fechaFin,
          estado: 'SIN_ESTUDIANTES',
          estudianteIds: [],
          creadaEn: now,
          actualizadaEn: now,
        };

        return {
          nextState: {
            ...current,
            estrategias: [...current.estrategias, nueva],
          },
          audit: {
            rol: 'FUNCIONARIO_MEN',
            accion: 'CREAR_ESTRATEGIA',
            entidadAfectada: 'Estrategia',
            registroId: nueva.id,
            valoresAnteriores: null,
            valoresNuevos: {
              id: nueva.id,
              nombre: nueva.nombre,
              descripcion: nueva.descripcion,
              entidadId: nueva.entidadId,
              fechaInicio: nueva.fechaInicio,
              fechaFin: nueva.fechaFin,
              estado: nueva.estado,
            },
          },
          result: { ok: true as const, data: nueva },
        };
      }).catch((err: unknown) => ({
        ok: false as const,
        error:
          err instanceof Error ? err.message : 'Error al crear la estrategia.',
      }));
    },
    [commitMutation]
  );

  const editarEstrategia = useCallback(
    async (
      estrategiaId: string,
      cambios: EstrategiaInput
    ): Promise<MutationResult<Estrategia>> => {
      const existing = stateRef.current.estrategias.find(
        (e) => e.id === estrategiaId
      );
      if (!existing) {
        return { ok: false, error: 'Estrategia no encontrada.' };
      }

      try {
        aplicarEdicionEstrategia(existing, cambios, stateRef.current.entidades);
      } catch (err: unknown) {
        return {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : 'No se pudo editar la estrategia.',
        };
      }

      return commitMutation(async (current) => {
        const target = current.estrategias.find((e) => e.id === estrategiaId);
        if (!target) {
          throw new Error('Estrategia no encontrada.');
        }

        const actualizada = aplicarEdicionEstrategia(
          target,
          cambios,
          current.entidades
        );

        return {
          nextState: {
            ...current,
            estrategias: current.estrategias.map((e) =>
              e.id === estrategiaId ? actualizada : e
            ),
          },
          audit: {
            rol: 'FUNCIONARIO_MEN',
            accion: 'EDITAR_ESTRATEGIA',
            entidadAfectada: 'Estrategia',
            registroId: actualizada.id,
            valoresAnteriores: {
              nombre: target.nombre,
              descripcion: target.descripcion,
              entidadId: target.entidadId,
              fechaInicio: target.fechaInicio,
              fechaFin: target.fechaFin,
              estado: target.estado,
            },
            valoresNuevos: {
              nombre: actualizada.nombre,
              descripcion: actualizada.descripcion,
              entidadId: actualizada.entidadId,
              fechaInicio: actualizada.fechaInicio,
              fechaFin: actualizada.fechaFin,
              estado: actualizada.estado,
            },
          },
          result: { ok: true as const, data: actualizada },
        };
      }).catch((err: unknown) => ({
        ok: false as const,
        error:
          err instanceof Error
            ? err.message
            : 'No se pudo editar la estrategia.',
      }));
    },
    [commitMutation]
  );

  const vincularEstudiantes = useCallback(
    async (
      estrategiaId: string,
      documentos: string[]
    ): Promise<MutationResult<BulkLinkResult>> => {
      if (documentos.length === 0) {
        return {
          ok: false,
          error: 'Debe ingresar o seleccionar al menos un documento de estudiante.',
        };
      }

      return commitMutation(async (current) => {
        const target = current.estrategias.find((e) => e.id === estrategiaId);
        if (!target) {
          throw new Error('Estrategia no encontrada.');
        }

        const bulkResult = vincularEstudiantesAEstrategia(
          target,
          documentos,
          current.estudiantes
        );

        return {
          nextState: {
            ...current,
            estrategias: current.estrategias.map((e) =>
              e.id === estrategiaId ? bulkResult.estrategiaActualizada : e
            ),
          },
          audit: {
            rol: 'FUNCIONARIO_MEN',
            accion: 'VINCULAR_ESTUDIANTES',
            entidadAfectada: 'Estrategia',
            registroId: target.id,
            valoresAnteriores: {
              estado: target.estado,
              estudianteIds: target.estudianteIds,
            },
            valoresNuevos: {
              estado: bulkResult.estrategiaActualizada.estado,
              estudianteIds: bulkResult.estrategiaActualizada.estudianteIds,
              nuevosVinculados: bulkResult.vinculados.map((v) => v.id),
              yaVinculados: bulkResult.yaVinculados,
              rechazadosOtraEntidad: bulkResult.otraEntidad,
              noEncontrados: bulkResult.noEncontrados,
            },
          },
          result: { ok: true as const, data: bulkResult },
        };
      }).catch((err: unknown) => ({
        ok: false as const,
        error:
          err instanceof Error
            ? err.message
            : 'No se pudieron vincular los estudiantes.',
      }));
    },
    [commitMutation]
  );

  const crearEstudiante = useCallback(
    async (input: EstudianteInput): Promise<MutationResult<Estudiante>> => {
      const validation = validarEstudianteInput(
        input,
        stateRef.current.entidades,
        stateRef.current.estudiantes
      );
      if (!validation.valid) {
        return {
          ok: false,
          error: validation.errors[0],
          errors: validation.errors,
        };
      }

      return commitMutation(async (current) => {
        const recheck = validarEstudianteInput(
          input,
          current.entidades,
          current.estudiantes
        );
        if (!recheck.valid) {
          throw new Error(recheck.errors.join(' '));
        }

        const nextNum =
          current.estudiantes.reduce((max, est) => {
            const match = /^EST-(\d+)$/.exec(est.id);
            return match ? Math.max(max, Number.parseInt(match[1], 10)) : max;
          }, current.estudiantes.length) + 1;

        const gradoFormateado = normalizarGradoNumerico(input.grado);
        if (!gradoFormateado) {
          throw new Error(
            'El grado debe ser únicamente un número entero positivo (sin el símbolo °).'
          );
        }

        const nuevo: Estudiante = {
          id: `EST-${String(nextNum).padStart(3, '0')}`,
          tipoDocumento: input.tipoDocumento,
          numeroDocumento: input.numeroDocumento.trim().replace(/\s+/g, ''),
          nombreCompleto: input.nombreCompleto.trim(),
          entidadId: input.entidadId,
          grado: gradoFormateado,
        };

        return {
          nextState: {
            ...current,
            estudiantes: [...current.estudiantes, nuevo],
          },
          audit: {
            rol: 'FUNCIONARIO_MEN',
            accion: 'CREAR_ESTUDIANTE',
            entidadAfectada: 'Estudiante',
            registroId: nuevo.id,
            valoresAnteriores: null,
            valoresNuevos: {
              id: nuevo.id,
              tipoDocumento: nuevo.tipoDocumento,
              numeroDocumento: nuevo.numeroDocumento,
              nombreCompleto: nuevo.nombreCompleto,
              entidadId: nuevo.entidadId,
              grado: nuevo.grado,
            },
          },
          result: { ok: true as const, data: nuevo },
        };
      }).catch((err: unknown) => ({
        ok: false as const,
        error:
          err instanceof Error
            ? err.message
            : 'No se pudo registrar el estudiante.',
      }));
    },
    [commitMutation]
  );

  const crearEstudiantesMasivo = useCallback(
    async (
      entidadId: string,
      textoCsv: string
    ): Promise<MutationResult<BulkCreateEstudiantesResult>> => {
      if (!textoCsv.trim()) {
        return {
          ok: false,
          error: 'Ingrese o cargue al menos una fila de estudiantes.',
        };
      }

      const entidad = stateRef.current.entidades.find(
        (e) => e.id === entidadId
      );
      if (!entidad || entidad.estado !== 'ACTIVA') {
        return {
          ok: false,
          error: 'Debe seleccionar una entidad educativa ACTIVA.',
        };
      }

      return commitMutation(async (current) => {
        const bulkResult = procesarCargaMasivaEstudiantes(
          textoCsv,
          entidadId,
          current.entidades,
          current.estudiantes
        );

        return {
          nextState: {
            ...current,
            estudiantes: [...current.estudiantes, ...bulkResult.creados],
          },
          audit: {
            rol: 'FUNCIONARIO_MEN',
            accion: 'CARGA_MASIVA_ESTUDIANTES',
            entidadAfectada: 'Estudiante',
            registroId: entidadId,
            valoresAnteriores: {
              totalEstudiantes: current.estudiantes.length,
            },
            valoresNuevos: {
              totalEstudiantes:
                current.estudiantes.length + bulkResult.creados.length,
              creadosIds: bulkResult.creados.map((e) => e.id),
              duplicados: bulkResult.duplicados,
              invalidos: bulkResult.invalidos.length,
            },
          },
          result: { ok: true as const, data: bulkResult },
        };
      }).catch((err: unknown) => ({
        ok: false as const,
        error:
          err instanceof Error
            ? err.message
            : 'No se pudo procesar la carga masiva de estudiantes.',
      }));
    },
    [commitMutation]
  );

  const editarEstudiante = useCallback(
    async (
      estudianteId: string,
      input: EstudianteInput
    ): Promise<MutationResult<Estudiante>> => {
      const existing = stateRef.current.estudiantes.find(
        (e) => e.id === estudianteId
      );
      if (!existing) {
        return { ok: false, error: 'Estudiante no encontrado.' };
      }

      const linkedStrategy = stateRef.current.estrategias.find((est) =>
        est.estudianteIds.includes(estudianteId)
      );
      if (linkedStrategy && input.entidadId !== existing.entidadId) {
        return {
          ok: false,
          error: `No se puede cambiar la entidad de un estudiante vinculado a ${linkedStrategy.id}.`,
        };
      }

      const validation = validarEstudianteInput(
        input,
        stateRef.current.entidades,
        stateRef.current.estudiantes,
        estudianteId
      );
      if (!validation.valid) {
        return {
          ok: false,
          error: validation.errors[0],
          errors: validation.errors,
        };
      }

      return commitMutation(async (current) => {
        const target = current.estudiantes.find((e) => e.id === estudianteId);
        if (!target) {
          throw new Error('Estudiante no encontrado.');
        }

        const linked = current.estrategias.find((est) =>
          est.estudianteIds.includes(estudianteId)
        );
        if (linked && input.entidadId !== target.entidadId) {
          throw new Error(
            `No se puede cambiar la entidad de un estudiante vinculado a ${linked.id}.`
          );
        }

        const recheck = validarEstudianteInput(
          input,
          current.entidades,
          current.estudiantes,
          estudianteId
        );
        if (!recheck.valid) {
          throw new Error(recheck.errors.join(' '));
        }

        const gradoFormateado = normalizarGradoNumerico(input.grado);
        if (!gradoFormateado) {
          throw new Error(
            'El grado debe ser únicamente un número entero positivo (sin el símbolo °).'
          );
        }

        const actualizado: Estudiante = {
          ...target,
          tipoDocumento: input.tipoDocumento,
          numeroDocumento: input.numeroDocumento.trim().replace(/\s+/g, ''),
          nombreCompleto: input.nombreCompleto.trim(),
          entidadId: input.entidadId,
          grado: gradoFormateado,
        };

        return {
          nextState: {
            ...current,
            estudiantes: current.estudiantes.map((e) =>
              e.id === estudianteId ? actualizado : e
            ),
          },
          audit: {
            rol: 'FUNCIONARIO_MEN',
            accion: 'EDITAR_ESTUDIANTE',
            entidadAfectada: 'Estudiante',
            registroId: actualizado.id,
            valoresAnteriores: {
              tipoDocumento: target.tipoDocumento,
              numeroDocumento: target.numeroDocumento,
              nombreCompleto: target.nombreCompleto,
              entidadId: target.entidadId,
              grado: target.grado,
            },
            valoresNuevos: {
              tipoDocumento: actualizado.tipoDocumento,
              numeroDocumento: actualizado.numeroDocumento,
              nombreCompleto: actualizado.nombreCompleto,
              entidadId: actualizado.entidadId,
              grado: actualizado.grado,
            },
          },
          result: { ok: true as const, data: actualizado },
        };
      }).catch((err: unknown) => ({
        ok: false as const,
        error:
          err instanceof Error
            ? err.message
            : 'No se pudo editar el estudiante.',
      }));
    },
    [commitMutation]
  );

  const eliminarEstudiante = useCallback(
    async (estudianteId: string): Promise<MutationResult<{ id: string }>> => {
      const existing = stateRef.current.estudiantes.find(
        (e) => e.id === estudianteId
      );
      if (!existing) {
        return { ok: false, error: 'Estudiante no encontrado.' };
      }

      const linkedStrategy = stateRef.current.estrategias.find((est) =>
        est.estudianteIds.includes(estudianteId)
      );
      if (linkedStrategy) {
        return {
          ok: false,
          error: `No se puede eliminar: está vinculado a la estrategia ${linkedStrategy.id}.`,
        };
      }

      return commitMutation(async (current) => {
        const target = current.estudiantes.find((e) => e.id === estudianteId);
        if (!target) {
          throw new Error('Estudiante no encontrado.');
        }

        const linked = current.estrategias.find((est) =>
          est.estudianteIds.includes(estudianteId)
        );
        if (linked) {
          throw new Error(
            `No se puede eliminar: está vinculado a la estrategia ${linked.id}.`
          );
        }

        return {
          nextState: {
            ...current,
            estudiantes: current.estudiantes.filter(
              (e) => e.id !== estudianteId
            ),
          },
          audit: {
            rol: 'FUNCIONARIO_MEN',
            accion: 'ELIMINAR_ESTUDIANTE',
            entidadAfectada: 'Estudiante',
            registroId: target.id,
            valoresAnteriores: {
              id: target.id,
              tipoDocumento: target.tipoDocumento,
              numeroDocumento: target.numeroDocumento,
              nombreCompleto: target.nombreCompleto,
              entidadId: target.entidadId,
              grado: target.grado,
            },
            valoresNuevos: null,
          },
          result: { ok: true as const, data: { id: target.id } },
        };
      }).catch((err: unknown) => ({
        ok: false as const,
        error:
          err instanceof Error
            ? err.message
            : 'No se pudo eliminar el estudiante.',
      }));
    },
    [commitMutation]
  );

  const crearTutor = useCallback(
    async (input: TutorInput): Promise<MutationResult<Tutor>> => {
      const validation = validarTutorInput(input, stateRef.current.tutores);
      if (!validation.valid) {
        return {
          ok: false,
          error: validation.errors[0],
          errors: validation.errors,
        };
      }

      return commitMutation(async (current) => {
        const recheck = validarTutorInput(input, current.tutores);
        if (!recheck.valid) {
          throw new Error(recheck.errors.join(' '));
        }

        const nextNum =
          current.tutores.reduce((max, tut) => {
            const match = /^TUT-(\d+)$/.exec(tut.id);
            return match ? Math.max(max, Number.parseInt(match[1], 10)) : max;
          }, current.tutores.length) + 1;

        const nuevo: Tutor = {
          id: `TUT-${String(nextNum).padStart(3, '0')}`,
          tipoDocumento: input.tipoDocumento,
          numeroDocumento: input.numeroDocumento.trim().replace(/\s+/g, ''),
          nombreCompleto: input.nombreCompleto.trim(),
          zonaAsignada: input.zonaAsignada.trim(),
        };

        return {
          nextState: {
            ...current,
            tutores: [...current.tutores, nuevo],
          },
          audit: {
            rol: 'FUNCIONARIO_MEN',
            accion: 'CREAR_TUTOR',
            entidadAfectada: 'Tutor',
            registroId: nuevo.id,
            valoresAnteriores: null,
            valoresNuevos: {
              id: nuevo.id,
              tipoDocumento: nuevo.tipoDocumento,
              numeroDocumento: nuevo.numeroDocumento,
              nombreCompleto: nuevo.nombreCompleto,
              zonaAsignada: nuevo.zonaAsignada,
            },
          },
          result: { ok: true as const, data: nuevo },
        };
      }).catch((err: unknown) => ({
        ok: false as const,
        error:
          err instanceof Error
            ? err.message
            : 'No se pudo registrar el tutor.',
      }));
    },
    [commitMutation]
  );

  const editarTutor = useCallback(
    async (
      tutorId: string,
      input: TutorInput
    ): Promise<MutationResult<Tutor>> => {
      const existing = stateRef.current.tutores.find((t) => t.id === tutorId);
      if (!existing) {
        return { ok: false, error: 'Tutor no encontrado.' };
      }

      const validation = validarTutorInput(
        input,
        stateRef.current.tutores,
        tutorId
      );
      if (!validation.valid) {
        return {
          ok: false,
          error: validation.errors[0],
          errors: validation.errors,
        };
      }

      return commitMutation(async (current) => {
        const target = current.tutores.find((t) => t.id === tutorId);
        if (!target) {
          throw new Error('Tutor no encontrado.');
        }

        const recheck = validarTutorInput(input, current.tutores, tutorId);
        if (!recheck.valid) {
          throw new Error(recheck.errors.join(' '));
        }

        const actualizado: Tutor = {
          ...target,
          tipoDocumento: input.tipoDocumento,
          numeroDocumento: input.numeroDocumento.trim().replace(/\s+/g, ''),
          nombreCompleto: input.nombreCompleto.trim(),
          zonaAsignada: input.zonaAsignada.trim(),
        };

        return {
          nextState: {
            ...current,
            tutores: current.tutores.map((t) =>
              t.id === tutorId ? actualizado : t
            ),
          },
          audit: {
            rol: 'FUNCIONARIO_MEN',
            accion: 'EDITAR_TUTOR',
            entidadAfectada: 'Tutor',
            registroId: actualizado.id,
            valoresAnteriores: {
              tipoDocumento: target.tipoDocumento,
              numeroDocumento: target.numeroDocumento,
              nombreCompleto: target.nombreCompleto,
              zonaAsignada: target.zonaAsignada,
            },
            valoresNuevos: {
              tipoDocumento: actualizado.tipoDocumento,
              numeroDocumento: actualizado.numeroDocumento,
              nombreCompleto: actualizado.nombreCompleto,
              zonaAsignada: actualizado.zonaAsignada,
            },
          },
          result: { ok: true as const, data: actualizado },
        };
      }).catch((err: unknown) => ({
        ok: false as const,
        error:
          err instanceof Error ? err.message : 'No se pudo editar el tutor.',
      }));
    },
    [commitMutation]
  );

  const eliminarTutor = useCallback(
    async (tutorId: string): Promise<MutationResult<{ id: string }>> => {
      const existing = stateRef.current.tutores.find((t) => t.id === tutorId);
      if (!existing) {
        return { ok: false, error: 'Tutor no encontrado.' };
      }

      const assignedAcomp = stateRef.current.acompanamientos.find(
        (a) => a.tutorId === tutorId
      );
      if (assignedAcomp) {
        return {
          ok: false,
          error: `No se puede eliminar: tiene acompañamientos registrados (${assignedAcomp.id}).`,
        };
      }

      return commitMutation(async (current) => {
        const target = current.tutores.find((t) => t.id === tutorId);
        if (!target) {
          throw new Error('Tutor no encontrado.');
        }

        const assigned = current.acompanamientos.find(
          (a) => a.tutorId === tutorId
        );
        if (assigned) {
          throw new Error(
            `No se puede eliminar: tiene acompañamientos registrados (${assigned.id}).`
          );
        }

        return {
          nextState: {
            ...current,
            tutores: current.tutores.filter((t) => t.id !== tutorId),
          },
          audit: {
            rol: 'FUNCIONARIO_MEN',
            accion: 'ELIMINAR_TUTOR',
            entidadAfectada: 'Tutor',
            registroId: target.id,
            valoresAnteriores: {
              id: target.id,
              tipoDocumento: target.tipoDocumento,
              numeroDocumento: target.numeroDocumento,
              nombreCompleto: target.nombreCompleto,
              zonaAsignada: target.zonaAsignada,
            },
            valoresNuevos: null,
          },
          result: { ok: true as const, data: { id: target.id } },
        };
      }).catch((err: unknown) => ({
        ok: false as const,
        error:
          err instanceof Error ? err.message : 'No se pudo eliminar el tutor.',
      }));
    },
    [commitMutation]
  );

  const registrarAcompanamiento = useCallback(
    async (
      input: AcompanamientoInput
    ): Promise<MutationResult<Acompanamiento>> => {
      const estrategia = stateRef.current.estrategias.find(
        (e) => e.id === input.estrategiaId
      );
      if (!estrategia) {
        return { ok: false, error: 'La estrategia seleccionada no existe.' };
      }

      const docentesEntidad = stateRef.current.docentes.filter(
        (d) => d.entidadId === estrategia.entidadId
      );
      const validacion = validarAcompanamientoInput(input, docentesEntidad);
      if (!validacion.valid) {
        return {
          ok: false,
          error: validacion.errors[0],
          errors: validacion.errors,
        };
      }

      return commitMutation(async (current) => {
        const est = current.estrategias.find(
          (e) => e.id === input.estrategiaId
        );
        if (!est) {
          throw new Error('La estrategia seleccionada no existe.');
        }

        const docentesValidos = current.docentes.filter(
          (d) => d.entidadId === est.entidadId
        );
        const recheck = validarAcompanamientoInput(input, docentesValidos);
        if (!recheck.valid) {
          throw new Error(recheck.errors.join(' '));
        }

        const nextNum = current.acompanamientos.length + 1;
        const acompId = `ACO-${String(nextNum).padStart(3, '0')}`;
        const idempotencyKey = generateIdempotencyKey('idem-aco');
        const estadoSincronizacion = current.isOffline
          ? 'PENDIENTE_SINCRONIZACION'
          : 'SINCRONIZADO';
        const now = new Date().toISOString();

        const nuevo: Acompanamiento = {
          id: acompId,
          estrategiaId: input.estrategiaId,
          tutorId: input.tutorId,
          mes: input.mes,
          modalidad: input.modalidad,
          docenteIds: Array.from(new Set(input.docenteIds)),
          observaciones: input.observaciones.trim(),
          semanas: generarCuatroSemanasPendientes(
            acompId,
            input.mes,
            estadoSincronizacion
          ),
          estadoSincronizacion,
          idempotencyKey,
          creadoEn: now,
        };

        const offlineQueue: OfflineQueueItem[] = current.isOffline
          ? [
              ...current.offlineQueue,
              {
                idempotencyKey,
                tipo: 'REGISTRAR_ACOMPANAMIENTO',
                creadoEn: now,
                registroId: acompId,
                payload: {
                  acompanamientoId: acompId,
                  estrategiaId: nuevo.estrategiaId,
                  mes: nuevo.mes,
                  modalidad: nuevo.modalidad,
                },
              },
            ]
          : current.offlineQueue;

        const processedIdempotencyKeys = current.isOffline
          ? current.processedIdempotencyKeys
          : [...current.processedIdempotencyKeys, idempotencyKey];

        return {
          nextState: {
            ...current,
            acompanamientos: [nuevo, ...current.acompanamientos],
            offlineQueue,
            processedIdempotencyKeys,
          },
          audit: {
            rol: 'TUTOR',
            accion: 'REGISTRAR_ACOMPANAMIENTO',
            entidadAfectada: 'Acompanamiento',
            registroId: nuevo.id,
            valoresAnteriores: null,
            valoresNuevos: {
              id: nuevo.id,
              estrategiaId: nuevo.estrategiaId,
              tutorId: nuevo.tutorId,
              mes: nuevo.mes,
              modalidad: nuevo.modalidad,
              docenteIds: nuevo.docenteIds,
              semanasGeneradas: nuevo.semanas.length,
              estadoSincronizacion: nuevo.estadoSincronizacion,
              idempotencyKey: nuevo.idempotencyKey,
            },
          },
          result: { ok: true as const, data: nuevo },
        };
      }).catch((err: unknown) => ({
        ok: false as const,
        error:
          err instanceof Error
            ? err.message
            : 'No se pudo registrar el acompañamiento.',
      }));
    },
    [commitMutation]
  );

  const actualizarAvanceSemanal = useCallback(
    async (
      acompanamientoId: string,
      semanaId: string,
      estado: EstadoSemana,
      motivo?: string
    ): Promise<MutationResult<SemanaSeguimiento>> => {
      const validacion = validarAvanceSemanal(estado, motivo);
      if (!validacion.valid) {
        return {
          ok: false,
          error: validacion.errors[0],
          errors: validacion.errors,
        };
      }

      return commitMutation(async (current) => {
        const acomp = current.acompanamientos.find(
          (a) => a.id === acompanamientoId
        );
        if (!acomp) {
          throw new Error('Acompañamiento no encontrado.');
        }

        const prevSemana = acomp.semanas.find((s) => s.id === semanaId);
        if (!prevSemana) {
          throw new Error('Semana de seguimiento no encontrada.');
        }

        const now = new Date().toISOString();
        const idempotencyKey = generateIdempotencyKey('idem-sem');
        const estadoSincronizacion = current.isOffline
          ? 'PENDIENTE_SINCRONIZACION'
          : 'SINCRONIZADO';

        const updatedSemana: SemanaSeguimiento = {
          ...prevSemana,
          estado,
          motivoNoRealizado:
            estado === 'NO_REALIZADO' ? (motivo ?? '').trim() : undefined,
          estadoSincronizacion,
          actualizadaEn: now,
        };

        const updatedAcompanamientos = current.acompanamientos.map((a) =>
          a.id === acompanamientoId
            ? {
                ...a,
                semanas: a.semanas.map((s) =>
                  s.id === semanaId ? updatedSemana : s
                ),
              }
            : a
        );

        const offlineQueue: OfflineQueueItem[] = current.isOffline
          ? [
              ...current.offlineQueue,
              {
                idempotencyKey,
                tipo: 'ACTUALIZAR_SEMANA',
                creadoEn: now,
                registroId: semanaId,
                payload: {
                  acompanamientoId,
                  semanaId,
                  estado,
                  motivoNoRealizado: updatedSemana.motivoNoRealizado ?? null,
                },
              },
            ]
          : current.offlineQueue;

        const processedIdempotencyKeys = current.isOffline
          ? current.processedIdempotencyKeys
          : [...current.processedIdempotencyKeys, idempotencyKey];

        return {
          nextState: {
            ...current,
            acompanamientos: updatedAcompanamientos,
            offlineQueue,
            processedIdempotencyKeys,
          },
          audit: {
            rol: 'TUTOR',
            accion: 'ACTUALIZAR_SEMANA',
            entidadAfectada: 'SemanaSeguimiento',
            registroId: semanaId,
            valoresAnteriores: {
              estado: prevSemana.estado,
              motivoNoRealizado: prevSemana.motivoNoRealizado ?? null,
              estadoSincronizacion: prevSemana.estadoSincronizacion,
            },
            valoresNuevos: {
              estado: updatedSemana.estado,
              motivoNoRealizado: updatedSemana.motivoNoRealizado ?? null,
              estadoSincronizacion: updatedSemana.estadoSincronizacion,
              idempotencyKey,
            },
          },
          result: { ok: true as const, data: updatedSemana },
        };
      }).catch((err: unknown) => ({
        ok: false as const,
        error:
          err instanceof Error
            ? err.message
            : 'No se pudo actualizar el avance semanal.',
      }));
    },
    [commitMutation]
  );

  const generarYDescargarReporteCsv = useCallback(
    async (
      rol: 'FUNCIONARIO_MEN' | 'ENTE_CONTROL'
    ): Promise<ConstanciaReporte> => {
      return commitMutation(async (current) => {
        const { csvContent, constancia } = await buildComplianceCsvReport(
          current,
          rol
        );
        triggerCsvDownload(constancia.nombreArchivo, csvContent);

        return {
          nextState: {
            ...current,
            constanciasReportes: [constancia, ...current.constanciasReportes],
          },
          audit: {
            rol,
            accion: 'GENERAR_REPORTE_CSV',
            entidadAfectada: 'ConstanciaReporte',
            registroId: constancia.id,
            valoresAnteriores: null,
            valoresNuevos: {
              id: constancia.id,
              nombreArchivo: constancia.nombreArchivo,
              enmascaradoLey1581: constancia.enmascaradoLey1581,
              totalRegistros: constancia.totalRegistros,
              sha256: constancia.sha256,
            },
          },
          result: constancia,
        };
      });
    },
    [commitMutation]
  );

  const verificarIntegridadCadena =
    useCallback(async (): Promise<IntegrityCheckResult> => {
      return verifyAuditChain(stateRef.current.auditLog);
    }, []);

  /**
   * Demo-only helper (FR-027) to tamper with an audit entry's payload without
   * recalculating its SHA-256 hash, proving live tamper detection.
   * Cleanly reversible via `restaurarDatosDeFabrica`.
   */
  const simularAlteracionAuditoria = useCallback(async (): Promise<{
    alteredEntryId: string;
  } | null> => {
    return enqueueMutation(async () => {
      const current = stateRef.current;
      if (current.auditLog.length === 0) {
        return null;
      }

      const targetIndex = current.auditLog.length >= 2 ? 1 : 0;
      const targetEntry = current.auditLog[targetIndex];
      const tamperedAuditLog = current.auditLog.map((entry, idx) => {
        if (idx !== targetIndex) {
          return entry;
        }
        return {
          ...entry,
          valoresNuevos: {
            ...(entry.valoresNuevos ?? {}),
            __alteracionDemoSimulada:
              'VALOR_MODIFICADO_SIN_AUTORIZACION_PARA_DEMO',
          },
        };
      });

      applyNewState({
        ...current,
        auditLog: tamperedAuditLog,
      });

      return { alteredEntryId: targetEntry.id };
    });
  }, [applyNewState, enqueueMutation]);

  const restaurarDatosDeFabrica = useCallback(async (): Promise<void> => {
    return enqueueMutation(async () => {
      const freshState = await buildInitialSsesState();
      applyNewState(freshState);
    });
  }, [applyNewState, enqueueMutation]);

  const value = useMemo<SsesContextValue>(
    () => ({
      state,
      rolActivo,
      isReady,
      isBrowserOffline,
      lastSyncNotification,
      clearSyncNotification,
      seleccionarRol,
      toggleModoOffline,
      crearEstrategia,
      editarEstrategia,
      vincularEstudiantes,
      crearEstudiante,
      crearEstudiantesMasivo,
      editarEstudiante,
      eliminarEstudiante,
      crearTutor,
      editarTutor,
      eliminarTutor,
      registrarAcompanamiento,
      actualizarAvanceSemanal,
      sincronizarColaOffline,
      generarYDescargarReporteCsv,
      verificarIntegridadCadena,
      simularAlteracionAuditoria,
      restaurarDatosDeFabrica,
    }),
    [
      state,
      rolActivo,
      isReady,
      isBrowserOffline,
      lastSyncNotification,
      clearSyncNotification,
      seleccionarRol,
      toggleModoOffline,
      crearEstrategia,
      editarEstrategia,
      vincularEstudiantes,
      crearEstudiante,
      crearEstudiantesMasivo,
      editarEstudiante,
      eliminarEstudiante,
      crearTutor,
      editarTutor,
      eliminarTutor,
      registrarAcompanamiento,
      actualizarAvanceSemanal,
      sincronizarColaOffline,
      generarYDescargarReporteCsv,
      verificarIntegridadCadena,
      simularAlteracionAuditoria,
      restaurarDatosDeFabrica,
    ]
  );

  return <SsesContext.Provider value={value}>{children}</SsesContext.Provider>;
};

export function useSses(): SsesContextValue {
  const context = useContext(SsesContext);
  if (!context) {
    throw new Error('useSses debe utilizarse dentro de un SsesProvider.');
  }
  return context;
}

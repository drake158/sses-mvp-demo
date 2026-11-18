import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CloudOff,
  PlusCircle,
  Users,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { useSses } from '../../context/SsesContext';
import type { ModalidadAcompanamiento } from '../../types/sses';

export const TutorView: React.FC = () => {
  const { state, registrarAcompanamiento, actualizarAvanceSemanal } = useSses();

  const estrategiasById = useMemo(
    () => new Map(state.estrategias.map((e) => [e.id, e])),
    [state.estrategias]
  );
  const entidadesById = useMemo(
    () => new Map(state.entidades.map((e) => [e.id, e])),
    [state.entidades]
  );
  const tutoresById = useMemo(
    () => new Map(state.tutores.map((t) => [t.id, t])),
    [state.tutores]
  );
  const docentesById = useMemo(
    () => new Map(state.docentes.map((d) => [d.id, d])),
    [state.docentes]
  );

  // Accompaniment form state
  const [estrategiaId, setEstrategiaId] = useState(
    state.estrategias[0]?.id ?? ''
  );
  const [tutorId, setTutorId] = useState(state.tutores[0]?.id ?? '');
  const [mes, setMes] = useState('2026-11');
  const [modalidad, setModalidad] =
    useState<ModalidadAcompanamiento>('INDIVIDUAL');
  const [docenteIds, setDocenteIds] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Weekly NO_REALIZADO inline form state
  const [activeNoRealizadoKey, setActiveNoRealizadoKey] = useState<
    string | null
  >(null);
  const [motivoDraft, setMotivoDraft] = useState('');
  const [weekError, setWeekError] = useState<Record<string, string>>({});
  const [weekFeedback, setWeekFeedback] = useState<string | null>(null);

  const selectedStrategy =
    estrategiasById.get(estrategiaId) ?? state.estrategias[0];
  const effectiveEstrategiaId = selectedStrategy?.id ?? '';

  useEffect(() => {
    if (effectiveEstrategiaId && estrategiaId !== effectiveEstrategiaId) {
      setEstrategiaId(effectiveEstrategiaId);
    }
  }, [effectiveEstrategiaId, estrategiaId]);

  const docentesEntidad = useMemo(() => {
    if (!selectedStrategy) return [];
    return state.docentes.filter(
      (d) => d.entidadId === selectedStrategy.entidadId
    );
  }, [selectedStrategy, state.docentes]);

  // Reset selected teachers when strategy or modality changes
  useEffect(() => {
    if (docentesEntidad.length === 0) {
      setDocenteIds([]);
      return;
    }
    if (modalidad === 'INDIVIDUAL') {
      setDocenteIds([docentesEntidad[0].id]);
    } else {
      setDocenteIds(docentesEntidad.map((d) => d.id));
    }
  }, [estrategiaId, modalidad, docentesEntidad]);

  const toggleDocente = (id: string) => {
    if (modalidad === 'INDIVIDUAL') {
      setDocenteIds([id]);
      return;
    }
    setDocenteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmitAcompanamiento = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSaving(true);
    try {
      const res = await registrarAcompanamiento({
        estrategiaId,
        tutorId,
        mes,
        modalidad,
        docenteIds,
        observaciones,
      });

      if (!res.ok) {
        setFormError(res.errors?.join(' ') ?? res.error);
        return;
      }

      setObservaciones('');
      setFormSuccess(
        res.data.estadoSincronizacion === 'PENDIENTE_SINCRONIZACION'
          ? `Acompañamiento ${res.data.id} guardado en cola offline con 4 semanas PENDIENTE (Idempotency-Key: ${res.data.idempotencyKey.slice(0, 18)}…).`
          : `Acompañamiento ${res.data.id} registrado en línea con 4 semanas PENDIENTE autogeneradas.`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkRealizado = async (
    acompanamientoId: string,
    semanaId: string
  ) => {
    setWeekError((prev) => ({ ...prev, [semanaId]: '' }));
    setWeekFeedback(null);
    const res = await actualizarAvanceSemanal(
      acompanamientoId,
      semanaId,
      'REALIZADO'
    );
    if (!res.ok) {
      setWeekError((prev) => ({ ...prev, [semanaId]: res.error }));
      return;
    }
    if (activeNoRealizadoKey === semanaId) {
      setActiveNoRealizadoKey(null);
      setMotivoDraft('');
    }
    setWeekFeedback(
      res.data.estadoSincronizacion === 'PENDIENTE_SINCRONIZACION'
        ? `Semana ${res.data.numeroSemana} marcada como REALIZADO en cola offline (Pendiente de sincronización).`
        : `Semana ${res.data.numeroSemana} actualizada a REALIZADO.`
    );
  };

  const handleSaveNoRealizado = async (
    acompanamientoId: string,
    semanaId: string
  ) => {
    setWeekError((prev) => ({ ...prev, [semanaId]: '' }));
    setWeekFeedback(null);
    const res = await actualizarAvanceSemanal(
      acompanamientoId,
      semanaId,
      'NO_REALIZADO',
      motivoDraft
    );
    if (!res.ok) {
      setWeekError((prev) => ({ ...prev, [semanaId]: res.error }));
      return;
    }
    setActiveNoRealizadoKey(null);
    setMotivoDraft('');
    setWeekFeedback(
      res.data.estadoSincronizacion === 'PENDIENTE_SINCRONIZACION'
        ? `Semana ${res.data.numeroSemana} marcada como NO_REALIZADO en cola offline.`
        : `Semana ${res.data.numeroSemana} marcada como NO_REALIZADO con justificación registrada.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-men-amber">
          Perfil 2 · Tutor Territorial
        </span>
        <h1 className="text-2xl font-bold text-men-navy mt-0.5">
          Acompañamientos Mensuales, Seguimiento Semanal y Operación Offline
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Registre acompañamientos individuales o grupales (4 semanas PENDIENTE
          autogeneradas), reporte el avance semanal y pruebe el interruptor{' '}
          <strong>&quot;En línea / Sin conexión&quot;</strong> en la barra
          superior.
        </p>
      </div>

      {/* Offline Contextual Banner */}
      {state.isOffline && (
        <div
          role="status"
          className="p-4 rounded-xl bg-amber-50 border-2 border-men-amber text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-men-amber shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-sm text-men-amber">
                Modo &quot;Sin conexión&quot; Activo — Cola Local con
                Idempotency-Key
              </div>
              <p>
                Los acompañamientos y avances semanales que guarde ahora se
                almacenarán localmente con insignia{' '}
                <strong>&quot;Pendiente de sincronización&quot;</strong>. Al
                volver a <strong>&quot;En línea&quot;</strong> en el encabezado,
                se sincronizarán automáticamente sin generar duplicados.
              </p>
            </div>
          </div>
          <div className="shrink-0 px-3 py-1.5 rounded-lg bg-men-amber text-white text-xs font-bold">
            {state.offlineQueue.length} en cola local
          </div>
        </div>
      )}

      {weekFeedback && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-men-emerald text-men-emerald text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{weekFeedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Create Monthly Accompaniment Form */}
        <section className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-men-navy text-white flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-sky-300" />
            <h2 className="text-sm font-bold">
              Registrar Acompañamiento Mensual
            </h2>
          </div>

          <form onSubmit={handleSubmitAcompanamiento} className="p-5 space-y-4">
            <div>
              <label
                htmlFor="aco-estrategia"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Estrategia asociada *
              </label>
              <select
                id="aco-estrategia"
                value={estrategiaId}
                onChange={(e) => setEstrategiaId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-men-blue focus:outline-none"
              >
                {state.estrategias.map((est) => {
                  const ent = entidadesById.get(est.entidadId);
                  return (
                    <option key={est.id} value={est.id}>
                      {est.id} · {est.nombre} ({ent?.municipio})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="aco-tutor"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Tutor *
                </label>
                <select
                  id="aco-tutor"
                  value={tutorId}
                  onChange={(e) => setTutorId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:border-men-blue focus:outline-none"
                >
                  {state.tutores.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombreCompleto}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="aco-mes"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Mes del acompañamiento *
                </label>
                <input
                  id="aco-mes"
                  type="month"
                  required
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-men-blue focus:outline-none"
                />
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Modalidad *
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModalidad('INDIVIDUAL')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    modalidad === 'INDIVIDUAL'
                      ? 'bg-men-blue text-white border-men-blue'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Individual (1 docente)
                </button>
                <button
                  type="button"
                  onClick={() => setModalidad('GRUPAL')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    modalidad === 'GRUPAL'
                      ? 'bg-men-blue text-white border-men-blue'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Grupal (&gt;= 2 docentes)
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-700">
                  Docentes de la entidad ({docenteIds.length} seleccionado(s)) *
                </span>
                <span className="text-[11px] text-slate-500">
                  {modalidad === 'INDIVIDUAL'
                    ? 'Exactamente 1'
                    : 'Mínimo 2 docentes'}
                </span>
              </div>
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {docentesEntidad.map((doc) => {
                  const checked = docenteIds.includes(doc.id);
                  return (
                    <label
                      key={doc.id}
                      className="flex items-center gap-2.5 text-xs cursor-pointer"
                    >
                      <input
                        type={modalidad === 'INDIVIDUAL' ? 'radio' : 'checkbox'}
                        name="docentes-seleccion"
                        checked={checked}
                        onChange={() => toggleDocente(doc.id)}
                        className="accent-men-blue"
                      />
                      <span className="font-medium text-men-navy">
                        {doc.nombreCompleto}
                      </span>
                      <span className="text-slate-500">· {doc.area}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="aco-obs"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Observaciones de planeación
              </label>
              <textarea
                id="aco-obs"
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Objetivos pedagógicos del acompañamiento mensual..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-men-blue focus:outline-none"
              />
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-men-red text-men-red text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-men-emerald text-men-emerald text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-semibold text-sm transition-colors disabled:opacity-60 ${
                state.isOffline
                  ? 'bg-men-amber hover:bg-amber-700'
                  : 'bg-men-blue hover:bg-[#0052A3]'
              }`}
            >
              {state.isOffline ? (
                <CloudOff className="w-4 h-4" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
              <span>
                {isSaving
                  ? 'Guardando...'
                  : state.isOffline
                  ? 'Guardar en Cola Offline (4 semanas PENDIENTE)'
                  : 'Registrar Acompañamiento (4 semanas PENDIENTE)'}
              </span>
            </button>
          </form>
        </section>

        {/* Right: Accompaniments List + Weekly Follow-up Controls */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-men-navy">
              Acompañamientos Mensuales y Seguimiento Semanal (
              {state.acompanamientos.length})
            </h2>
          </div>

          {state.acompanamientos.map((acomp) => {
            const est = estrategiasById.get(acomp.estrategiaId);
            const ent = est ? entidadesById.get(est.entidadId) : undefined;
            const tutor = tutoresById.get(acomp.tutorId);
            const isPendingSync =
              acomp.estadoSincronizacion === 'PENDIENTE_SINCRONIZACION';

            return (
              <article
                key={acomp.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                  isPendingSync ? 'border-men-amber' : 'border-slate-200'
                }`}
              >
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-men-navy">
                        {acomp.id}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-men-blue border border-blue-200">
                        {acomp.modalidad}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                        <Calendar className="w-3.5 h-3.5" />
                        {acomp.mes}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-men-navy mt-1">
                      {est?.nombre ?? acomp.estrategiaId}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {ent?.nombre} · Tutor:{' '}
                      <strong>{tutor?.nombreCompleto ?? acomp.tutorId}</strong>
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Docentes:{' '}
                        {acomp.docenteIds
                          .map((id) => docentesById.get(id)?.nombreCompleto ?? id)
                          .join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isPendingSync ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-men-amber text-men-amber text-xs font-bold">
                        <CloudOff className="w-3.5 h-3.5" />
                        <span>Pendiente de sincronización</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-men-emerald text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sincronizado</span>
                      </span>
                    )}
                    <code
                      className="text-[10px] font-mono text-slate-400"
                      title={acomp.idempotencyKey}
                    >
                      Key: {acomp.idempotencyKey.slice(0, 20)}
                    </code>
                  </div>
                </div>

                {/* 4 Weeks Grid */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {acomp.semanas.map((sem) => {
                    const isEditingNoRealizado =
                      activeNoRealizadoKey === sem.id;
                    const semPendingSync =
                      sem.estadoSincronizacion === 'PENDIENTE_SINCRONIZACION';
                    const trimmedLen = motivoDraft.trim().length;

                    return (
                      <div
                        key={sem.id}
                        className="rounded-lg border border-slate-200 p-3 space-y-2.5 bg-slate-50/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-men-navy">
                              Semana {sem.numeroSemana}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Programada: {sem.fechaProgramada}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {sem.estado === 'REALIZADO' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-men-emerald border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                REALIZADO
                              </span>
                            )}
                            {sem.estado === 'PENDIENTE' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-men-amber border border-amber-200">
                                <Clock className="w-3 h-3" />
                                PENDIENTE
                              </span>
                            )}
                            {sem.estado === 'NO_REALIZADO' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-men-red border border-red-200">
                                <XCircle className="w-3 h-3" />
                                NO REALIZADO
                              </span>
                            )}
                            {semPendingSync && (
                              <span className="text-[10px] font-bold text-men-amber">
                                Pendiente de sincronización
                              </span>
                            )}
                          </div>
                        </div>

                        {sem.estado === 'NO_REALIZADO' &&
                          sem.motivoNoRealizado && (
                            <div className="text-[11px] bg-red-50/70 border border-red-100 rounded p-2 text-slate-700">
                              <strong className="text-men-red">Motivo:</strong>{' '}
                              {sem.motivoNoRealizado}
                            </div>
                          )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleMarkRealizado(acomp.id, sem.id)
                            }
                            className="flex-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-men-emerald hover:bg-emerald-700 text-white transition-colors"
                          >
                            Marcar REALIZADO
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveNoRealizadoKey(
                                isEditingNoRealizado ? null : sem.id
                              );
                              setMotivoDraft(sem.motivoNoRealizado ?? '');
                              setWeekError((prev) => ({
                                ...prev,
                                [sem.id]: '',
                              }));
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-white border border-men-red text-men-red hover:bg-red-50 transition-colors"
                          >
                            NO_REALIZADO
                          </button>
                        </div>

                        {isEditingNoRealizado && (
                          <div className="pt-2 border-t border-slate-200 space-y-2">
                            <label className="block text-[11px] font-semibold text-slate-700">
                              Motivo obligatorio (mínimo 10 caracteres útiles):
                            </label>
                            <textarea
                              rows={2}
                              value={motivoDraft}
                              onChange={(e) => setMotivoDraft(e.target.value)}
                              placeholder="Explique la causa de no realización..."
                              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-men-blue focus:outline-none"
                            />
                            <div className="flex items-center justify-between text-[11px]">
                              <span
                                className={
                                  trimmedLen >= 10
                                    ? 'text-men-emerald font-semibold'
                                    : 'text-men-amber font-semibold'
                                }
                              >
                                {trimmedLen} / 10 caracteres útiles
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleSaveNoRealizado(acomp.id, sem.id)
                                }
                                className="px-3 py-1 rounded-md bg-men-red hover:bg-red-700 text-white font-semibold"
                              >
                                Guardar motivo
                              </button>
                            </div>
                          </div>
                        )}

                        {weekError[sem.id] && (
                          <div
                            role="alert"
                            className="text-[11px] text-men-red bg-red-50 border border-red-200 rounded p-2"
                          >
                            {weekError[sem.id]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
};

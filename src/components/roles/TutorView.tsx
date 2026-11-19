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
      <header className="gov-card p-6 space-y-1.5">
        <span className="gov-pill-warning">Perfil 2 · Tutor Territorial</span>
        <h1 className="text-2xl font-bold text-men-navy">
          Acompañamientos Mensuales, Seguimiento Semanal y Modo Offline
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Registre acompañamientos individuales o grupales (4 semanas PENDIENTE
          autogeneradas), reporte el avance semanal y pruebe el control{' '}
          <strong className="text-men-navy">En línea / Sin conexión</strong> en
          la barra superior.
        </p>
      </header>

      {/* Offline Contextual Banner (4px Left Amber Bar) */}
      {state.isOffline && (
        <div
          role="status"
          className="gov-banner-warning flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-[#92400E] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-heading font-bold text-sm text-[#92400E]">
                Modo &quot;Sin conexión&quot; Activo — Cola Local con
                Idempotency-Key
              </div>
              <p className="leading-relaxed">
                Los acompañamientos y avances semanales que guarde ahora se
                almacenarán localmente con insignia{' '}
                <strong>&quot;Pendiente de sincronización&quot;</strong>. Al
                volver a <strong>&quot;En línea&quot;</strong> en el encabezado,
                se sincronizarán automáticamente sin generar duplicados.
              </p>
            </div>
          </div>
          <span className="gov-pill-warning gov-mono shrink-0 font-semibold">
            {state.offlineQueue.length} en cola local
          </span>
        </div>
      )}

      {weekFeedback && (
        <div className="gov-banner-success text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{weekFeedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Create Monthly Accompaniment Form */}
        <section className="lg:col-span-5 gov-card overflow-hidden">
          <div className="px-6 py-4 bg-[#F1F5F9] border-b border-[#E2E8F0] flex items-center gap-2.5">
            <PlusCircle className="w-4 h-4 text-men-navy" />
            <h2 className="text-sm font-bold text-men-navy">
              Registrar Acompañamiento Mensual
            </h2>
          </div>

          <form onSubmit={handleSubmitAcompanamiento} className="p-6 space-y-4">
            <div>
              <label
                htmlFor="aco-estrategia"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Estrategia asociada *
              </label>
              <select
                id="aco-estrategia"
                value={estrategiaId}
                onChange={(e) => setEstrategiaId(e.target.value)}
                className="gov-input"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="aco-tutor"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Tutor *
                </label>
                <select
                  id="aco-tutor"
                  value={tutorId}
                  onChange={(e) => setTutorId(e.target.value)}
                  className="gov-input text-xs"
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
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Mes del acompañamiento *
                </label>
                <input
                  id="aco-mes"
                  type="month"
                  required
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="gov-input gov-mono text-xs"
                />
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Modalidad *
              </span>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setModalidad('INDIVIDUAL')}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
                    modalidad === 'INDIVIDUAL'
                      ? 'bg-men-navy text-white shadow-sm'
                      : 'text-slate-600 hover:text-men-navy'
                  }`}
                >
                  Individual (1 docente)
                </button>
                <button
                  type="button"
                  onClick={() => setModalidad('GRUPAL')}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
                    modalidad === 'GRUPAL'
                      ? 'bg-men-navy text-white shadow-sm'
                      : 'text-slate-600 hover:text-men-navy'
                  }`}
                >
                  Grupal (&gt;= 2 docentes)
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  Docentes de la entidad ({docenteIds.length} seleccionado(s)) *
                </span>
                <span className="text-[11px] text-[#64748B]">
                  {modalidad === 'INDIVIDUAL'
                    ? 'Exactamente 1'
                    : 'Mínimo 2 docentes'}
                </span>
              </div>
              <div className="space-y-2 bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0]">
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
                        className="accent-men-navy"
                      />
                      <span className="font-medium text-men-navy">
                        {doc.nombreCompleto}
                      </span>
                      <span className="text-[#64748B]">· {doc.area}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="aco-obs"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Observaciones de planeación
              </label>
              <textarea
                id="aco-obs"
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Objetivos pedagógicos del acompañamiento mensual..."
                className="gov-input text-xs"
              />
            </div>

            {formError && (
              <div
                role="alert"
                className="gov-banner-danger text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="gov-banner-success text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 ease-in-out disabled:opacity-60 ${
                state.isOffline
                  ? 'bg-[#92400E] hover:bg-amber-900 text-white'
                  : 'gov-btn-primary'
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
        <section className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-men-navy">
              Acompañamientos y Seguimiento Semanal (
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
                className={`gov-card overflow-hidden ${
                  isPendingSync ? 'border-l-4 border-l-[#D97706]' : ''
                }`}
              >
                <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="gov-mono text-xs font-semibold text-men-accent">
                        {acomp.id}
                      </span>
                      <span className="gov-pill-info">{acomp.modalidad}</span>
                      <span className="inline-flex items-center gap-1 gov-mono text-xs text-[#64748B]">
                        <Calendar className="w-3.5 h-3.5" />
                        {acomp.mes}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-men-navy">
                      {est?.nombre ?? acomp.estrategiaId}
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      {ent?.nombre} · Tutor:{' '}
                      <strong className="text-slate-800">
                        {tutor?.nombreCompleto ?? acomp.tutorId}
                      </strong>
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Docentes:{' '}
                        {acomp.docenteIds
                          .map(
                            (id) => docentesById.get(id)?.nombreCompleto ?? id
                          )
                          .join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {isPendingSync ? (
                      <span className="gov-pill-warning">
                        <CloudOff className="w-3.5 h-3.5" />
                        <span>Pendiente de sincronización</span>
                      </span>
                    ) : (
                      <span className="gov-pill-success">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sincronizado</span>
                      </span>
                    )}
                    <code
                      className="gov-mono text-[11px] text-[#64748B]"
                      title={acomp.idempotencyKey}
                    >
                      Key: {acomp.idempotencyKey.slice(0, 20)}
                    </code>
                  </div>
                </div>

                {/* 4 Weeks Grid */}
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {acomp.semanas.map((sem) => {
                    const isEditingNoRealizado =
                      activeNoRealizadoKey === sem.id;
                    const semPendingSync =
                      sem.estadoSincronizacion === 'PENDIENTE_SINCRONIZACION';
                    const trimmedLen = motivoDraft.trim().length;

                    return (
                      <div
                        key={sem.id}
                        className="rounded-xl border border-[#E2E8F0] p-4 space-y-3 bg-white"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-heading text-sm font-bold text-men-navy">
                              Semana {sem.numeroSemana}
                            </div>
                            <div className="gov-mono text-[11px] text-[#64748B] mt-0.5">
                              {sem.fechaProgramada}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {sem.estado === 'REALIZADO' && (
                              <span className="gov-pill-success">
                                <CheckCircle2 className="w-3 h-3" />
                                REALIZADO
                              </span>
                            )}
                            {sem.estado === 'PENDIENTE' && (
                              <span className="gov-pill-warning">
                                <Clock className="w-3 h-3" />
                                PENDIENTE
                              </span>
                            )}
                            {sem.estado === 'NO_REALIZADO' && (
                              <span className="gov-pill-danger">
                                <XCircle className="w-3 h-3" />
                                NO REALIZADO
                              </span>
                            )}
                            {semPendingSync && (
                              <span className="text-[10px] font-semibold text-[#92400E]">
                                Pendiente de sincronización
                              </span>
                            )}
                          </div>
                        </div>

                        {sem.estado === 'NO_REALIZADO' &&
                          sem.motivoNoRealizado && (
                            <div className="gov-banner-danger py-2 px-3 text-[11px]">
                              <strong>Motivo:</strong> {sem.motivoNoRealizado}
                            </div>
                          )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleMarkRealizado(acomp.id, sem.id)
                            }
                            className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] hover:bg-emerald-100 transition-colors duration-150"
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
                            className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] hover:bg-red-100 transition-colors duration-150"
                          >
                            NO_REALIZADO
                          </button>
                        </div>

                        {isEditingNoRealizado && (
                          <div className="pt-3 border-t border-[#E2E8F0] space-y-2.5">
                            <label className="block text-[11px] font-semibold text-slate-700">
                              Motivo obligatorio (mínimo 10 caracteres útiles):
                            </label>
                            <textarea
                              rows={2}
                              value={motivoDraft}
                              onChange={(e) => setMotivoDraft(e.target.value)}
                              placeholder="Explique la causa de no realización..."
                              className="gov-input text-xs"
                            />
                            <div className="flex items-center justify-between text-[11px]">
                              <span
                                className={`gov-mono font-medium ${
                                  trimmedLen >= 10
                                    ? 'text-[#065F46]'
                                    : 'text-[#92400E]'
                                }`}
                              >
                                {trimmedLen} / 10 caracteres útiles
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleSaveNoRealizado(acomp.id, sem.id)
                                }
                                className="px-3 py-1.5 rounded-lg bg-[#991B1B] hover:bg-red-900 text-white font-semibold transition-colors duration-150"
                              >
                                Guardar motivo
                              </button>
                            </div>
                          </div>
                        )}

                        {weekError[sem.id] && (
                          <div
                            role="alert"
                            className="gov-banner-danger py-2 px-3 text-[11px]"
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

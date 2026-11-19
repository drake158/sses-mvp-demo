import React, { useEffect, useMemo, useState } from 'react';
import { CloudOff, Plus } from 'lucide-react';
import { useSses } from '../../context/SsesContext';
import type { ModalidadAcompanamiento } from '../../types/sses';
import { StatusBadge } from '../common/StatusBadge';

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
          ? `En cola offline · ${res.data.id}`
          : `Registrado · ${res.data.id}`
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
        ? `Semana ${res.data.numeroSemana} · Realizado (cola offline)`
        : `Semana ${res.data.numeroSemana} · Realizado`
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
        ? `Semana ${res.data.numeroSemana} · No realizado (cola offline)`
        : `Semana ${res.data.numeroSemana} · No realizado`
    );
  };

  return (
    <div className="space-y-8">
      {/* Minimal Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.025em] text-[#0F172A]">
            Acompañamientos
          </h1>
          <StatusBadge tone="warning">Tutor Territorial</StatusBadge>
        </div>

        {state.isOffline && (
          <StatusBadge
            tone="warning"
            mono
            title="Los registros se almacenan localmente con Idempotency-Key y se sincronizan al volver en línea."
          >
            Cola offline: {state.offlineQueue.length}
          </StatusBadge>
        )}
      </header>

      {state.isOffline && (
        <div role="status" className="sses-notice-warning">
          Modo Offline · Sincronización automática al reconectar.
        </div>
      )}

      {weekFeedback && (
        <div role="status" className="sses-notice-success">
          {weekFeedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Create Form */}
        <section className="lg:col-span-5 sses-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E7EB]">
            <h2 className="text-sm font-medium text-[#0F172A]">
              Nuevo acompañamiento
            </h2>
          </div>

          <form onSubmit={handleSubmitAcompanamiento} className="p-6 space-y-4">
            <div>
              <label
                htmlFor="aco-estrategia"
                className="block text-xs font-medium text-[#64748B] mb-1.5"
              >
                Estrategia
              </label>
              <select
                id="aco-estrategia"
                value={estrategiaId}
                onChange={(e) => setEstrategiaId(e.target.value)}
                className="sses-input"
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
                  className="block text-xs font-medium text-[#64748B] mb-1.5"
                >
                  Tutor
                </label>
                <select
                  id="aco-tutor"
                  value={tutorId}
                  onChange={(e) => setTutorId(e.target.value)}
                  className="sses-input text-xs"
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
                  className="block text-xs font-medium text-[#64748B] mb-1.5"
                >
                  Mes
                </label>
                <input
                  id="aco-mes"
                  type="month"
                  required
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="sses-input sses-mono text-xs"
                />
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#64748B] mb-1.5">
                Modalidad
              </span>
              <div
                role="group"
                aria-label="Modalidad de acompañamiento"
                className="grid grid-cols-2 gap-1 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB] p-1"
              >
                <button
                  type="button"
                  aria-pressed={modalidad === 'INDIVIDUAL'}
                  onClick={() => setModalidad('INDIVIDUAL')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 ${
                    modalidad === 'INDIVIDUAL'
                      ? 'bg-[#1E3A8A] text-white'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Individual
                </button>
                <button
                  type="button"
                  aria-pressed={modalidad === 'GRUPAL'}
                  onClick={() => setModalidad('GRUPAL')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 ${
                    modalidad === 'GRUPAL'
                      ? 'bg-[#1E3A8A] text-white'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Grupal
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#64748B]">
                  Docentes ({docenteIds.length})
                </span>
                <span className="text-[11px] text-[#64748B]">
                  {modalidad === 'INDIVIDUAL' ? '1 docente' : 'Mín. 2'}
                </span>
              </div>
              <div className="space-y-2 bg-[#FAFAFA] p-4 rounded-lg border border-[#E5E7EB]">
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
                        className="accent-[#1E3A8A]"
                      />
                      <span className="font-medium text-[#0F172A]">
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
                className="block text-xs font-medium text-[#64748B] mb-1.5"
              >
                Observaciones
              </label>
              <textarea
                id="aco-obs"
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas breves"
                className="sses-input text-xs"
              />
            </div>

            {formError && (
              <div role="alert" className="sses-notice-danger">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div role="status" className="sses-notice-success">
                {formSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              title="Autogenera 4 semanas en estado PENDIENTE"
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:ring-offset-2 disabled:opacity-50 ${
                state.isOffline
                  ? 'bg-[#D97706] hover:bg-[#B45309]'
                  : 'bg-[#1E3A8A] hover:bg-[#172E6E]'
              }`}
            >
              {state.isOffline ? (
                <CloudOff className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Plus className="h-4 w-4" strokeWidth={1.5} />
              )}
              <span>
                {isSaving
                  ? 'Guardando...'
                  : state.isOffline
                  ? 'Guardar en cola'
                  : 'Registrar'}
              </span>
            </button>
          </form>
        </section>

        {/* Right: Accompaniments List */}
        <section className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#0F172A]">
              Seguimiento semanal
            </h2>
            <span className="sses-mono text-xs text-[#64748B]">
              {state.acompanamientos.length}
            </span>
          </div>

          {state.acompanamientos.map((acomp) => {
            const est = estrategiasById.get(acomp.estrategiaId);
            const ent = est ? entidadesById.get(est.entidadId) : undefined;
            const tutor = tutoresById.get(acomp.tutorId);
            const isPendingSync =
              acomp.estadoSincronizacion === 'PENDIENTE_SINCRONIZACION';

            return (
              <article key={acomp.id} className="sses-card overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E5E7EB] flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="sses-mono text-xs text-[#0284C7]">
                        {acomp.id}
                      </span>
                      <span className="sses-mono text-xs text-[#64748B]">
                        {acomp.mes}
                      </span>
                      <StatusBadge tone="neutral">
                        {acomp.modalidad === 'INDIVIDUAL'
                          ? 'Individual'
                          : 'Grupal'}
                      </StatusBadge>
                    </div>
                    <h3 className="text-sm font-medium text-[#0F172A]">
                      {est?.nombre ?? acomp.estrategiaId}
                    </h3>
                    <div className="text-xs text-[#64748B]">
                      {ent?.nombre} · {tutor?.nombreCompleto ?? acomp.tutorId} ·{' '}
                      {acomp.docenteIds
                        .map((id) => docentesById.get(id)?.nombreCompleto ?? id)
                        .join(', ')}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge tone={isPendingSync ? 'warning' : 'success'}>
                      {isPendingSync ? 'Pendiente sync' : 'Sincronizado'}
                    </StatusBadge>
                    <code
                      className="sses-mono text-[11px] text-[#64748B]"
                      title={`Idempotency-Key: ${acomp.idempotencyKey}`}
                    >
                      {acomp.idempotencyKey.slice(0, 16)}…
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
                        className="rounded-lg border border-[#E5E7EB] p-4 space-y-3 bg-white"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium text-[#0F172A]">
                              Semana {sem.numeroSemana}
                            </div>
                            <div className="sses-mono text-[11px] text-[#64748B]">
                              {sem.fechaProgramada}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {sem.estado === 'REALIZADO' && (
                              <StatusBadge tone="success">Realizado</StatusBadge>
                            )}
                            {sem.estado === 'PENDIENTE' && (
                              <StatusBadge tone="warning">Pendiente</StatusBadge>
                            )}
                            {sem.estado === 'NO_REALIZADO' && (
                              <StatusBadge tone="danger">
                                No realizado
                              </StatusBadge>
                            )}
                            {semPendingSync && (
                              <span className="text-[10px] text-[#92400E]">
                                Pendiente sync
                              </span>
                            )}
                          </div>
                        </div>

                        {sem.estado === 'NO_REALIZADO' &&
                          sem.motivoNoRealizado && (
                            <p className="text-xs text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-md px-2.5 py-1.5">
                              {sem.motivoNoRealizado}
                            </p>
                          )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleMarkRealizado(acomp.id, sem.id)
                            }
                            aria-label={`Marcar semana ${sem.numeroSemana} como realizada`}
                            className="flex-1 rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0F172A] hover:border-[#059669] hover:text-[#059669] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
                          >
                            Realizado
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
                            aria-label={`Marcar semana ${sem.numeroSemana} como no realizada`}
                            className="flex-1 rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs font-medium text-[#64748B] hover:border-[#DC2626] hover:text-[#DC2626] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
                          >
                            No realizado
                          </button>
                        </div>

                        {isEditingNoRealizado && (
                          <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
                            <textarea
                              rows={2}
                              aria-label="Motivo de no realización"
                              value={motivoDraft}
                              onChange={(e) => setMotivoDraft(e.target.value)}
                              placeholder="Motivo (mín. 10 caracteres)"
                              className="sses-input text-xs"
                            />
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className={`sses-mono ${
                                  trimmedLen >= 10
                                    ? 'text-[#059669]'
                                    : 'text-[#64748B]'
                                }`}
                              >
                                {trimmedLen}/10
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleSaveNoRealizado(acomp.id, sem.id)
                                }
                                className="rounded-md bg-[#DC2626] px-3 py-1 text-xs font-medium text-white hover:bg-[#B91C1C] transition-colors"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        )}

                        {weekError[sem.id] && (
                          <div
                            role="alert"
                            className="sses-notice-danger py-2 px-3"
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

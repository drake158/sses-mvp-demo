import React, { useMemo, useState } from 'react';
import {
  Download,
  Edit3,
  Info,
  Lock,
  Plus,
  Search,
  UserPlus,
  X,
} from 'lucide-react';
import { useSses } from '../../context/SsesContext';
import type { BulkLinkResult, Estrategia } from '../../types/sses';
import {
  calcularKpisCumplimiento,
  parsearDocumentosMasivos,
  puedeEditarEstrategia,
} from '../../utils/businessRules';
import { KpiDashboard } from '../common/KpiDashboard';
import { ReportReceiptCard } from '../common/ReportReceiptCard';
import { StatusBadge } from '../common/StatusBadge';

export const FuncionarioMenView: React.FC = () => {
  const {
    state,
    crearEstrategia,
    editarEstrategia,
    vincularEstudiantes,
    generarYDescargarReporteCsv,
  } = useSses();

  const kpis = useMemo(
    () => calcularKpisCumplimiento(state.estrategias, state.acompanamientos),
    [state.estrategias, state.acompanamientos]
  );

  const constanciasMen = useMemo(
    () =>
      state.constanciasReportes.filter(
        (c) => c.rolGenerador === 'FUNCIONARIO_MEN'
      ),
    [state.constanciasReportes]
  );

  const entidadesById = useMemo(
    () => new Map(state.entidades.map((e) => [e.id, e])),
    [state.entidades]
  );

  const estudiantesById = useMemo(
    () => new Map(state.estudiantes.map((s) => [s.id, s])),
    [state.estudiantes]
  );

  const firstActiveEntidadId =
    state.entidades.find((e) => e.estado === 'ACTIVA')?.id ?? '';

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [entidadId, setEntidadId] = useState(firstActiveEntidadId);
  const [fechaInicio, setFechaInicio] = useState('2026-11-20');
  const [fechaFin, setFechaFin] = useState('2027-03-30');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(
    state.estrategias[0]?.id ?? ''
  );

  const selectedStrategy: Estrategia | undefined = useMemo(
    () =>
      state.estrategias.find((e) => e.id === selectedStrategyId) ??
      state.estrategias[0],
    [state.estrategias, selectedStrategyId]
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editEntidadId, setEditEntidadId] = useState('');
  const [editFechaInicio, setEditFechaInicio] = useState('');
  const [editFechaFin, setEditFechaFin] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  const [linkTab, setLinkTab] = useState<'INDIVIDUAL' | 'MASIVA'>('INDIVIDUAL');
  const [studentQuery, setStudentQuery] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [lastLinkResult, setLastLinkResult] = useState<BulkLinkResult | null>(
    null
  );
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const startEdit = (est: Estrategia) => {
    setEditError(null);
    setEditSuccess(null);
    if (!puedeEditarEstrategia(est)) {
      return;
    }
    setEditingId(est.id);
    setEditNombre(est.nombre);
    setEditDescripcion(est.descripcion);
    setEditEntidadId(est.entidadId);
    setEditFechaInicio(est.fechaInicio);
    setEditFechaFin(est.fechaFin);
  };

  const handleCreateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setIsCreating(true);
    try {
      const targetEntidad = entidadId || firstActiveEntidadId;
      const res = await crearEstrategia({
        nombre,
        descripcion,
        entidadId: targetEntidad,
        fechaInicio,
        fechaFin,
      });

      if (!res.ok) {
        setCreateError(res.errors?.join(' ') ?? res.error);
        return;
      }

      setNombre('');
      setDescripcion('');
      setSelectedStrategyId(res.data.id);
      setLastLinkResult(null);
      setCreateSuccess(`Creada · ${res.data.id}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setEditError(null);
    setEditSuccess(null);

    const res = await editarEstrategia(editingId, {
      nombre: editNombre,
      descripcion: editDescripcion,
      entidadId: editEntidadId,
      fechaInicio: editFechaInicio,
      fechaFin: editFechaFin,
    });

    if (!res.ok) {
      setEditError(res.error);
      return;
    }

    setEditingId(null);
    setEditSuccess(`Actualizada · ${res.data.id}`);
  };

  const handleLinkSingle = async (numeroDocumento: string) => {
    if (!selectedStrategy) return;
    setLinkError(null);
    setIsLinking(true);
    try {
      const res = await vincularEstudiantes(selectedStrategy.id, [
        numeroDocumento,
      ]);
      if (!res.ok) {
        setLinkError(res.error);
        return;
      }
      setLastLinkResult(res.data);
      if (editingId === selectedStrategy.id) {
        setEditingId(null);
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStrategy) return;
    setLinkError(null);

    const docs = parsearDocumentosMasivos(bulkText);
    if (docs.length === 0) {
      setLinkError('Ingrese al menos un documento.');
      return;
    }

    setIsLinking(true);
    try {
      const res = await vincularEstudiantes(selectedStrategy.id, docs);
      if (!res.ok) {
        setLinkError(res.error);
        return;
      }
      setLastLinkResult(res.data);
      setBulkText('');
      if (
        editingId === selectedStrategy.id &&
        res.data.estrategiaActualizada.estado === 'CON_ESTUDIANTES'
      ) {
        setEditingId(null);
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleDownloadCsv = async () => {
    setIsExporting(true);
    try {
      await generarYDescargarReporteCsv('FUNCIONARIO_MEN');
    } finally {
      setIsExporting(false);
    }
  };

  const availableStudentsForSelected = useMemo(() => {
    if (!selectedStrategy) return [];
    const linkedSet = new Set(selectedStrategy.estudianteIds);
    const q = studentQuery.trim().toLowerCase();

    return state.estudiantes.filter((est) => {
      if (est.entidadId !== selectedStrategy.entidadId) return false;
      if (linkedSet.has(est.id)) return false;
      if (!q) return true;
      return (
        est.nombreCompleto.toLowerCase().includes(q) ||
        est.numeroDocumento.includes(q)
      );
    });
  }, [selectedStrategy, state.estudiantes, studentQuery]);

  const sampleEntityDocs = useMemo(() => {
    if (!selectedStrategy) return '';
    return state.estudiantes
      .filter((s) => s.entidadId === selectedStrategy.entidadId)
      .map((s) => s.numeroDocumento)
      .join(', ');
  }, [selectedStrategy, state.estudiantes]);

  return (
    <div className="space-y-8">
      {/* Minimal Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.025em] text-ink">
            Estrategias
          </h1>
          <StatusBadge tone="info">Funcionario MEN</StatusBadge>
        </div>

        <button
          type="button"
          onClick={handleDownloadCsv}
          disabled={isExporting}
          aria-label="Descargar reporte CSV con constancia SHA-256"
          title="Exportar reporte CSV con huella SHA-256"
          className="sses-btn-primary"
        >
          <Download className="h-4 w-4" strokeWidth={1.5} />
          <span>{isExporting ? 'Generando...' : 'Exportar CSV'}</span>
        </button>
      </header>

      <KpiDashboard kpis={kpis} />
      <ReportReceiptCard constancias={constanciasMen} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Create Strategy Form */}
        <section className="lg:col-span-5 sses-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle">
            <h2 className="text-sm font-medium text-ink">Nueva estrategia</h2>
          </div>

          <form onSubmit={handleCreateStrategy} className="p-6 space-y-4">
            <div>
              <label
                htmlFor="str-nombre"
                className="block text-xs font-medium text-ink-secondary mb-1.5"
              >
                Nombre
              </label>
              <input
                id="str-nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Plan de nivelación"
                className="sses-input"
              />
            </div>

            <div>
              <label
                htmlFor="str-descripcion"
                className="block text-xs font-medium text-ink-secondary mb-1.5"
              >
                Descripción
              </label>
              <textarea
                id="str-descripcion"
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Alcance pedagógico"
                className="sses-input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="str-entidad"
                  className="text-xs font-medium text-ink-secondary"
                >
                  Entidad educativa
                </label>
                <span
                  title="Regla FR-006: Solo se permiten entidades en estado ACTIVA."
                  className="inline-flex items-center gap-1 text-[11px] text-ink-secondary cursor-help"
                >
                  <Info className="h-3 w-3" strokeWidth={1.5} />
                  <span>Solo activas</span>
                </span>
              </div>
              <select
                id="str-entidad"
                value={entidadId}
                onChange={(e) => setEntidadId(e.target.value)}
                className="sses-input"
              >
                {state.entidades.map((ent) => (
                  <option
                    key={ent.id}
                    value={ent.id}
                    disabled={ent.estado !== 'ACTIVA'}
                  >
                    {ent.nombre} · {ent.municipio}
                    {ent.estado !== 'ACTIVA' ? ' (Inactiva)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="str-inicio"
                  className="block text-xs font-medium text-ink-secondary mb-1.5"
                >
                  Inicio
                </label>
                <input
                  id="str-inicio"
                  type="date"
                  required
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="sses-input sses-mono text-xs"
                />
              </div>
              <div>
                <label
                  htmlFor="str-fin"
                  className="block text-xs font-medium text-ink-secondary mb-1.5"
                >
                  Fin
                </label>
                <input
                  id="str-fin"
                  type="date"
                  required
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="sses-input sses-mono text-xs"
                />
              </div>
            </div>

            {createError && (
              <div role="alert" className="sses-notice-danger">
                {createError}
              </div>
            )}

            {createSuccess && (
              <div role="status" className="sses-notice-success">
                {createSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={isCreating}
              className="sses-btn-primary w-full"
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              <span>{isCreating ? 'Guardando...' : 'Crear estrategia'}</span>
            </button>
          </form>
        </section>

        {/* Right: Strategies List + Detail & Linking */}
        <section className="lg:col-span-7 space-y-6">
          <div className="sses-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-ink">Registradas</h2>
              <span className="sses-mono text-xs text-ink-secondary">
                {state.estrategias.length}
              </span>
            </div>

            <div className="divide-y divide-border-subtle">
              {state.estrategias.map((est) => {
                const ent = entidadesById.get(est.entidadId);
                const isSelected = selectedStrategy?.id === est.id;
                const editable = puedeEditarEstrategia(est);

                return (
                  <button
                    key={est.id}
                    type="button"
                    onClick={() => {
                      setSelectedStrategyId(est.id);
                      setLastLinkResult(null);
                      setLinkError(null);
                      setEditSuccess(null);
                      setEditError(null);
                      if (editingId && editingId !== est.id) {
                        setEditingId(null);
                      }
                    }}
                    aria-pressed={isSelected}
                    className={`w-full text-left px-6 py-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent ${
                      isSelected
                        ? 'bg-brand-soft border-l-2 border-l-brand-primary'
                        : 'hover:bg-surface-hover border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="sses-mono text-xs text-brand-accent">
                            {est.id}
                          </span>
                          <span className="text-sm font-medium text-ink truncate">
                            {est.nombre}
                          </span>
                        </div>
                        <div className="text-xs text-ink-secondary">
                          {ent?.nombre ?? est.entidadId} ·{' '}
                          <span className="sses-mono">
                            {est.fechaInicio} → {est.fechaFin}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge
                          tone={editable ? 'info' : 'danger'}
                          title={
                            editable
                              ? 'SIN_ESTUDIANTES: Editable'
                              : 'CON_ESTUDIANTES: Edición bloqueada'
                          }
                        >
                          {editable ? 'Editable' : 'Bloqueada'}
                        </StatusBadge>
                        <span
                          title="Estudiantes vinculados"
                          className="sses-mono text-xs text-ink-secondary min-w-[2.5rem] text-right"
                        >
                          {est.estudianteIds.length} est.
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedStrategy && (
            <div className="sses-card p-6 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-border-subtle">
                <div className="space-y-1 min-w-0">
                  <div className="sses-mono text-xs text-ink-secondary">
                    {selectedStrategy.id} ·{' '}
                    {entidadesById.get(selectedStrategy.entidadId)?.nombre}
                  </div>
                  <h3 className="text-base font-medium text-ink">
                    {selectedStrategy.nombre}
                  </h3>
                  {selectedStrategy.descripcion && (
                    <p className="text-xs text-ink-secondary">
                      {selectedStrategy.descripcion}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!puedeEditarEstrategia(selectedStrategy)}
                  onClick={() => startEdit(selectedStrategy)}
                  aria-label={
                    puedeEditarEstrategia(selectedStrategy)
                      ? 'Editar estrategia'
                      : 'Edición bloqueada por inmutabilidad'
                  }
                  title={
                    puedeEditarEstrategia(selectedStrategy)
                      ? 'Editar datos base'
                      : 'Inmutable: cuenta con estudiantes vinculados'
                  }
                  className="sses-btn-secondary text-xs shrink-0"
                >
                  {puedeEditarEstrategia(selectedStrategy) ? (
                    <>
                      <Edit3 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>Editar</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>Bloqueada</span>
                    </>
                  )}
                </button>
              </div>

              {!puedeEditarEstrategia(selectedStrategy) && (
                <div
                  role="status"
                  title="Por normativa SSES, al vincular estudiantes la edición de datos base queda bloqueada permanentemente."
                  className="sses-notice-danger flex items-center gap-2"
                >
                  <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                  <span>
                    Inmutable ({selectedStrategy.estado}) ·{' '}
                    <span className="sses-mono">
                      {selectedStrategy.estudianteIds.length}
                    </span>{' '}
                    vinculados
                  </span>
                </div>
              )}

              {editSuccess && (
                <div role="status" className="sses-notice-success">
                  {editSuccess}
                </div>
              )}

              {editingId === selectedStrategy.id &&
                puedeEditarEstrategia(selectedStrategy) && (
                  <form
                    onSubmit={handleSaveEdit}
                    className="p-4 rounded-xl bg-elevated border border-border-subtle space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-ink">
                        Editar · {selectedStrategy.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        aria-label="Cerrar edición"
                        className="text-ink-secondary hover:text-ink rounded"
                      >
                        <X className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink-secondary mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        required
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        className="sses-input"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink-secondary mb-1">
                        Descripción
                      </label>
                      <textarea
                        rows={2}
                        value={editDescripcion}
                        onChange={(e) => setEditDescripcion(e.target.value)}
                        className="sses-input"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-ink-secondary mb-1">
                          Entidad
                        </label>
                        <select
                          value={editEntidadId}
                          onChange={(e) => setEditEntidadId(e.target.value)}
                          className="sses-input text-xs"
                        >
                          {state.entidades.map((ent) => (
                            <option
                              key={ent.id}
                              value={ent.id}
                              disabled={ent.estado !== 'ACTIVA'}
                            >
                              {ent.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-secondary mb-1">
                          Inicio
                        </label>
                        <input
                          type="date"
                          required
                          value={editFechaInicio}
                          onChange={(e) => setEditFechaInicio(e.target.value)}
                          className="sses-input sses-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-secondary mb-1">
                          Fin
                        </label>
                        <input
                          type="date"
                          required
                          value={editFechaFin}
                          onChange={(e) => setEditFechaFin(e.target.value)}
                          className="sses-input sses-mono text-xs"
                        />
                      </div>
                    </div>

                    {editError && (
                      <div role="alert" className="sses-notice-danger">
                        {editError}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="sses-btn-secondary text-xs"
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="sses-btn-primary text-xs">
                        Guardar
                      </button>
                    </div>
                  </form>
                )}

              {/* Linked Students */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-secondary">
                    Estudiantes vinculados
                  </span>
                  <span className="sses-mono text-xs text-ink-secondary">
                    {selectedStrategy.estudianteIds.length}
                  </span>
                </div>

                {selectedStrategy.estudianteIds.length === 0 ? (
                  <div className="text-xs text-ink-secondary bg-elevated px-4 py-3 rounded-lg border border-border-subtle">
                    Sin estudiantes vinculados
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedStrategy.estudianteIds.map((id) => {
                      const est = estudiantesById.get(id);
                      if (!est) return null;
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-elevated border border-border-subtle text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-ink truncate">
                              {est.nombreCompleto}
                            </div>
                            <div className="sses-mono text-ink-secondary text-[11px]">
                              {est.tipoDocumento} {est.numeroDocumento} ·{' '}
                              {est.grado}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Linking Panel */}
              <div className="border-t border-border-subtle pt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium text-ink">
                    Vincular estudiantes
                  </span>
                  <div
                    role="tablist"
                    aria-label="Modo de vinculación"
                    className="inline-flex rounded-lg bg-elevated border border-border-subtle p-0.5 text-xs"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={linkTab === 'INDIVIDUAL'}
                      onClick={() => setLinkTab('INDIVIDUAL')}
                      className={`px-3 py-1 rounded-md font-medium transition-colors duration-150 ${
                        linkTab === 'INDIVIDUAL'
                          ? 'bg-brand-primary text-[var(--brand-primary-text)]'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      Individual
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={linkTab === 'MASIVA'}
                      onClick={() => setLinkTab('MASIVA')}
                      className={`px-3 py-1 rounded-md font-medium transition-colors duration-150 ${
                        linkTab === 'MASIVA'
                          ? 'bg-brand-primary text-[var(--brand-primary-text)]'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      Masiva
                    </button>
                  </div>
                </div>

                {linkTab === 'INDIVIDUAL' ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search
                        aria-hidden="true"
                        className="h-3.5 w-3.5 text-ink-secondary absolute left-3 top-2.5"
                        strokeWidth={1.5}
                      />
                      <input
                        type="text"
                        aria-label="Buscar estudiante"
                        value={studentQuery}
                        onChange={(e) => setStudentQuery(e.target.value)}
                        placeholder="Buscar nombre o documento"
                        className="sses-input pl-9 text-xs"
                      />
                    </div>

                    {availableStudentsForSelected.length === 0 ? (
                      <div className="text-xs text-ink-secondary px-4 py-3 bg-elevated border border-border-subtle rounded-lg">
                        Sin estudiantes disponibles
                      </div>
                    ) : (
                      <div className="divide-y divide-border-subtle border border-border-subtle rounded-lg max-h-56 overflow-y-auto">
                        {availableStudentsForSelected.map((est) => (
                          <div
                            key={est.id}
                            className="flex items-center justify-between gap-3 px-4 py-2.5 bg-surface hover:bg-surface-hover transition-colors text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-ink truncate">
                                {est.nombreCompleto}
                              </div>
                              <div className="sses-mono text-ink-secondary text-[11px]">
                                {est.tipoDocumento} {est.numeroDocumento} ·{' '}
                                {est.grado}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={isLinking}
                              onClick={() =>
                                handleLinkSingle(est.numeroDocumento)
                              }
                              aria-label={`Vincular a ${est.nombreCompleto}`}
                              className="sses-btn-secondary px-2.5 py-1 text-xs shrink-0"
                            >
                              Vincular
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleLinkBulk} className="space-y-3">
                    {sampleEntityDocs && (
                      <div className="text-xs text-ink-secondary flex flex-wrap items-center gap-1.5">
                        <span>Disponibles:</span>
                        <code className="sses-mono text-[11px] text-ink bg-elevated border border-border-subtle px-2 py-0.5 rounded">
                          {sampleEntityDocs}
                        </code>
                      </div>
                    )}
                    <textarea
                      rows={3}
                      aria-label="Documentos para carga masiva"
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="1144087311, 1144087312"
                      className="sses-input sses-mono text-xs"
                    />
                    <button
                      type="submit"
                      disabled={isLinking}
                      className="sses-btn-primary text-xs"
                    >
                      <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>
                        {isLinking ? 'Procesando...' : 'Vincular lista'}
                      </span>
                    </button>
                  </form>
                )}

                {linkError && (
                  <div role="alert" className="sses-notice-danger">
                    {linkError}
                  </div>
                )}

                {lastLinkResult && (
                  <div className="p-4 rounded-lg bg-elevated border border-border-subtle text-xs space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-2.5 rounded-lg bg-surface border border-border-subtle">
                        <div className="sses-kpi-value text-lg text-status-emerald">
                          {lastLinkResult.vinculados.length}
                        </div>
                        <div className="text-ink-secondary">Vinculados</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface border border-border-subtle">
                        <div className="sses-kpi-value text-lg text-ink">
                          {lastLinkResult.yaVinculados.length}
                        </div>
                        <div className="text-ink-secondary">Duplicados</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface border border-border-subtle">
                        <div className="sses-kpi-value text-lg text-status-danger">
                          {lastLinkResult.otraEntidad.length}
                        </div>
                        <div className="text-ink-secondary">Otra entidad</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface border border-border-subtle">
                        <div className="sses-kpi-value text-lg text-status-amber">
                          {lastLinkResult.noEncontrados.length}
                        </div>
                        <div className="text-ink-secondary">No hallados</div>
                      </div>
                    </div>

                    {lastLinkResult.otraEntidad.length > 0 && (
                      <div className="text-[var(--badge-danger-text)]">
                        Otra entidad:{' '}
                        <span className="sses-mono">
                          {lastLinkResult.otraEntidad.join(', ')}
                        </span>
                      </div>
                    )}
                    {lastLinkResult.yaVinculados.length > 0 && (
                      <div className="text-ink-secondary">
                        Omitidos:{' '}
                        <span className="sses-mono">
                          {lastLinkResult.yaVinculados.join(', ')}
                        </span>
                      </div>
                    )}
                    {lastLinkResult.noEncontrados.length > 0 && (
                      <div className="text-[var(--badge-warning-text)]">
                        No hallados:{' '}
                        <span className="sses-mono">
                          {lastLinkResult.noEncontrados.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

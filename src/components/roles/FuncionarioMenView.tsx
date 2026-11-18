import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Edit3,
  Lock,
  PlusCircle,
  Search,
  UserPlus,
  Users,
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

  // Create strategy form state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [entidadId, setEntidadId] = useState(firstActiveEntidadId);
  const [fechaInicio, setFechaInicio] = useState('2026-11-20');
  const [fechaFin, setFechaFin] = useState('2027-03-30');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Selected strategy for detail / edit / linking
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(
    state.estrategias[0]?.id ?? ''
  );

  const selectedStrategy: Estrategia | undefined = useMemo(
    () =>
      state.estrategias.find((e) => e.id === selectedStrategyId) ??
      state.estrategias[0],
    [state.estrategias, selectedStrategyId]
  );

  // Edit form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editEntidadId, setEditEntidadId] = useState('');
  const [editFechaInicio, setEditFechaInicio] = useState('');
  const [editFechaFin, setEditFechaFin] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Student linking state
  const [linkTab, setLinkTab] = useState<'INDIVIDUAL' | 'MASIVA'>('INDIVIDUAL');
  const [studentQuery, setStudentQuery] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [lastLinkResult, setLastLinkResult] = useState<BulkLinkResult | null>(
    null
  );
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // CSV export loading
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
      setCreateSuccess(
        `Estrategia ${res.data.id} creada en estado SIN_ESTUDIANTES y registrada en auditoría.`
      );
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
    setEditSuccess(
      `Estrategia ${res.data.id} actualizada exitosamente y auditada.`
    );
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
      setLinkError(
        'Pegue al menos un número de documento separado por saltos de línea, comas o punto y coma.'
      );
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
      {/* Header + CSV Download */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-men-blue">
            Perfil 1 · Funcionario MEN
          </span>
          <h1 className="text-2xl font-bold text-men-navy mt-0.5">
            Gestión de Estrategias Estudiantiles y Tablero de Cumplimiento
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Cree estrategias en entidades educativas activas, administre la
            vinculación de estudiantes con regla de inmutabilidad y descargue
            reportes CSV con constancia SHA-256.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadCsv}
          disabled={isExporting}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-men-blue hover:bg-[#0052A3] text-white text-sm font-semibold shadow-sm transition-colors shrink-0 disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          <span>
            {isExporting
              ? 'Generando CSV...'
              : 'Descargar Reporte CSV (SHA-256)'}
          </span>
        </button>
      </div>

      {/* KPIs + Alerts + Latest Receipt */}
      <KpiDashboard kpis={kpis} />
      <ReportReceiptCard constancias={constanciasMen} />

      {/* Create Strategy + Strategies List & Linking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Create Strategy Form */}
        <section className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-men-navy text-white flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-sky-300" />
            <h2 className="text-sm font-bold">Crear Nueva Estrategia</h2>
          </div>

          <form onSubmit={handleCreateStrategy} className="p-5 space-y-4">
            <div>
              <label
                htmlFor="str-nombre"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Nombre de la estrategia *
              </label>
              <input
                id="str-nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Plan de Nivelación en Ciencias Básicas"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-men-blue focus:outline-none focus:ring-1 focus:ring-men-blue"
              />
            </div>

            <div>
              <label
                htmlFor="str-descripcion"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Descripción / Alcance pedagógico
              </label>
              <textarea
                id="str-descripcion"
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Objetivo de la estrategia en la institución educativa..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-men-blue focus:outline-none focus:ring-1 focus:ring-men-blue"
              />
            </div>

            <div>
              <label
                htmlFor="str-entidad"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Entidad Educativa (solo estado ACTIVA) *
              </label>
              <select
                id="str-entidad"
                value={entidadId}
                onChange={(e) => setEntidadId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-men-blue focus:outline-none focus:ring-1 focus:ring-men-blue"
              >
                {state.entidades.map((ent) => (
                  <option
                    key={ent.id}
                    value={ent.id}
                    disabled={ent.estado !== 'ACTIVA'}
                  >
                    {ent.nombre} ({ent.municipio}) —{' '}
                    {ent.estado === 'ACTIVA'
                      ? 'ACTIVA'
                      : 'INACTIVA (No seleccionable)'}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Regla FR-006: Las entidades inactivas (ej. Tunja) están
                bloqueadas para nuevas estrategias.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="str-inicio"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Fecha de inicio *
                </label>
                <input
                  id="str-inicio"
                  type="date"
                  required
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-men-blue focus:outline-none focus:ring-1 focus:ring-men-blue"
                />
              </div>
              <div>
                <label
                  htmlFor="str-fin"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Fecha de fin *
                </label>
                <input
                  id="str-fin"
                  type="date"
                  required
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-men-blue focus:outline-none focus:ring-1 focus:ring-men-blue"
                />
              </div>
            </div>

            {createError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-men-red text-men-red text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{createError}</span>
              </div>
            )}

            {createSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-men-emerald text-men-emerald text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{createSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isCreating}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-men-blue hover:bg-[#0052A3] text-white font-semibold text-sm transition-colors disabled:opacity-60"
            >
              <PlusCircle className="w-4 h-4" />
              <span>
                {isCreating
                  ? 'Guardando estrategia...'
                  : 'Crear Estrategia (SIN_ESTUDIANTES)'}
              </span>
            </button>
          </form>
        </section>

        {/* Right column: Strategies list + Edit + Student Linking */}
        <section className="lg:col-span-7 space-y-5">
          {/* Strategies selector cards */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-men-navy">
                Estrategias Registradas ({state.estrategias.length})
              </h2>
              <span className="text-xs text-slate-500">
                Seleccione una estrategia para editar o vincular estudiantes
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {state.estrategias.map((est) => {
                const ent = entidadesById.get(est.entidadId);
                const isSelected = selectedStrategy?.id === est.id;
                const editable = puedeEditarEstrategia(est);

                return (
                  <div
                    key={est.id}
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
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/60 border-l-4 border-l-men-blue'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-men-navy">
                            {est.id}
                          </span>
                          <h3 className="text-sm font-bold text-men-navy">
                            {est.nombre}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {ent?.nombre ?? est.entidadId} · {ent?.municipio} ·{' '}
                          {est.fechaInicio} → {est.fechaFin}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                            editable
                              ? 'bg-blue-50 text-men-blue border-blue-200'
                              : 'bg-emerald-50 text-men-emerald border-emerald-200'
                          }`}
                        >
                          {!editable && <Lock className="w-3 h-3" />}
                          <span>{est.estado}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-full">
                          <Users className="w-3.5 h-3.5 text-men-navy" />
                          {est.estudianteIds.length}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Strategy Detail, Immutability Banner, Edit Form & Linking Panel */}
          {selectedStrategy && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    {selectedStrategy.id} ·{' '}
                    {entidadesById.get(selectedStrategy.entidadId)?.nombre}
                  </div>
                  <h3 className="text-lg font-bold text-men-navy">
                    {selectedStrategy.nombre}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {selectedStrategy.descripcion || 'Sin descripción registrada.'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!puedeEditarEstrategia(selectedStrategy)}
                  onClick={() => startEdit(selectedStrategy)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    puedeEditarEstrategia(selectedStrategy)
                      ? 'bg-white text-men-blue border-men-blue hover:bg-blue-50'
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  {puedeEditarEstrategia(selectedStrategy) ? (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar datos base</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Edición bloqueada</span>
                    </>
                  )}
                </button>
              </div>

              {/* Immutability Explanatory Banner when CON_ESTUDIANTES (FR-011) */}
              {!puedeEditarEstrategia(selectedStrategy) && (
                <div
                  role="status"
                  className="p-4 rounded-lg bg-red-50 border border-men-red text-men-red flex items-start gap-3"
                >
                  <Lock className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-sm">
                      Regla de Inmutabilidad Activa — Estado CON_ESTUDIANTES
                    </div>
                    <p>
                      Esta estrategia cuenta con{' '}
                      <strong>
                        {selectedStrategy.estudianteIds.length} estudiante(s)
                        vinculado(s)
                      </strong>
                      . Por normativa del SSES, la edición de los datos base
                      (nombre, descripción, entidad educativa y fechas) ha
                      quedado <strong>bloqueada permanentemente</strong>. Puede
                      continuar vinculando estudiantes adicionales de la misma
                      entidad educativa.
                    </p>
                  </div>
                </div>
              )}

              {editSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-men-emerald text-men-emerald text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{editSuccess}</span>
                </div>
              )}

              {/* Inline Edit Form (only while SIN_ESTUDIANTES) */}
              {editingId === selectedStrategy.id &&
                puedeEditarEstrategia(selectedStrategy) && (
                  <form
                    onSubmit={handleSaveEdit}
                    className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-men-navy">
                        Editar Estrategia ({selectedStrategy.id})
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        required
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Descripción
                      </label>
                      <textarea
                        rows={2}
                        value={editDescripcion}
                        onChange={(e) => setEditDescripcion(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Entidad (ACTIVA)
                        </label>
                        <select
                          value={editEntidadId}
                          onChange={(e) => setEditEntidadId(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                        >
                          {state.entidades.map((ent) => (
                            <option
                              key={ent.id}
                              value={ent.id}
                              disabled={ent.estado !== 'ACTIVA'}
                            >
                              {ent.nombre} ({ent.estado})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Fecha inicio
                        </label>
                        <input
                          type="date"
                          required
                          value={editFechaInicio}
                          onChange={(e) => setEditFechaInicio(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Fecha fin
                        </label>
                        <input
                          type="date"
                          required
                          value={editFechaFin}
                          onChange={(e) => setEditFechaFin(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                        />
                      </div>
                    </div>

                    {editError && (
                      <div className="p-2.5 rounded-lg bg-red-50 border border-men-red text-men-red text-xs">
                        {editError}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-men-blue text-white hover:bg-[#0052A3]"
                      >
                        Guardar cambios
                      </button>
                    </div>
                  </form>
                )}

              {/* Currently Linked Students */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Estudiantes Vinculados ({selectedStrategy.estudianteIds.length})
                </h4>
                {selectedStrategy.estudianteIds.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    No hay estudiantes vinculados todavía. Vincule al menos 1
                    estudiante de esta entidad para activar el estado{' '}
                    <code>CON_ESTUDIANTES</code>.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedStrategy.estudianteIds.map((id) => {
                      const est = estudiantesById.get(id);
                      if (!est) return null;
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-men-navy">
                              {est.nombreCompleto}
                            </div>
                            <div className="text-slate-500 font-mono">
                              {est.tipoDocumento} {est.numeroDocumento} · Grado{' '}
                              {est.grado}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-men-emerald border border-emerald-200">
                            Vinculado
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Student Linking Panel: Individual & Bulk Tabs */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-men-navy">
                    <UserPlus className="w-4 h-4 text-men-blue" />
                    <span>Vincular Estudiantes (Misma Entidad)</span>
                  </div>
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setLinkTab('INDIVIDUAL')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        linkTab === 'INDIVIDUAL'
                          ? 'bg-men-blue text-white'
                          : 'text-slate-600 hover:text-men-navy'
                      }`}
                    >
                      Búsqueda Individual
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinkTab('MASIVA')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        linkTab === 'MASIVA'
                          ? 'bg-men-blue text-white'
                          : 'text-slate-600 hover:text-men-navy'
                      }`}
                    >
                      Carga Masiva (Documentos)
                    </button>
                  </div>
                </div>

                {linkTab === 'INDIVIDUAL' ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={studentQuery}
                        onChange={(e) => setStudentQuery(e.target.value)}
                        placeholder="Buscar por nombre o número de documento en esta entidad..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-men-blue focus:outline-none"
                      />
                    </div>

                    {availableStudentsForSelected.length === 0 ? (
                      <p className="text-xs text-slate-500 p-3 bg-slate-50 rounded-lg">
                        No hay más estudiantes disponibles sin vincular en{' '}
                        {entidadesById.get(selectedStrategy.entidadId)?.nombre}.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {availableStudentsForSelected.map((est) => (
                          <div
                            key={est.id}
                            className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-slate-200 text-xs"
                          >
                            <div>
                              <div className="font-semibold text-men-navy">
                                {est.nombreCompleto}
                              </div>
                              <div className="text-slate-500 font-mono">
                                {est.tipoDocumento} {est.numeroDocumento} ·
                                Grado {est.grado}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={isLinking}
                              onClick={() =>
                                handleLinkSingle(est.numeroDocumento)
                              }
                              className="px-3 py-1.5 rounded-lg bg-men-blue hover:bg-[#0052A3] text-white font-semibold shrink-0 disabled:opacity-60"
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
                    <div className="text-xs text-slate-600">
                      Pegue números de documento separados por saltos de línea,
                      comas o punto y coma. Documentos de esta entidad para
                      prueba rápida:{' '}
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-men-navy">
                        {sampleEntityDocs || 'Sin estudiantes en entidad'}
                      </code>
                    </div>
                    <textarea
                      rows={3}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="Ej: 1144087311, 1144087312, 1020304821, 9999999999"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-men-blue focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isLinking}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-men-blue hover:bg-[#0052A3] text-white text-xs font-semibold disabled:opacity-60"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>
                        {isLinking
                          ? 'Procesando carga...'
                          : 'Procesar carga masiva'}
                      </span>
                    </button>
                  </form>
                )}

                {linkError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-men-red text-men-red text-xs">
                    {linkError}
                  </div>
                )}

                {lastLinkResult && (
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-men-navy">
                      Resumen de Vinculación de Estudiantes
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2 rounded-md bg-emerald-50 border border-emerald-200 text-men-emerald">
                        <div className="font-bold text-base">
                          {lastLinkResult.vinculados.length}
                        </div>
                        <div>Vinculados</div>
                      </div>
                      <div className="p-2 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                        <div className="font-bold text-base">
                          {lastLinkResult.yaVinculados.length}
                        </div>
                        <div>Duplicados omitidos</div>
                      </div>
                      <div className="p-2 rounded-md bg-red-50 border border-red-200 text-men-red">
                        <div className="font-bold text-base">
                          {lastLinkResult.otraEntidad.length}
                        </div>
                        <div>Otra entidad (rech.)</div>
                      </div>
                      <div className="p-2 rounded-md bg-amber-50 border border-amber-200 text-men-amber">
                        <div className="font-bold text-base">
                          {lastLinkResult.noEncontrados.length}
                        </div>
                        <div>No encontrados</div>
                      </div>
                    </div>

                    {lastLinkResult.otraEntidad.length > 0 && (
                      <div className="text-men-red">
                        <strong>Rechazados por pertenecer a otra entidad:</strong>{' '}
                        {lastLinkResult.otraEntidad.join(', ')}
                      </div>
                    )}
                    {lastLinkResult.yaVinculados.length > 0 && (
                      <div className="text-slate-600">
                        <strong>Ya vinculados (omitidos):</strong>{' '}
                        {lastLinkResult.yaVinculados.join(', ')}
                      </div>
                    )}
                    {lastLinkResult.noEncontrados.length > 0 && (
                      <div className="text-men-amber">
                        <strong>No encontrados en catálogo:</strong>{' '}
                        {lastLinkResult.noEncontrados.join(', ')}
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

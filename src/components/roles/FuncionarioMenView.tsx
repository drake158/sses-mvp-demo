import React, { useMemo, useRef, useState } from 'react';
import {
  Download,
  Edit3,
  Info,
  Lock,
  Plus,
  Search,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { useSses } from '../../context/SsesContext';
import type {
  BulkCreateEstudiantesResult,
  BulkLinkResult,
  Estrategia,
  TipoDocumento,
} from '../../types/sses';
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
    crearEstudiante,
    crearEstudiantesMasivo,
    crearTutor,
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

  // Student catalog registration state (Manual & Bulk)
  const [studentRegTab, setStudentRegTab] = useState<'MANUAL' | 'MASIVA'>(
    'MANUAL'
  );
  const [stuTipoDoc, setStuTipoDoc] = useState<TipoDocumento>('TI');
  const [stuNumeroDoc, setStuNumeroDoc] = useState('');
  const [stuNombre, setStuNombre] = useState('');
  const [stuGrado, setStuGrado] = useState('10°');
  const [stuEntidadId, setStuEntidadId] = useState(firstActiveEntidadId);
  const [stuError, setStuError] = useState<string | null>(null);
  const [stuSuccess, setStuSuccess] = useState<string | null>(null);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);

  const [bulkStuEntidadId, setBulkStuEntidadId] =
    useState(firstActiveEntidadId);
  const [bulkStuText, setBulkStuText] = useState('');
  const [bulkStuError, setBulkStuError] = useState<string | null>(null);
  const [bulkStuResult, setBulkStuResult] =
    useState<BulkCreateEstudiantesResult | null>(null);
  const [isBulkCreatingStudents, setIsBulkCreatingStudents] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Tutor manual registration state
  const [tutTipoDoc, setTutTipoDoc] = useState<TipoDocumento>('CC');
  const [tutNumeroDoc, setTutNumeroDoc] = useState('');
  const [tutNombre, setTutNombre] = useState('');
  const [tutZona, setTutZona] = useState('');
  const [tutError, setTutError] = useState<string | null>(null);
  const [tutSuccess, setTutSuccess] = useState<string | null>(null);
  const [isCreatingTutor, setIsCreatingTutor] = useState(false);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStuError(null);
    setStuSuccess(null);
    setIsCreatingStudent(true);
    try {
      const targetEntidad = stuEntidadId || firstActiveEntidadId;
      const res = await crearEstudiante({
        tipoDocumento: stuTipoDoc,
        numeroDocumento: stuNumeroDoc,
        nombreCompleto: stuNombre,
        entidadId: targetEntidad,
        grado: stuGrado,
      });
      if (!res.ok) {
        setStuError(res.errors?.join(' ') ?? res.error);
        return;
      }
      setStuNumeroDoc('');
      setStuNombre('');
      setStuSuccess(`Registrado · ${res.data.id} (${res.data.nombreCompleto})`);
    } finally {
      setIsCreatingStudent(false);
    }
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkStuError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBulkStuText(reader.result);
      }
    };
    reader.onerror = () => {
      setBulkStuError('No se pudo leer el archivo seleccionado.');
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleBulkCreateStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkStuError(null);
    setBulkStuResult(null);
    setIsBulkCreatingStudents(true);
    try {
      const targetEntidad = bulkStuEntidadId || firstActiveEntidadId;
      const res = await crearEstudiantesMasivo(targetEntidad, bulkStuText);
      if (!res.ok) {
        setBulkStuError(res.error);
        return;
      }
      setBulkStuResult(res.data);
      if (res.data.creados.length > 0 && res.data.invalidos.length === 0) {
        setBulkStuText('');
      }
    } finally {
      setIsBulkCreatingStudents(false);
    }
  };

  const handleCreateTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    setTutError(null);
    setTutSuccess(null);
    setIsCreatingTutor(true);
    try {
      const res = await crearTutor({
        tipoDocumento: tutTipoDoc,
        numeroDocumento: tutNumeroDoc,
        nombreCompleto: tutNombre,
        zonaAsignada: tutZona,
      });
      if (!res.ok) {
        setTutError(res.errors?.join(' ') ?? res.error);
        return;
      }
      setTutNumeroDoc('');
      setTutNombre('');
      setTutZona('');
      setTutSuccess(`Registrado · ${res.data.id} (${res.data.nombreCompleto})`);
    } finally {
      setIsCreatingTutor(false);
    }
  };

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
                    className="p-4 rounded bg-elevated border border-border-subtle space-y-4"
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
                  <div className="text-xs text-ink-secondary bg-elevated px-4 py-3 rounded border border-border-subtle">
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
                          className="flex items-center justify-between px-3.5 py-2.5 rounded bg-elevated border border-border-subtle text-xs"
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
                    className="inline-flex rounded bg-elevated border border-border-subtle p-0.5 text-xs"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={linkTab === 'INDIVIDUAL'}
                      onClick={() => setLinkTab('INDIVIDUAL')}
                      className={`px-3 py-1 rounded-sm font-medium transition-colors duration-150 ${
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
                      className={`px-3 py-1 rounded-sm font-medium transition-colors duration-150 ${
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
                      <div className="text-xs text-ink-secondary px-4 py-3 bg-elevated border border-border-subtle rounded">
                        Sin estudiantes disponibles
                      </div>
                    ) : (
                      <div className="divide-y divide-border-subtle border border-border-subtle rounded max-h-56 overflow-y-auto">
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
                  <div className="p-4 rounded bg-elevated border border-border-subtle text-xs space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-2.5 rounded bg-surface border border-border-subtle">
                        <div className="sses-kpi-value text-lg text-status-emerald">
                          {lastLinkResult.vinculados.length}
                        </div>
                        <div className="text-ink-secondary">Vinculados</div>
                      </div>
                      <div className="p-2.5 rounded bg-surface border border-border-subtle">
                        <div className="sses-kpi-value text-lg text-ink">
                          {lastLinkResult.yaVinculados.length}
                        </div>
                        <div className="text-ink-secondary">Duplicados</div>
                      </div>
                      <div className="p-2.5 rounded bg-surface border border-border-subtle">
                        <div className="sses-kpi-value text-lg text-status-danger">
                          {lastLinkResult.otraEntidad.length}
                        </div>
                        <div className="text-ink-secondary">Otra entidad</div>
                      </div>
                      <div className="p-2.5 rounded bg-surface border border-border-subtle">
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

      {/* Catalog Registration: Students (Manual + Bulk) & Tutors (Manual) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Register Students (Manual / Bulk CSV) */}
        <section className="lg:col-span-7 sses-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-ink">
                Registrar estudiantes
              </h2>
              <span className="sses-mono text-xs text-ink-secondary">
                {state.estudiantes.length}
              </span>
            </div>

            <div
              role="tablist"
              aria-label="Modo de registro de estudiantes"
              className="inline-flex rounded bg-elevated border border-border-subtle p-0.5 text-xs"
            >
              <button
                type="button"
                role="tab"
                aria-selected={studentRegTab === 'MANUAL'}
                onClick={() => setStudentRegTab('MANUAL')}
                className={`px-3 py-1 rounded-sm font-medium transition-colors duration-150 ${
                  studentRegTab === 'MANUAL'
                    ? 'bg-brand-primary text-[var(--brand-primary-text)]'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={studentRegTab === 'MASIVA'}
                onClick={() => setStudentRegTab('MASIVA')}
                className={`px-3 py-1 rounded-sm font-medium transition-colors duration-150 ${
                  studentRegTab === 'MASIVA'
                    ? 'bg-brand-primary text-[var(--brand-primary-text)]'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Carga masiva
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {studentRegTab === 'MANUAL' ? (
              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="stu-tipo"
                      className="block text-xs font-medium text-ink-secondary mb-1.5"
                    >
                      Tipo doc.
                    </label>
                    <select
                      id="stu-tipo"
                      value={stuTipoDoc}
                      onChange={(e) =>
                        setStuTipoDoc(e.target.value as TipoDocumento)
                      }
                      className="sses-input text-xs"
                    >
                      <option value="TI">TI</option>
                      <option value="CC">CC</option>
                      <option value="CE">CE</option>
                      <option value="PPT">PPT</option>
                    </select>
                  </div>

                  <div className="sm:col-span-8">
                    <label
                      htmlFor="stu-doc"
                      className="block text-xs font-medium text-ink-secondary mb-1.5"
                    >
                      Número documento
                    </label>
                    <input
                      id="stu-doc"
                      type="text"
                      required
                      value={stuNumeroDoc}
                      onChange={(e) => setStuNumeroDoc(e.target.value)}
                      placeholder="1020555111"
                      className="sses-input sses-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-9">
                    <label
                      htmlFor="stu-nombre"
                      className="block text-xs font-medium text-ink-secondary mb-1.5"
                    >
                      Nombre completo
                    </label>
                    <input
                      id="stu-nombre"
                      type="text"
                      required
                      value={stuNombre}
                      onChange={(e) => setStuNombre(e.target.value)}
                      placeholder="Lucía Fernanda Pérez"
                      className="sses-input"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="stu-grado"
                      className="block text-xs font-medium text-ink-secondary mb-1.5"
                    >
                      Grado
                    </label>
                    <input
                      id="stu-grado"
                      type="text"
                      required
                      value={stuGrado}
                      onChange={(e) => setStuGrado(e.target.value)}
                      placeholder="10°"
                      className="sses-input sses-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="stu-entidad"
                    className="block text-xs font-medium text-ink-secondary mb-1.5"
                  >
                    Entidad educativa
                  </label>
                  <select
                    id="stu-entidad"
                    value={stuEntidadId}
                    onChange={(e) => setStuEntidadId(e.target.value)}
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

                {stuError && (
                  <div role="alert" className="sses-notice-danger">
                    {stuError}
                  </div>
                )}

                {stuSuccess && (
                  <div role="status" className="sses-notice-success">
                    {stuSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCreatingStudent}
                  className="sses-btn-primary w-full sm:w-auto"
                >
                  <UserPlus className="h-4 w-4" strokeWidth={1.5} />
                  <span>
                    {isCreatingStudent ? 'Guardando...' : 'Agregar estudiante'}
                  </span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleBulkCreateStudents} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                  <div className="sm:col-span-8">
                    <label
                      htmlFor="bulk-stu-entidad"
                      className="block text-xs font-medium text-ink-secondary mb-1.5"
                    >
                      Entidad destino
                    </label>
                    <select
                      id="bulk-stu-entidad"
                      value={bulkStuEntidadId}
                      onChange={(e) => setBulkStuEntidadId(e.target.value)}
                      className="sses-input text-xs"
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

                  <div className="sm:col-span-4">
                    <input
                      ref={csvFileInputRef}
                      type="file"
                      accept=".csv,.txt,text/csv,text/plain"
                      onChange={handleCsvFileUpload}
                      className="hidden"
                      aria-label="Seleccionar archivo CSV de estudiantes"
                    />
                    <button
                      type="button"
                      onClick={() => csvFileInputRef.current?.click()}
                      className="sses-btn-secondary w-full text-xs"
                    >
                      <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>Cargar CSV</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="bulk-stu-text"
                      className="text-xs font-medium text-ink-secondary"
                    >
                      Filas (Tipo, Documento, Nombre, Grado)
                    </label>
                    <span
                      title="Acepta separador coma (,) o punto y coma (;) y encabezado opcional."
                      className="inline-flex items-center gap-1 text-[11px] text-ink-secondary cursor-help"
                    >
                      <Info className="h-3 w-3" strokeWidth={1.5} />
                      <span>CSV / líneas</span>
                    </span>
                  </div>
                  <textarea
                    id="bulk-stu-text"
                    rows={4}
                    value={bulkStuText}
                    onChange={(e) => setBulkStuText(e.target.value)}
                    placeholder={
                      'TI, 1020555111, Lucía Fernanda Pérez, 10°\nCC, 1020555112, Tomás Herrera Gil, 11°'
                    }
                    className="sses-input sses-mono text-xs"
                  />
                </div>

                {bulkStuError && (
                  <div role="alert" className="sses-notice-danger">
                    {bulkStuError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isBulkCreatingStudents}
                  className="sses-btn-primary w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4" strokeWidth={1.5} />
                  <span>
                    {isBulkCreatingStudents
                      ? 'Importando...'
                      : 'Importar estudiantes'}
                  </span>
                </button>

                {bulkStuResult && (
                  <div className="p-4 rounded bg-elevated border border-border-subtle text-xs space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2.5 rounded bg-surface border border-border-subtle">
                        <div className="sses-kpi-value text-lg text-status-emerald">
                          {bulkStuResult.creados.length}
                        </div>
                        <div className="text-ink-secondary">Creados</div>
                      </div>
                      <div className="p-2.5 rounded bg-surface border border-border-subtle">
                        <div className="sses-kpi-value text-lg text-status-amber">
                          {bulkStuResult.duplicados.length}
                        </div>
                        <div className="text-ink-secondary">Duplicados</div>
                      </div>
                      <div className="p-2.5 rounded bg-surface border border-border-subtle">
                        <div className="sses-kpi-value text-lg text-status-danger">
                          {bulkStuResult.invalidos.length}
                        </div>
                        <div className="text-ink-secondary">Inválidos</div>
                      </div>
                    </div>

                    {bulkStuResult.duplicados.length > 0 && (
                      <div className="text-[var(--badge-warning-text)]">
                        Duplicados:{' '}
                        <span className="sses-mono">
                          {bulkStuResult.duplicados.join(', ')}
                        </span>
                      </div>
                    )}

                    {bulkStuResult.invalidos.length > 0 && (
                      <div className="space-y-1 text-[var(--badge-danger-text)]">
                        {bulkStuResult.invalidos.slice(0, 5).map((err) => (
                          <div key={`${err.linea}-${err.contenido}`}>
                            Línea {err.linea}: {err.motivo}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </form>
            )}

            {/* Catalog Preview */}
            <div className="pt-4 border-t border-border-subtle space-y-2.5">
              <div className="flex items-center justify-between text-xs text-ink-secondary">
                <span className="font-medium">Catálogo reciente</span>
                <span className="sses-mono">{state.estudiantes.length}</span>
              </div>
              <div className="divide-y divide-border-subtle border border-border-subtle rounded max-h-44 overflow-y-auto">
                {[...state.estudiantes].reverse().slice(0, 8).map((est) => (
                  <div
                    key={est.id}
                    className="px-3.5 py-2 bg-surface flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-ink truncate block">
                        {est.nombreCompleto}
                      </span>
                      <span className="text-ink-secondary truncate block">
                        {entidadesById.get(est.entidadId)?.nombre ??
                          est.entidadId}
                      </span>
                    </div>
                    <span className="sses-mono text-[11px] text-ink-secondary shrink-0">
                      {est.tipoDocumento} {est.numeroDocumento} · {est.grado}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right: Register Tutor (Manual) */}
        <section className="lg:col-span-5 sses-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-ink">Registrar tutor</h2>
            <span className="sses-mono text-xs text-ink-secondary">
              {state.tutores.length}
            </span>
          </div>

          <div className="p-6 space-y-5">
            <form onSubmit={handleCreateTutor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-4">
                  <label
                    htmlFor="tut-tipo"
                    className="block text-xs font-medium text-ink-secondary mb-1.5"
                  >
                    Tipo doc.
                  </label>
                  <select
                    id="tut-tipo"
                    value={tutTipoDoc}
                    onChange={(e) =>
                      setTutTipoDoc(e.target.value as TipoDocumento)
                    }
                    className="sses-input text-xs"
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="PPT">PPT</option>
                    <option value="TI">TI</option>
                  </select>
                </div>

                <div className="sm:col-span-8">
                  <label
                    htmlFor="tut-doc"
                    className="block text-xs font-medium text-ink-secondary mb-1.5"
                  >
                    Número documento
                  </label>
                  <input
                    id="tut-doc"
                    type="text"
                    required
                    value={tutNumeroDoc}
                    onChange={(e) => setTutNumeroDoc(e.target.value)}
                    placeholder="80912345"
                    className="sses-input sses-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="tut-nombre"
                  className="block text-xs font-medium text-ink-secondary mb-1.5"
                >
                  Nombre completo
                </label>
                <input
                  id="tut-nombre"
                  type="text"
                  required
                  value={tutNombre}
                  onChange={(e) => setTutNombre(e.target.value)}
                  placeholder="Andrea Milena Castro"
                  className="sses-input"
                />
              </div>

              <div>
                <label
                  htmlFor="tut-zona"
                  className="block text-xs font-medium text-ink-secondary mb-1.5"
                >
                  Zona asignada
                </label>
                <input
                  id="tut-zona"
                  type="text"
                  required
                  value={tutZona}
                  onChange={(e) => setTutZona(e.target.value)}
                  placeholder="Región Andina — Sur"
                  className="sses-input"
                />
              </div>

              {tutError && (
                <div role="alert" className="sses-notice-danger">
                  {tutError}
                </div>
              )}

              {tutSuccess && (
                <div role="status" className="sses-notice-success">
                  {tutSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isCreatingTutor}
                className="sses-btn-primary w-full"
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} />
                <span>
                  {isCreatingTutor ? 'Guardando...' : 'Agregar tutor'}
                </span>
              </button>
            </form>

            {/* Registered Tutors List */}
            <div className="pt-4 border-t border-border-subtle space-y-2.5">
              <div className="flex items-center justify-between text-xs text-ink-secondary">
                <span className="font-medium">Tutores activos</span>
                <span className="sses-mono">{state.tutores.length}</span>
              </div>
              <div className="divide-y divide-border-subtle border border-border-subtle rounded max-h-44 overflow-y-auto">
                {[...state.tutores].reverse().map((tut) => (
                  <div
                    key={tut.id}
                    className="px-3.5 py-2 bg-surface flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-ink truncate block">
                        {tut.nombreCompleto}
                      </span>
                      <span className="text-ink-secondary truncate block">
                        {tut.zonaAsignada}
                      </span>
                    </div>
                    <span className="sses-mono text-[11px] text-ink-secondary shrink-0">
                      {tut.tipoDocumento} {tut.numeroDocumento}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

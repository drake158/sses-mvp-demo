import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  FlaskConical,
  Link2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useSses } from '../../context/SsesContext';
import type {
  IntegrityCheckResult,
  RolUsuario,
  TipoAccionAuditoria,
} from '../../types/sses';

const ROLES_FILTER: Array<{ value: 'TODOS' | RolUsuario; label: string }> = [
  { value: 'TODOS', label: 'Todos los roles' },
  { value: 'FUNCIONARIO_MEN', label: 'Funcionario MEN' },
  { value: 'TUTOR', label: 'Tutor' },
  { value: 'ENTE_CONTROL', label: 'Ente de Control' },
  { value: 'OFICINA_TECNOLOGIA', label: 'Oficina de Tecnología' },
];

const ACCIONES_FILTER: Array<{
  value: 'TODAS' | TipoAccionAuditoria;
  label: string;
}> = [
  { value: 'TODAS', label: 'Todas las acciones' },
  { value: 'INICIALIZACION_SISTEMA', label: 'INICIALIZACION_SISTEMA' },
  { value: 'CREAR_ESTRATEGIA', label: 'CREAR_ESTRATEGIA' },
  { value: 'EDITAR_ESTRATEGIA', label: 'EDITAR_ESTRATEGIA' },
  { value: 'VINCULAR_ESTUDIANTES', label: 'VINCULAR_ESTUDIANTES' },
  { value: 'REGISTRAR_ACOMPANAMIENTO', label: 'REGISTRAR_ACOMPANAMIENTO' },
  { value: 'ACTUALIZAR_SEMANA', label: 'ACTUALIZAR_SEMANA' },
  { value: 'SINCRONIZACION_OFFLINE', label: 'SINCRONIZACION_OFFLINE' },
  { value: 'GENERAR_REPORTE_CSV', label: 'GENERAR_REPORTE_CSV' },
];

export const AuditoriaView: React.FC = () => {
  const {
    state,
    verificarIntegridadCadena,
    simularAlteracionAuditoria,
  } = useSses();

  const [rolFilter, setRolFilter] = useState<'TODOS' | RolUsuario>('TODOS');
  const [accionFilter, setAccionFilter] = useState<
    'TODAS' | TipoAccionAuditoria
  >('TODAS');
  const [expandedId, setExpandedId] = useState<string | null>(
    state.auditLog[state.auditLog.length - 1]?.id ?? null
  );

  const [integrityResult, setIntegrityResult] =
    useState<IntegrityCheckResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tamperNotice, setTamperNotice] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    return [...state.auditLog]
      .reverse()
      .filter((entry) => {
        if (rolFilter !== 'TODOS' && entry.rol !== rolFilter) return false;
        if (accionFilter !== 'TODAS' && entry.accion !== accionFilter)
          return false;
        return true;
      });
  }, [state.auditLog, rolFilter, accionFilter]);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const result = await verificarIntegridadCadena();
      setIntegrityResult(result);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    const res = await simularAlteracionAuditoria();
    if (res) {
      setIntegrityResult(null);
      setTamperNotice(
        `Alteración demostrativa inyectada en ${res.alteredEntryId} sin recalcular su hash SHA-256. Presione "Verificar Integridad de Cadena" para comprobar la detección criptográfica (reversible con "Restaurar datos de fábrica").`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Integrity Verification & Demo Tamper Controls */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-men-navy">
            Perfil 4 · Oficina de Tecnología (Auditoría)
          </span>
          <h1 className="text-2xl font-bold text-men-navy mt-0.5">
            Registro de Auditoría Inmutable (<code>audit_log</code>) y Cadena
            SHA-256
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Historial <em>append-only</em> con valores JSON anteriores vs.
            nuevos y encadenamiento criptográfico real vía Web Crypto API (
            <code>crypto.subtle.digest</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-men-blue hover:bg-[#0052A3] text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-60"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isVerifying
                ? 'Verificando cadena...'
                : 'Verificar Integridad de Cadena'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSimulateTamper}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-men-amber border border-men-amber text-xs font-bold transition-colors"
            title="Botón auxiliar de demostración (FR-027): altera un registro para probar la detección criptográfica"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Simular alteración (Demo)</span>
          </button>
        </div>
      </div>

      {/* Tamper Simulation Info Notice */}
      {tamperNotice && !integrityResult && (
        <div
          role="status"
          className="p-4 rounded-xl bg-amber-50 border border-men-amber text-amber-950 text-xs flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-men-amber shrink-0 mt-0.5" />
          <span>{tamperNotice}</span>
        </div>
      )}

      {/* Integrity Verdict Banner */}
      {integrityResult && (
        <div
          role="status"
          className={`p-5 rounded-xl border-2 flex items-start gap-3 ${
            integrityResult.valid
              ? 'bg-emerald-50 border-men-emerald text-emerald-950'
              : 'bg-red-50 border-men-red text-red-950'
          }`}
        >
          {integrityResult.valid ? (
            <CheckCircle2 className="w-6 h-6 text-men-emerald shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-men-red shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div
              className={`text-base font-bold ${
                integrityResult.valid ? 'text-men-emerald' : 'text-men-red'
              }`}
            >
              {integrityResult.valid
                ? `Cadena Criptográfica Íntegra (${integrityResult.totalVerified} de ${state.auditLog.length} registros verificados)`
                : `Integridad Comprometida — Alteración detectada en ${integrityResult.brokenEntryId}`}
            </div>
            <p className="text-xs">
              {integrityResult.valid
                ? 'Todos los registros desde el bloque génesis hasta el evento más reciente coinciden exactamente con sus digests SHA-256 encadenados.'
                : `${integrityResult.reason} Puede restablecer un escenario íntegro desde "Restaurar datos de fábrica" en la barra superior.`}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-men-navy">
            <Filter className="w-4 h-4 text-men-blue" />
            <span>Filtros:</span>
          </div>

          <select
            aria-label="Filtrar por rol"
            value={rolFilter}
            onChange={(e) =>
              setRolFilter(e.target.value as 'TODOS' | RolUsuario)
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-men-blue focus:outline-none"
          >
            {ROLES_FILTER.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por acción"
            value={accionFilter}
            onChange={(e) =>
              setAccionFilter(e.target.value as 'TODAS' | TipoAccionAuditoria)
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-men-blue focus:outline-none"
          >
            {ACCIONES_FILTER.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Mostrando <strong>{filteredEntries.length}</strong> de{' '}
          <strong>{state.auditLog.length}</strong> eventos inmutables
        </div>
      </div>

      {/* Append-Only Audit Log List */}
      <div className="space-y-3">
        {filteredEntries.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const isBroken = integrityResult?.brokenEntryId === entry.id;

          return (
            <article
              key={entry.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                isBroken ? 'border-2 border-men-red' : 'border-slate-200'
              }`}
            >
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-men-navy text-white font-mono text-[11px] font-bold">
                      #{entry.secuencia} · {entry.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-men-blue border border-blue-200 text-[11px] font-bold">
                      {entry.rol}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono text-[11px] font-semibold">
                      {entry.accion}
                    </span>
                    {isBroken && (
                      <span className="px-2 py-0.5 rounded-full bg-men-red text-white text-[11px] font-bold">
                        REGISTRO COMPROMETIDO
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      <strong>Recurso:</strong> {entry.entidadAfectada} (
                      <code>{entry.registroId}</code>)
                    </span>
                    <span>
                      <strong>Timestamp:</strong>{' '}
                      {new Date(entry.timestamp).toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-slate-400" />
                      Prev: {entry.previousHash.slice(0, 14)}…
                    </span>
                    <span className="text-men-navy font-semibold">
                      SHA-256: {entry.hash.slice(0, 22)}…
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-men-navy hover:bg-slate-50 shrink-0 self-start md:self-center"
                >
                  <span>
                    {isExpanded
                      ? 'Ocultar JSON y hashes'
                      : 'Ver JSON Anterior vs. Nuevo'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-3 border-t border-slate-100 bg-slate-50/70 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Valores Anteriores (JSON)
                      </div>
                      <pre className="p-3 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-700 overflow-x-auto max-h-56">
                        {JSON.stringify(entry.valoresAnteriores, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-men-navy mb-1">
                        Valores Nuevos (JSON)
                      </div>
                      <pre className="p-3 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-men-navy overflow-x-auto max-h-56">
                        {JSON.stringify(entry.valoresNuevos, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <div className="text-slate-400 font-sans font-bold uppercase text-[10px] mb-0.5">
                        previousHash (SHA-256 previo)
                      </div>
                      <div className="break-all text-slate-600">
                        {entry.previousHash}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <div className="text-slate-400 font-sans font-bold uppercase text-[10px] mb-0.5">
                        hash (SHA-256 encadenado de este registro)
                      </div>
                      <div className="break-all text-men-navy font-semibold">
                        {entry.hash}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

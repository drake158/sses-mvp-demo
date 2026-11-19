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
      <header className="gov-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="gov-pill-neutral">
            Perfil 4 · Oficina de Tecnología (Auditoría)
          </span>
          <h1 className="text-2xl font-bold text-men-navy">
            Registro de Auditoría Inmutable (<code className="gov-mono">audit_log</code>) y Cadena SHA-256
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Historial <em>append-only</em> con valores JSON anteriores frente a
            nuevos y encadenamiento criptográfico real vía Web Crypto API (
            <code className="gov-mono text-xs">crypto.subtle.digest</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="gov-btn-primary"
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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FFFBEB] hover:bg-amber-100 text-[#92400E] border border-[#FDE68A] text-xs font-semibold transition-all duration-150 ease-in-out"
            title="Botón auxiliar de demostración (FR-027): altera un registro para probar la detección criptográfica"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Simular alteración (Demo)</span>
          </button>
        </div>
      </header>

      {/* Tamper Simulation Info Notice */}
      {tamperNotice && !integrityResult && (
        <div
          role="status"
          className="gov-banner-warning text-xs flex items-start gap-3"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{tamperNotice}</span>
        </div>
      )}

      {/* Integrity Verdict Banner (4px Left Semantic Accent Bar) */}
      {integrityResult && (
        <div
          role="status"
          className={`${
            integrityResult.valid ? 'gov-banner-success' : 'gov-banner-danger'
          } p-5 flex items-start gap-3.5`}
        >
          {integrityResult.valid ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="font-heading text-base font-bold">
              {integrityResult.valid
                ? `Cadena Criptográfica Íntegra (${integrityResult.totalVerified} de ${state.auditLog.length} registros verificados)`
                : `Integridad Comprometida — Alteración detectada en ${integrityResult.brokenEntryId}`}
            </div>
            <p className="text-xs leading-relaxed">
              {integrityResult.valid
                ? 'Todos los registros desde el bloque génesis hasta el evento más reciente coinciden exactamente con sus digests SHA-256 encadenados.'
                : `${integrityResult.reason} Puede restablecer un escenario íntegro desde "Restaurar datos de fábrica" en la barra superior.`}
            </p>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="gov-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-men-navy">
            <Filter className="w-4 h-4 text-men-accent" />
            <span>Filtros:</span>
          </div>

          <select
            aria-label="Filtrar por rol"
            value={rolFilter}
            onChange={(e) =>
              setRolFilter(e.target.value as 'TODOS' | RolUsuario)
            }
            className="gov-input !w-auto text-xs py-1.5"
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
            className="gov-input !w-auto gov-mono text-xs py-1.5"
          >
            {ACCIONES_FILTER.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-[#64748B]">
          Mostrando{' '}
          <strong className="gov-mono text-men-navy">
            {filteredEntries.length}
          </strong>{' '}
          de{' '}
          <strong className="gov-mono text-men-navy">
            {state.auditLog.length}
          </strong>{' '}
          eventos inmutables
        </div>
      </div>

      {/* Append-Only Audit Log List */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const isBroken = integrityResult?.brokenEntryId === entry.id;

          return (
            <article
              key={entry.id}
              className={`gov-card overflow-hidden transition-all duration-150 ${
                isBroken ? 'border-l-4 border-l-[#DC2626] bg-[#FEF2F2]/20' : ''
              }`}
            >
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="gov-mono px-2.5 py-0.5 rounded-md bg-men-navy text-white text-xs font-semibold">
                      #{entry.secuencia} · {entry.id}
                    </span>
                    <span className="gov-pill-info">{entry.rol}</span>
                    <span className="gov-pill-neutral gov-mono">
                      {entry.accion}
                    </span>
                    {isBroken && (
                      <span className="gov-pill-danger font-semibold">
                        REGISTRO COMPROMETIDO
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      <strong className="text-slate-800">Recurso:</strong>{' '}
                      {entry.entidadAfectada} (
                      <code className="gov-mono text-men-navy">
                        {entry.registroId}
                      </code>
                      )
                    </span>
                    <span>
                      <strong className="text-slate-800">Timestamp:</strong>{' '}
                      <span className="gov-mono">
                        {new Date(entry.timestamp).toLocaleString('es-CO')}
                      </span>
                    </span>
                  </div>

                  <div className="gov-mono text-[11px] text-[#64748B] flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-slate-400" />
                      Prev: {entry.previousHash.slice(0, 14)}…
                    </span>
                    <span className="text-men-navy font-medium">
                      SHA-256: {entry.hash.slice(0, 24)}…
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="gov-btn-secondary text-xs shrink-0 self-start md:self-center"
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
                <div className="px-6 pb-6 pt-4 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B] mb-1.5">
                        Valores Anteriores (JSON)
                      </div>
                      <pre className="gov-mono p-4 rounded-lg bg-white border border-[#E2E8F0] text-[11px] text-slate-700 overflow-x-auto max-h-56">
                        {JSON.stringify(entry.valoresAnteriores, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-men-navy mb-1.5">
                        Valores Nuevos (JSON)
                      </div>
                      <pre className="gov-mono p-4 rounded-lg bg-white border border-[#E2E8F0] text-[11px] text-men-navy overflow-x-auto max-h-56">
                        {JSON.stringify(entry.valoresNuevos, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                    <div className="p-3 rounded-lg bg-white border border-[#E2E8F0]">
                      <div className="text-[#64748B] font-semibold uppercase tracking-[0.05em] text-[10px] mb-1">
                        previousHash (SHA-256 previo)
                      </div>
                      <div className="gov-mono break-all text-slate-600">
                        {entry.previousHash}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-[#E2E8F0]">
                      <div className="text-[#64748B] font-semibold uppercase tracking-[0.05em] text-[10px] mb-1">
                        hash (SHA-256 encadenado de este registro)
                      </div>
                      <div className="gov-mono break-all text-men-navy font-semibold">
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

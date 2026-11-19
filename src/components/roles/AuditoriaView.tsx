import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Link2,
  ShieldCheck,
} from 'lucide-react';
import { useSses } from '../../context/SsesContext';
import type {
  IntegrityCheckResult,
  RolUsuario,
  TipoAccionAuditoria,
} from '../../types/sses';
import { StatusBadge } from '../common/StatusBadge';

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
        `Alteración inyectada en ${res.alteredEntryId}. Ejecute "Verificar cadena" para detectarla.`
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Minimal Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.025em] text-ink">
            Auditoría
          </h1>
          <StatusBadge
            tone="neutral"
            mono
            title="Registro append-only con encadenamiento SHA-256 mediante Web Crypto API"
          >
            SHA-256 · {state.auditLog.length}
          </StatusBadge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateTamper}
            aria-label="Simular alteración de auditoría"
            title="Altera un registro sin recalcular su hash para probar la detección criptográfica"
            className="sses-btn-secondary text-xs"
          >
            <FlaskConical
              className="h-3.5 w-3.5 text-status-amber"
              strokeWidth={1.5}
            />
            <span>Simular alteración</span>
          </button>

          <button
            type="button"
            onClick={handleVerifyChain}
            disabled={isVerifying}
            aria-label="Verificar integridad de la cadena SHA-256"
            className="sses-btn-primary text-xs"
          >
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{isVerifying ? 'Verificando...' : 'Verificar cadena'}</span>
          </button>
        </div>
      </header>

      {tamperNotice && !integrityResult && (
        <div role="status" className="sses-notice-warning">
          {tamperNotice}
        </div>
      )}

      {integrityResult && (
        <div
          role="status"
          className={
            integrityResult.valid
              ? 'sses-notice-success flex flex-wrap items-center justify-between gap-2'
              : 'sses-notice-danger flex flex-wrap items-center justify-between gap-2'
          }
        >
          <span className="font-medium">
            {integrityResult.valid
              ? `Cadena íntegra · ${integrityResult.totalVerified}/${state.auditLog.length} verificados`
              : `Integridad comprometida · ${integrityResult.brokenEntryId}`}
          </span>
          {!integrityResult.valid && integrityResult.reason && (
            <span className="text-xs">{integrityResult.reason}</span>
          )}
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="sses-card px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filtrar por rol"
            value={rolFilter}
            onChange={(e) =>
              setRolFilter(e.target.value as 'TODOS' | RolUsuario)
            }
            className="sses-input !w-auto text-xs py-1.5"
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
            className="sses-input !w-auto sses-mono text-xs py-1.5"
          >
            {ACCIONES_FILTER.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <span className="sses-mono text-xs text-ink-secondary">
          {filteredEntries.length} / {state.auditLog.length}
        </span>
      </div>

      {/* Audit Log Entries */}
      <div className="space-y-3">
        {filteredEntries.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const isBroken = integrityResult?.brokenEntryId === entry.id;

          return (
            <article
              key={entry.id}
              className={`sses-card overflow-hidden ${
                isBroken ? 'border-status-danger' : ''
              }`}
            >
              <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="sses-mono text-xs font-medium text-brand-accent">
                      #{entry.secuencia} · {entry.id}
                    </span>
                    <StatusBadge tone="info">{entry.rol}</StatusBadge>
                    <span className="sses-mono text-xs text-ink">
                      {entry.accion}
                    </span>
                    {isBroken && (
                      <StatusBadge tone="danger">Comprometido</StatusBadge>
                    )}
                  </div>

                  <div className="text-xs text-ink-secondary flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      {entry.entidadAfectada}{' '}
                      <code className="sses-mono text-ink">
                        {entry.registroId}
                      </code>
                    </span>
                    <span className="sses-mono">
                      {new Date(entry.timestamp).toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div className="sses-mono text-[11px] text-ink-secondary flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span
                      title={`previousHash: ${entry.previousHash}`}
                      className="inline-flex items-center gap-1"
                    >
                      <Link2 className="h-3 w-3" strokeWidth={1.5} />
                      {entry.previousHash.slice(0, 12)}…
                    </span>
                    <span title={`hash: ${entry.hash}`} className="text-ink">
                      SHA-256: {entry.hash.slice(0, 20)}…
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded
                      ? `Ocultar detalle de ${entry.id}`
                      : `Ver detalle JSON de ${entry.id}`
                  }
                  className="sses-btn-ghost text-xs shrink-0 self-start md:self-center"
                >
                  <span>{isExpanded ? 'Ocultar' : 'JSON'}</span>
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="px-6 pb-6 pt-4 border-t border-border-subtle bg-elevated space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-ink-secondary mb-1.5">
                        Anterior
                      </div>
                      <pre className="sses-mono p-4 rounded-lg bg-surface border border-border-subtle text-[11px] text-ink-secondary overflow-x-auto max-h-56">
                        {JSON.stringify(entry.valoresAnteriores, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-ink mb-1.5">
                        Nuevo
                      </div>
                      <pre className="sses-mono p-4 rounded-lg bg-surface border border-border-subtle text-[11px] text-ink overflow-x-auto max-h-56">
                        {JSON.stringify(entry.valoresNuevos, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                    <div className="p-3 rounded-lg bg-surface border border-border-subtle">
                      <div className="text-ink-secondary font-medium mb-1">
                        previousHash
                      </div>
                      <div className="sses-mono break-all text-ink-secondary">
                        {entry.previousHash}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-surface border border-border-subtle">
                      <div className="text-ink-secondary font-medium mb-1">
                        hash
                      </div>
                      <div className="sses-mono break-all text-ink">
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

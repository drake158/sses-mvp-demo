import React, { useState } from 'react';
import {
  Check,
  Copy,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';
import type { ConstanciaReporte } from '../../types/sses';

interface ReportReceiptCardProps {
  constancias: ConstanciaReporte[];
  emptyMessage?: string;
}

export const ReportReceiptCard: React.FC<ReportReceiptCardProps> = ({
  constancias,
  emptyMessage = 'Aún no se han generado reportes CSV en esta sesión. Descargue un reporte para emitir su constancia SHA-256.',
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, sha256: string) => {
    try {
      await navigator.clipboard.writeText(sha256);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard API may be unavailable in non-focused contexts
    }
  };

  if (constancias.length === 0) {
    return (
      <div className="gov-card p-6 border-dashed text-sm text-[#64748B] flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] text-[#64748B] flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-4 h-4" />
        </div>
        <span>{emptyMessage}</span>
      </div>
    );
  }

  const latest = constancias[0];

  return (
    <div className="gov-card border-l-4 border-l-[#065F46] overflow-hidden">
      <div className="px-6 py-4 bg-[#ECFDF5]/60 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#065F46] font-heading font-bold text-sm">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Constancia Criptográfica de Reporte CSV ({latest.id})</span>
        </div>
        <span
          className={
            latest.enmascaradoLey1581 ? 'gov-pill-success' : 'gov-pill-neutral'
          }
        >
          {latest.enmascaradoLey1581
            ? 'Ley 1581 · Documentos Enmascarados'
            : 'Reporte Institucional MEN'}
        </span>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-[#64748B] font-medium uppercase tracking-[0.04em] text-[11px]">
              Archivo CSV
            </div>
            <div className="gov-mono font-medium text-men-navy break-all mt-0.5">
              {latest.nombreArchivo}
            </div>
          </div>
          <div>
            <div className="text-[#64748B] font-medium uppercase tracking-[0.04em] text-[11px]">
              Fecha y Hora
            </div>
            <div className="gov-mono font-medium text-slate-800 mt-0.5">
              {new Date(latest.generadoEn).toLocaleString('es-CO')}
            </div>
          </div>
          <div>
            <div className="text-[#64748B] font-medium uppercase tracking-[0.04em] text-[11px]">
              Registros Exportados
            </div>
            <div className="gov-mono font-medium text-slate-800 mt-0.5">
              {latest.totalRegistros} fila(s)
            </div>
          </div>
        </div>

        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
              Huella Digital SHA-256 (Web Crypto API)
            </span>
            <button
              type="button"
              onClick={() => handleCopy(latest.id, latest.sha256)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-men-accent hover:text-men-accent-hover transition-colors"
            >
              {copiedId === latest.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#065F46]" />
                  <span className="text-[#065F46]">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar SHA-256</span>
                </>
              )}
            </button>
          </div>
          <code className="gov-mono block text-xs text-men-navy break-all select-all">
            {latest.sha256}
          </code>
        </div>

        {constancias.length > 1 && (
          <div className="pt-4 border-t border-[#E2E8F0]">
            <div className="text-xs font-semibold text-[#64748B] mb-2">
              Historial de constancias emitidas ({constancias.length})
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {constancias.slice(1).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-xs bg-[#F8FAFC] px-3 py-2 rounded-lg border border-[#E2E8F0]"
                >
                  <span className="gov-mono font-medium text-men-navy">
                    {item.id} · {item.nombreArchivo}
                  </span>
                  <code className="gov-mono text-[11px] text-[#64748B]">
                    {item.sha256.slice(0, 16)}…{item.sha256.slice(-8)}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

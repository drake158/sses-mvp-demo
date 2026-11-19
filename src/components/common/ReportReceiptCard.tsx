import React, { useState } from 'react';
import { Check, Copy, FileSpreadsheet } from 'lucide-react';
import type { ConstanciaReporte } from '../../types/sses';
import { StatusBadge } from './StatusBadge';

interface ReportReceiptCardProps {
  constancias: ConstanciaReporte[];
  emptyMessage?: string;
}

export const ReportReceiptCard: React.FC<ReportReceiptCardProps> = ({
  constancias,
  emptyMessage = 'Sin reportes CSV generados',
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
      <div className="sses-card px-6 py-4 flex items-center gap-3 text-xs text-[#64748B]">
        <FileSpreadsheet
          aria-hidden="true"
          className="h-4 w-4 text-[#64748B] shrink-0"
          strokeWidth={1.5}
        />
        <span>{emptyMessage}</span>
      </div>
    );
  }

  const latest = constancias[0];

  return (
    <div className="sses-card p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-[#0F172A]">
            Constancia CSV
          </span>
          <span className="sses-mono text-xs text-[#64748B]">{latest.id}</span>
        </div>
        <StatusBadge tone={latest.enmascaradoLey1581 ? 'success' : 'info'}>
          {latest.enmascaradoLey1581 ? 'Ley 1581' : 'Reporte MEN'}
        </StatusBadge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <div className="text-[#64748B]">Archivo</div>
          <div className="sses-mono text-[#0F172A] break-all mt-0.5">
            {latest.nombreArchivo}
          </div>
        </div>
        <div>
          <div className="text-[#64748B]">Fecha</div>
          <div className="sses-mono text-[#0F172A] mt-0.5">
            {new Date(latest.generadoEn).toLocaleString('es-CO')}
          </div>
        </div>
        <div>
          <div className="text-[#64748B]">Registros</div>
          <div className="sses-mono text-[#0F172A] mt-0.5">
            {latest.totalRegistros}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[#64748B]">SHA-256</span>
          <button
            type="button"
            onClick={() => handleCopy(latest.id, latest.sha256)}
            aria-label="Copiar huella SHA-256"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#0284C7] hover:text-[#0369A1] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
          >
            {copiedId === latest.id ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#059669]" strokeWidth={1.5} />
                <span className="text-[#059669]">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
        <code className="sses-mono block text-xs text-[#0F172A] break-all select-all">
          {latest.sha256}
        </code>
      </div>

      {constancias.length > 1 && (
        <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
          <div className="text-xs font-medium text-[#64748B]">
            Anteriores ({constancias.length - 1})
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {constancias.slice(1).map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 text-xs px-3 py-2 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB]"
              >
                <span className="sses-mono text-[#0F172A]">
                  {item.id} · {item.nombreArchivo}
                </span>
                <code className="sses-mono text-[#64748B]">
                  {item.sha256.slice(0, 14)}…{item.sha256.slice(-8)}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

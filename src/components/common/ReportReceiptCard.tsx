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
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 flex items-center gap-3">
        <FileSpreadsheet className="w-5 h-5 text-slate-400 shrink-0" />
        <span>{emptyMessage}</span>
      </div>
    );
  }

  const latest = constancias[0];

  return (
    <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-men-emerald font-bold text-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Constancia Criptográfica de Reporte CSV ({latest.id})</span>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            latest.enmascaradoLey1581
              ? 'bg-men-emerald text-white'
              : 'bg-men-navy text-white'
          }`}
        >
          {latest.enmascaradoLey1581
            ? 'Ley 1581 · Documentos Enmascarados'
            : 'Reporte Institucional MEN'}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <div className="text-slate-500 font-medium">Archivo CSV</div>
            <div className="font-semibold text-men-navy break-all">
              {latest.nombreArchivo}
            </div>
          </div>
          <div>
            <div className="text-slate-500 font-medium">Fecha y Hora</div>
            <div className="font-semibold text-slate-800">
              {new Date(latest.generadoEn).toLocaleString('es-CO')}
            </div>
          </div>
          <div>
            <div className="text-slate-500 font-medium">Registros Exportados</div>
            <div className="font-semibold text-slate-800">
              {latest.totalRegistros} fila(s)
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Huella Digital SHA-256 (Web Crypto API)
            </span>
            <button
              type="button"
              onClick={() => handleCopy(latest.id, latest.sha256)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-men-blue hover:underline"
            >
              {copiedId === latest.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-men-emerald" />
                  <span className="text-men-emerald">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar SHA-256</span>
                </>
              )}
            </button>
          </div>
          <code className="block text-xs font-mono text-men-navy break-all select-all">
            {latest.sha256}
          </code>
        </div>

        {constancias.length > 1 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-600 mb-2">
              Historial de constancias emitidas ({constancias.length})
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {constancias.slice(1).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100"
                >
                  <span className="font-medium text-men-navy">
                    {item.id} · {item.nombreArchivo}
                  </span>
                  <code className="font-mono text-[11px] text-slate-600">
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

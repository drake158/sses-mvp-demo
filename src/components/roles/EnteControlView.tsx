import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useSses } from '../../context/SsesContext';
import {
  calcularKpisCumplimiento,
  enmascararDocumentoLey1581,
} from '../../utils/businessRules';
import { KpiDashboard } from '../common/KpiDashboard';
import { ReportReceiptCard } from '../common/ReportReceiptCard';
import { StatusBadge } from '../common/StatusBadge';

export const EnteControlView: React.FC = () => {
  const { state, generarYDescargarReporteCsv } = useSses();
  const [isExporting, setIsExporting] = useState(false);

  const kpis = useMemo(
    () => calcularKpisCumplimiento(state.estrategias, state.acompanamientos),
    [state.estrategias, state.acompanamientos]
  );

  const constanciasControl = useMemo(
    () =>
      state.constanciasReportes.filter(
        (c) => c.rolGenerador === 'ENTE_CONTROL'
      ),
    [state.constanciasReportes]
  );

  const entidadesById = useMemo(
    () => new Map(state.entidades.map((e) => [e.id, e])),
    [state.entidades]
  );

  const estrategiasById = useMemo(
    () => new Map(state.estrategias.map((e) => [e.id, e])),
    [state.estrategias]
  );

  const tutoresById = useMemo(
    () => new Map(state.tutores.map((t) => [t.id, t])),
    [state.tutores]
  );

  const handleDownloadStatutoryCsv = async () => {
    setIsExporting(true);
    try {
      await generarYDescargarReporteCsv('ENTE_CONTROL');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Minimal Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.025em] text-[#0F172A]">
            Supervisión
          </h1>
          <StatusBadge
            tone="success"
            title="Modo estrictamente de solo lectura. Documentos enmascarados automáticamente bajo Ley 1581 de 2012 (ej. CC ******4821)."
          >
            Solo lectura · Ley 1581
          </StatusBadge>
        </div>

        <button
          type="button"
          onClick={handleDownloadStatutoryCsv}
          disabled={isExporting}
          aria-label="Descargar reporte de ley CSV con documentos enmascarados y huella SHA-256"
          title="Reporte CSV con documentos enmascarados (Ley 1581) y constancia SHA-256"
          className="sses-btn-primary"
        >
          <Download className="h-4 w-4" strokeWidth={1.5} />
          <span>{isExporting ? 'Generando...' : 'Reporte de ley CSV'}</span>
        </button>
      </header>

      {/* Read-Only KPIs & Report Receipt */}
      <KpiDashboard kpis={kpis} />
      <ReportReceiptCard
        constancias={constanciasControl}
        emptyMessage="Sin reportes de ley generados"
      />

      {/* Strategies Table */}
      <section className="sses-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-[#0F172A]">Estrategias</h2>
          <span className="sses-mono text-xs text-[#64748B]">
            {state.estrategias.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="sses-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Estrategia</th>
                <th>Entidad</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th className="text-right">Estudiantes</th>
              </tr>
            </thead>
            <tbody>
              {state.estrategias.map((est) => {
                const ent = entidadesById.get(est.entidadId);
                const locked = est.estado === 'CON_ESTUDIANTES';
                return (
                  <tr key={est.id}>
                    <td className="sses-mono text-xs text-[#0284C7]">
                      {est.id}
                    </td>
                    <td className="font-medium text-[#0F172A]">{est.nombre}</td>
                    <td className="text-[#64748B]">
                      {ent?.nombre ?? est.entidadId}
                    </td>
                    <td className="sses-mono text-xs text-[#64748B]">
                      {est.fechaInicio} → {est.fechaFin}
                    </td>
                    <td>
                      <StatusBadge tone={locked ? 'danger' : 'info'}>
                        {locked ? 'Bloqueada' : 'Editable'}
                      </StatusBadge>
                    </td>
                    <td className="text-right sses-mono text-[#0F172A]">
                      {est.estudianteIds.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Masked Students Table (Ley 1581) */}
      <section className="sses-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-[#0F172A]">Estudiantes</h2>
          <StatusBadge tone="success" mono>
            Ley 1581 · {state.estudiantes.length}
          </StatusBadge>
        </div>
        <div className="overflow-x-auto">
          <table className="sses-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Nombre</th>
                <th>Grado</th>
                <th>Entidad</th>
              </tr>
            </thead>
            <tbody>
              {state.estudiantes.map((est) => (
                <tr key={est.id}>
                  <td className="sses-mono text-xs text-[#059669]">
                    {enmascararDocumentoLey1581(
                      est.tipoDocumento,
                      est.numeroDocumento
                    )}
                  </td>
                  <td className="font-medium text-[#0F172A]">
                    {est.nombreCompleto}
                  </td>
                  <td className="sses-mono text-xs text-[#64748B]">
                    {est.grado}
                  </td>
                  <td className="text-[#64748B]">
                    {entidadesById.get(est.entidadId)?.nombre ?? est.entidadId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Masked Teachers & Tutors Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="sses-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#0F172A]">Docentes</h2>
            <span className="sses-mono text-xs text-[#64748B]">
              {state.docentes.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="sses-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Nombre</th>
                  <th>Área</th>
                </tr>
              </thead>
              <tbody>
                {state.docentes.map((doc) => (
                  <tr key={doc.id}>
                    <td className="sses-mono text-xs text-[#059669]">
                      {enmascararDocumentoLey1581(
                        doc.tipoDocumento,
                        doc.numeroDocumento
                      )}
                    </td>
                    <td className="font-medium text-[#0F172A]">
                      {doc.nombreCompleto}
                    </td>
                    <td className="text-[#64748B]">{doc.area}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="sses-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#0F172A]">Tutores</h2>
            <span className="sses-mono text-xs text-[#64748B]">
              {state.tutores.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="sses-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Nombre</th>
                  <th>Zona</th>
                </tr>
              </thead>
              <tbody>
                {state.tutores.map((tut) => (
                  <tr key={tut.id}>
                    <td className="sses-mono text-xs text-[#059669]">
                      {enmascararDocumentoLey1581(
                        tut.tipoDocumento,
                        tut.numeroDocumento
                      )}
                    </td>
                    <td className="font-medium text-[#0F172A]">
                      {tut.nombreCompleto}
                    </td>
                    <td className="text-[#64748B]">{tut.zonaAsignada}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Read-only Follow-ups Summary */}
      <section className="sses-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#0F172A]">
            Acompañamientos
          </h2>
          <span className="sses-mono text-xs text-[#64748B]">
            {state.acompanamientos.length}
          </span>
        </div>
        <div className="divide-y divide-[#E5E7EB]">
          {state.acompanamientos.map((acomp) => {
            const est = estrategiasById.get(acomp.estrategiaId);
            const tut = tutoresById.get(acomp.tutorId);
            return (
              <div key={acomp.id} className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="sses-mono text-[#0284C7]">{acomp.id}</span>
                    <span className="text-sm font-medium text-[#0F172A]">
                      {est?.nombre ?? acomp.estrategiaId}
                    </span>
                    <span className="sses-mono text-[#64748B]">
                      · {acomp.mes}
                    </span>
                  </div>
                  <div className="text-[#64748B]">
                    {tut?.nombreCompleto} (
                    <span className="sses-mono text-[#059669]">
                      {tut
                        ? enmascararDocumentoLey1581(
                            tut.tipoDocumento,
                            tut.numeroDocumento
                          )
                        : ''}
                    </span>
                    ) ·{' '}
                    {acomp.modalidad === 'INDIVIDUAL' ? 'Individual' : 'Grupal'}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {acomp.semanas.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#0F172A]">
                          S{s.numeroSemana}
                        </span>
                        <StatusBadge
                          tone={
                            s.estado === 'REALIZADO'
                              ? 'success'
                              : s.estado === 'NO_REALIZADO'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {s.estado === 'REALIZADO'
                            ? 'Realizado'
                            : s.estado === 'NO_REALIZADO'
                            ? 'No realizado'
                            : 'Pendiente'}
                        </StatusBadge>
                      </div>
                      {s.motivoNoRealizado && (
                        <p className="text-[11px] text-[#64748B] leading-snug">
                          {s.motivoNoRealizado}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

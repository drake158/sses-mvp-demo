import React, { useMemo, useState } from 'react';
import { Download, Eye, ShieldCheck } from 'lucide-react';
import { useSses } from '../../context/SsesContext';
import {
  calcularKpisCumplimiento,
  enmascararDocumentoLey1581,
} from '../../utils/businessRules';
import { KpiDashboard } from '../common/KpiDashboard';
import { ReportReceiptCard } from '../common/ReportReceiptCard';

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
    <div className="space-y-6">
      {/* Read-Only & Ley 1581 Compliance Banner (4px Left Emerald Bar) */}
      <header className="gov-card border-l-4 border-l-[#065F46] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="gov-pill-success">
                <Eye className="w-3 h-3" />
                <span>Solo Lectura · Ley 1581 de 2012</span>
              </span>
              <span className="text-xs font-medium text-[#64748B]">
                Perfil 3 · Ente de Control
              </span>
            </div>
            <h1 className="text-2xl font-bold text-men-navy">
              Supervisión Institucional y Protección de Datos Personales
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl">
              Esta vista opera estrictamente en modo de{' '}
              <strong className="text-men-navy">solo lectura</strong> sin
              controles de modificación. Todos los números de documento visibles
              en pantalla y en los reportes de ley CSV se enmascaran
              automáticamente conservando solo los últimos 4 dígitos (ej.{' '}
              <code className="gov-mono text-[#065F46]">CC ******4821</code>).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadStatutoryCsv}
          disabled={isExporting}
          className="gov-btn-primary shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>
            {isExporting
              ? 'Generando CSV...'
              : 'Descargar Reporte de Ley CSV (SHA-256)'}
          </span>
        </button>
      </header>

      {/* Read-Only KPIs & Alerts */}
      <KpiDashboard
        kpis={kpis}
        titulo="Indicadores de Cumplimiento y Vigilancia (Solo Lectura)"
      />

      {/* Statutory Report Receipt */}
      <ReportReceiptCard
        constancias={constanciasControl}
        emptyMessage="Descargue el Reporte de Ley CSV para generar la constancia criptográfica SHA-256 con documentos enmascarados bajo Ley 1581."
      />

      {/* Read-only Strategies Summary Table */}
      <section className="gov-card overflow-hidden">
        <div className="px-6 py-4 bg-white border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-men-navy">
            Estrategias Estudiantiles Registradas ({state.estrategias.length})
          </h2>
          <span className="gov-pill-neutral">Consulta sin edición</span>
        </div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Estrategia</th>
                <th>Entidad Educativa</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th className="!text-right">Estudiantes</th>
              </tr>
            </thead>
            <tbody>
              {state.estrategias.map((est) => {
                const ent = entidadesById.get(est.entidadId);
                return (
                  <tr key={est.id}>
                    <td className="gov-mono text-xs font-semibold text-men-accent">
                      {est.id}
                    </td>
                    <td className="font-medium text-men-navy">{est.nombre}</td>
                    <td className="text-slate-600">
                      {ent?.nombre ?? est.entidadId} ({ent?.municipio})
                    </td>
                    <td className="gov-mono text-xs text-[#64748B]">
                      {est.fechaInicio} → {est.fechaFin}
                    </td>
                    <td>
                      <span
                        className={
                          est.estado === 'CON_ESTUDIANTES'
                            ? 'gov-pill-danger'
                            : 'gov-pill-info'
                        }
                      >
                        {est.estado}
                      </span>
                    </td>
                    <td className="text-right gov-mono font-semibold text-men-navy">
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
      <section className="gov-card overflow-hidden">
        <div className="px-6 py-4 bg-white border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-men-navy">
            Directorio de Estudiantes — Documentos Enmascarados (Ley 1581)
          </h2>
          <span className="gov-pill-success gov-mono">
            PII Protegida · {state.estudiantes.length} registros
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Documento (Ley 1581)</th>
                <th>Nombre Completo</th>
                <th>Grado</th>
                <th>Entidad Educativa</th>
              </tr>
            </thead>
            <tbody>
              {state.estudiantes.map((est) => (
                <tr key={est.id}>
                  <td className="gov-mono text-xs font-semibold text-[#065F46]">
                    {enmascararDocumentoLey1581(
                      est.tipoDocumento,
                      est.numeroDocumento
                    )}
                  </td>
                  <td className="font-medium text-slate-800">
                    {est.nombreCompleto}
                  </td>
                  <td className="gov-mono text-xs text-[#64748B]">
                    {est.grado}
                  </td>
                  <td className="text-slate-600">
                    {entidadesById.get(est.entidadId)?.nombre ?? est.entidadId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Masked Teachers & Tutors Tables (Ley 1581) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="gov-card overflow-hidden">
          <div className="px-6 py-4 bg-white border-b border-[#E2E8F0]">
            <h2 className="text-base font-bold text-men-navy">
              Docentes ({state.docentes.length}) · Enmascaramiento Ley 1581
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="gov-table">
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
                    <td className="gov-mono text-xs font-semibold text-[#065F46]">
                      {enmascararDocumentoLey1581(
                        doc.tipoDocumento,
                        doc.numeroDocumento
                      )}
                    </td>
                    <td className="font-medium text-slate-800">
                      {doc.nombreCompleto}
                    </td>
                    <td className="text-slate-600">{doc.area}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="gov-card overflow-hidden">
          <div className="px-6 py-4 bg-white border-b border-[#E2E8F0]">
            <h2 className="text-base font-bold text-men-navy">
              Tutores ({state.tutores.length}) · Enmascaramiento Ley 1581
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Nombre</th>
                  <th>Zona Asignada</th>
                </tr>
              </thead>
              <tbody>
                {state.tutores.map((tut) => (
                  <tr key={tut.id}>
                    <td className="gov-mono text-xs font-semibold text-[#065F46]">
                      {enmascararDocumentoLey1581(
                        tut.tipoDocumento,
                        tut.numeroDocumento
                      )}
                    </td>
                    <td className="font-medium text-slate-800">
                      {tut.nombreCompleto}
                    </td>
                    <td className="text-slate-600">{tut.zonaAsignada}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Read-only Follow-ups Summary */}
      <section className="gov-card overflow-hidden">
        <div className="px-6 py-4 bg-white border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-men-navy">
            Detalle de Acompañamientos y Seguimientos Semanales (Solo Lectura)
          </h2>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {state.acompanamientos.map((acomp) => {
            const est = estrategiasById.get(acomp.estrategiaId);
            const tut = tutoresById.get(acomp.tutorId);
            return (
              <div key={acomp.id} className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="gov-mono font-semibold text-men-accent">
                      {acomp.id}
                    </span>
                    <span className="font-semibold text-men-navy text-sm">
                      {est?.nombre ?? acomp.estrategiaId}
                    </span>
                    <span className="gov-mono text-[#64748B]">
                      · Mes {acomp.mes}
                    </span>
                  </div>
                  <div className="text-[#64748B]">
                    Tutor: {tut?.nombreCompleto} (
                    <span className="gov-mono text-[#065F46]">
                      {tut
                        ? enmascararDocumentoLey1581(
                            tut.tipoDocumento,
                            tut.numeroDocumento
                          )
                        : ''}
                    </span>
                    ) · {acomp.modalidad}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {acomp.semanas.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-xs font-bold text-men-navy">
                          Semana {s.numeroSemana}
                        </span>
                        <span
                          className={
                            s.estado === 'REALIZADO'
                              ? 'gov-pill-success'
                              : s.estado === 'NO_REALIZADO'
                              ? 'gov-pill-danger'
                              : 'gov-pill-warning'
                          }
                        >
                          {s.estado}
                        </span>
                      </div>
                      {s.motivoNoRealizado && (
                        <p className="text-[11px] text-slate-600 leading-snug">
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

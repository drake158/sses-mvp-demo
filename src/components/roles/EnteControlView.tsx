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
    <div className="space-y-7">
      {/* Read-Only & Ley 1581 Compliance Banner */}
      <div className="bg-emerald-50 border-2 border-men-emerald rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-men-emerald shrink-0 mt-0.5" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-men-emerald">
                Perfil 3 · Ente de Control
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-men-emerald text-white text-[11px] font-bold">
                <Eye className="w-3 h-3" />
                <span>SOLO LECTURA · LEY 1581 DE 2012</span>
              </span>
            </div>
            <h1 className="text-xl font-bold text-men-navy mt-1">
              Supervisión Institucional y Protección de Datos Personales
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 mt-1">
              Esta vista opera estrictamente en modo de{' '}
              <strong>solo lectura</strong> sin controles de modificación. Todos
              los números de documento visibles en pantalla y en los reportes de
              ley CSV se enmascaran automáticamente mostrando únicamente los
              últimos 4 dígitos (ej. <code>CC ******4821</code>).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadStatutoryCsv}
          disabled={isExporting}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-men-emerald hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-colors shrink-0 disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          <span>
            {isExporting
              ? 'Generando CSV...'
              : 'Descargar Reporte de Ley CSV (SHA-256)'}
          </span>
        </button>
      </div>

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

      {/* Read-only Strategies Summary */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-men-navy text-white flex items-center justify-between">
          <h2 className="text-sm font-bold">
            Estrategias Estudiantiles Registradas ({state.estrategias.length})
          </h2>
          <span className="text-[11px] text-sky-200">Consulta sin edición</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 text-left font-bold">ID</th>
                <th className="px-4 py-3 text-left font-bold">Estrategia</th>
                <th className="px-4 py-3 text-left font-bold">Entidad Educativa</th>
                <th className="px-4 py-3 text-left font-bold">Vigencia</th>
                <th className="px-4 py-3 text-left font-bold">Estado</th>
                <th className="px-4 py-3 text-right font-bold">Estudiantes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.estrategias.map((est) => {
                const ent = entidadesById.get(est.entidadId);
                return (
                  <tr key={est.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono font-bold text-men-navy">
                      {est.id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {est.nombre}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {ent?.nombre ?? est.entidadId} ({ent?.municipio})
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {est.fechaInicio} → {est.fechaFin}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          est.estado === 'CON_ESTUDIANTES'
                            ? 'bg-emerald-50 text-men-emerald border border-emerald-200'
                            : 'bg-blue-50 text-men-blue border border-blue-200'
                        }`}
                      >
                        {est.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-men-navy">
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
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-men-navy">
            Directorio de Estudiantes — Documentos Enmascarados (Ley 1581)
          </h2>
          <span className="text-[11px] font-semibold text-men-emerald">
            PII Protegida ({state.estudiantes.length} registros)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 text-left font-bold">
                  Documento (Ley 1581)
                </th>
                <th className="px-4 py-3 text-left font-bold">
                  Nombre Completo
                </th>
                <th className="px-4 py-3 text-left font-bold">Grado</th>
                <th className="px-4 py-3 text-left font-bold">Entidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.estudiantes.map((est) => (
                <tr key={est.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-mono font-bold text-men-emerald">
                    {enmascararDocumentoLey1581(
                      est.tipoDocumento,
                      est.numeroDocumento
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {est.nombreCompleto}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{est.grado}</td>
                  <td className="px-4 py-2.5 text-slate-600">
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
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-bold text-men-navy">
              Docentes ({state.docentes.length}) · Enmascaramiento Ley 1581
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left font-bold">Documento</th>
                  <th className="px-4 py-2.5 text-left font-bold">Nombre</th>
                  <th className="px-4 py-2.5 text-left font-bold">Área</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.docentes.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-4 py-2.5 font-mono font-bold text-men-emerald">
                      {enmascararDocumentoLey1581(
                        doc.tipoDocumento,
                        doc.numeroDocumento
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-800">
                      {doc.nombreCompleto}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{doc.area}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-bold text-men-navy">
              Tutores ({state.tutores.length}) · Enmascaramiento Ley 1581
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left font-bold">Documento</th>
                  <th className="px-4 py-2.5 text-left font-bold">Nombre</th>
                  <th className="px-4 py-2.5 text-left font-bold">Zona</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.tutores.map((tut) => (
                  <tr key={tut.id}>
                    <td className="px-4 py-2.5 font-mono font-bold text-men-emerald">
                      {enmascararDocumentoLey1581(
                        tut.tipoDocumento,
                        tut.numeroDocumento
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-800">
                      {tut.nombreCompleto}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {tut.zonaAsignada}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Read-only Follow-ups Summary */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-bold text-men-navy">
            Detalle de Acompañamientos y Seguimientos Semanales (Solo Lectura)
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {state.acompanamientos.map((acomp) => {
            const est = estrategiasById.get(acomp.estrategiaId);
            const tut = tutoresById.get(acomp.tutorId);
            return (
              <div key={acomp.id} className="p-4 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-men-navy">
                      {acomp.id}
                    </span>{' '}
                    ·{' '}
                    <span className="font-semibold text-slate-800">
                      {est?.nombre ?? acomp.estrategiaId}
                    </span>{' '}
                    · <span className="text-slate-500">Mes {acomp.mes}</span>
                  </div>
                  <div className="text-slate-600">
                    Tutor: {tut?.nombreCompleto} (
                    {tut
                      ? enmascararDocumentoLey1581(
                          tut.tipoDocumento,
                          tut.numeroDocumento
                        )
                      : ''}
                    ) · {acomp.modalidad}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {acomp.semanas.map((s) => (
                    <div
                      key={s.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200"
                    >
                      <div className="font-bold text-men-navy">
                        Semana {s.numeroSemana}
                      </div>
                      <div
                        className={`text-[11px] font-bold mt-0.5 ${
                          s.estado === 'REALIZADO'
                            ? 'text-men-emerald'
                            : s.estado === 'NO_REALIZADO'
                            ? 'text-men-red'
                            : 'text-men-amber'
                        }`}
                      >
                        {s.estado}
                      </div>
                      {s.motivoNoRealizado && (
                        <p className="text-[10px] text-slate-600 mt-1">
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

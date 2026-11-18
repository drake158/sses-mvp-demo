import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { KpiResumen } from '../../types/sses';

interface KpiDashboardProps {
  kpis: KpiResumen;
  titulo?: string;
}

export const KpiDashboard: React.FC<KpiDashboardProps> = ({
  kpis,
  titulo = 'Tablero de Cumplimiento y Alertas de Atraso',
}) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-men-navy">{titulo}</h2>
        <span className="text-xs text-slate-500">
          {kpis.totalSemanas} semanas totales monitoreadas
        </span>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <span>Estrategias Totales</span>
            <ClipboardList className="w-4 h-4 text-men-navy" />
          </div>
          <div className="mt-2 text-3xl font-bold text-men-navy">
            {kpis.totalEstrategias}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            <span className="font-semibold text-men-emerald">
              {kpis.estrategiasConEstudiantes}
            </span>{' '}
            con estudiantes ·{' '}
            <span className="font-semibold text-men-blue">
              {kpis.estrategiasSinEstudiantes}
            </span>{' '}
            sin estudiantes
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <span>Estudiantes Vinculados</span>
            <Users className="w-4 h-4 text-men-blue" />
          </div>
          <div className="mt-2 text-3xl font-bold text-men-navy">
            {kpis.totalEstudiantesVinculados}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            En estrategias activas del catálogo MEN
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <span>Cumplimiento Semanal</span>
            <TrendingUp className="w-4 h-4 text-men-emerald" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-men-emerald">
              {kpis.porcentajeCumplimiento}%
            </span>
            <span className="text-xs text-slate-500">
              ({kpis.semanasRealizadas}/{kpis.totalSemanas})
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-men-emerald h-2 rounded-full transition-all"
              style={{ width: `${kpis.porcentajeCumplimiento}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <span>Alertas de Atraso</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                kpis.totalAlertas > 0 ? 'text-men-red' : 'text-men-emerald'
              }`}
            />
          </div>
          <div
            className={`mt-2 text-3xl font-bold ${
              kpis.totalAlertas > 0 ? 'text-men-red' : 'text-men-emerald'
            }`}
          >
            {kpis.totalAlertas}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            {kpis.semanasNoRealizadas} no realizadas · {kpis.semanasPendientes}{' '}
            pendientes
          </div>
        </div>
      </div>

      {/* Delay Alerts List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-sm font-bold text-men-navy">
            Listado de Alertas de Atraso y Novedades
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              kpis.totalAlertas > 0
                ? 'bg-red-50 text-men-red border border-red-200'
                : 'bg-emerald-50 text-men-emerald border border-emerald-200'
            }`}
          >
            {kpis.totalAlertas === 0
              ? 'Sin alertas críticas'
              : `${kpis.totalAlertas} alerta(s) activa(s)`}
          </span>
        </div>

        {kpis.alertas.length === 0 ? (
          <div className="p-5 flex items-center gap-3 text-sm text-men-emerald">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>
              Todas las semanas de seguimiento se encuentran al día sin atrasos
              ni novedades pendientes.
            </span>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {kpis.alertas.map((alerta) => {
              const isCritical = alerta.severidad === 'CRITICA';
              return (
                <li
                  key={alerta.id}
                  className="px-4 py-3 flex items-start gap-3 text-sm"
                >
                  {isCritical ? (
                    <AlertCircle className="w-4 h-4 text-men-red mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-men-amber mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-men-navy">
                        {alerta.estrategiaNombre}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isCritical
                            ? 'bg-red-50 text-men-red border border-red-200'
                            : 'bg-amber-50 text-men-amber border border-amber-200'
                        }`}
                      >
                        {isCritical ? 'ATRASO CRÍTICO' : 'NOVEDAD / ALERTA'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {alerta.detalle}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 shrink-0">
                    {alerta.fechaReferencia}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

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
    <section className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-men-navy">{titulo}</h2>
        <span className="gov-mono text-xs text-[#64748B]">
          {kpis.totalSemanas} semanas monitoreadas
        </span>
      </div>

      {/* 4 KPI Cards — 8pt Grid (p-6, gap-6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="gov-card p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#64748B]">
              Estrategias
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] text-men-navy flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-heading text-3xl font-bold text-men-navy tabular-nums">
              {kpis.totalEstrategias}
            </div>
            <div className="mt-1.5 text-xs text-[#64748B] flex items-center gap-2">
              <span className="font-medium text-[#065F46]">
                {kpis.estrategiasConEstudiantes} activas
              </span>
              <span>·</span>
              <span className="font-medium text-men-accent">
                {kpis.estrategiasSinEstudiantes} editables
              </span>
            </div>
          </div>
        </div>

        <div className="gov-card p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#64748B]">
              Estudiantes
            </span>
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-men-accent flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-heading text-3xl font-bold text-men-navy tabular-nums">
              {kpis.totalEstudiantesVinculados}
            </div>
            <div className="mt-1.5 text-xs text-[#64748B]">
              Vinculados en estrategias MEN
            </div>
          </div>
        </div>

        <div className="gov-card p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#64748B]">
              Cumplimiento
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] text-[#065F46] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-3xl font-bold text-[#065F46] tabular-nums">
                {kpis.porcentajeCumplimiento}%
              </span>
              <span className="gov-mono text-xs text-[#64748B]">
                ({kpis.semanasRealizadas}/{kpis.totalSemanas})
              </span>
            </div>
            <div className="mt-2.5 w-full bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#065F46] h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${kpis.porcentajeCumplimiento}%` }}
              />
            </div>
          </div>
        </div>

        <div className="gov-card p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#64748B]">
              Alertas
            </span>
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                kpis.totalAlertas > 0
                  ? 'bg-[#FEF2F2] text-[#991B1B]'
                  : 'bg-[#ECFDF5] text-[#065F46]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`font-heading text-3xl font-bold tabular-nums ${
                kpis.totalAlertas > 0 ? 'text-[#991B1B]' : 'text-[#065F46]'
              }`}
            >
              {kpis.totalAlertas}
            </div>
            <div className="mt-1.5 text-xs text-[#64748B]">
              {kpis.semanasNoRealizadas} no realizadas · {kpis.semanasPendientes}{' '}
              pendientes
            </div>
          </div>
        </div>
      </div>

      {/* Delay Alerts List */}
      <div className="gov-card overflow-hidden">
        <div className="px-6 py-4 bg-[#F1F5F9] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#64748B]">
            Alertas de Atraso y Novedades Operativas
          </h3>
          <span
            className={
              kpis.totalAlertas > 0 ? 'gov-pill-danger' : 'gov-pill-success'
            }
          >
            {kpis.totalAlertas === 0
              ? 'Sin alertas críticas'
              : `${kpis.totalAlertas} alerta(s) activa(s)`}
          </span>
        </div>

        {kpis.alertas.length === 0 ? (
          <div className="p-6 flex items-center gap-3 text-sm text-[#065F46]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>
              Todas las semanas de seguimiento se encuentran al día sin atrasos
              ni novedades pendientes.
            </span>
          </div>
        ) : (
          <ul className="divide-y divide-[#E2E8F0]">
            {kpis.alertas.map((alerta) => {
              const isCritical = alerta.severidad === 'CRITICA';
              return (
                <li
                  key={alerta.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-3 transition-colors duration-150 hover:bg-[#F8FAFC]"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {isCritical ? (
                      <AlertCircle className="w-4 h-4 text-[#991B1B] mt-1 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-[#92400E] mt-1 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm text-men-navy">
                          {alerta.estrategiaNombre}
                        </span>
                        <span
                          className={
                            isCritical ? 'gov-pill-danger' : 'gov-pill-warning'
                          }
                        >
                          {isCritical ? 'Atraso crítico' : 'Novedad'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {alerta.detalle}
                      </p>
                    </div>
                  </div>
                  <span className="gov-mono text-xs text-[#64748B] shrink-0 pl-7 sm:pl-0">
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

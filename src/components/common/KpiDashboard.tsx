import React from 'react';
import {
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { KpiResumen } from '../../types/sses';
import { StatusBadge } from './StatusBadge';

interface KpiDashboardProps {
  kpis: KpiResumen;
}

export const KpiDashboard: React.FC<KpiDashboardProps> = ({ kpis }) => {
  return (
    <section aria-label="Indicadores de cumplimiento" className="space-y-6">
      {/* 4 Direct KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="sses-card p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">
              Estrategias
            </span>
            <ClipboardList
              aria-hidden="true"
              className="h-4 w-4 text-[#64748B]"
              strokeWidth={1.5}
            />
          </div>
          <div>
            <div className="sses-kpi-value text-3xl text-[#0F172A]">
              {kpis.totalEstrategias}
            </div>
            <div className="mt-1.5 text-xs text-[#64748B]">
              {kpis.estrategiasConEstudiantes} bloqueadas ·{' '}
              {kpis.estrategiasSinEstudiantes} editables
            </div>
          </div>
        </div>

        <div className="sses-card p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">
              Estudiantes
            </span>
            <Users
              aria-hidden="true"
              className="h-4 w-4 text-[#64748B]"
              strokeWidth={1.5}
            />
          </div>
          <div>
            <div className="sses-kpi-value text-3xl text-[#0F172A]">
              {kpis.totalEstudiantesVinculados}
            </div>
            <div className="mt-1.5 text-xs text-[#64748B]">Vinculados</div>
          </div>
        </div>

        <div className="sses-card p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">
              Cumplimiento
            </span>
            <TrendingUp
              aria-hidden="true"
              className="h-4 w-4 text-[#64748B]"
              strokeWidth={1.5}
            />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="sses-kpi-value text-3xl text-[#0F172A]">
                {kpis.porcentajeCumplimiento}%
              </span>
              <span className="sses-mono text-xs text-[#64748B]">
                {kpis.semanasRealizadas}/{kpis.totalSemanas}
              </span>
            </div>
            <div className="mt-2.5 h-1 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
              <div
                className="h-1 rounded-full bg-[#1E3A8A] transition-all duration-300"
                style={{ width: `${kpis.porcentajeCumplimiento}%` }}
              />
            </div>
          </div>
        </div>

        <div className="sses-card p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Alertas</span>
            <AlertTriangle
              aria-hidden="true"
              className="h-4 w-4 text-[#64748B]"
              strokeWidth={1.5}
            />
          </div>
          <div>
            <div className="sses-kpi-value text-3xl text-[#0F172A]">
              {kpis.totalAlertas}
            </div>
            <div className="mt-1.5 text-xs text-[#64748B]">
              {kpis.semanasNoRealizadas} no realizadas · {kpis.semanasPendientes}{' '}
              pendientes
            </div>
          </div>
        </div>
      </div>

      {/* Concise Alerts List */}
      <div className="sses-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-[#0F172A]">Alertas</h2>
          <StatusBadge tone={kpis.totalAlertas > 0 ? 'danger' : 'success'}>
            {kpis.totalAlertas === 0 ? 'Al día' : `${kpis.totalAlertas} activas`}
          </StatusBadge>
        </div>

        {kpis.alertas.length === 0 ? (
          <div className="px-6 py-5 text-xs text-[#64748B]">
            Sin atrasos ni novedades.
          </div>
        ) : (
          <ul className="divide-y divide-[#E5E7EB]">
            {kpis.alertas.map((alerta) => {
              const isCritical = alerta.severidad === 'CRITICA';
              return (
                <li
                  key={alerta.id}
                  className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors duration-150 hover:bg-[#FAFAFA]"
                >
                  <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                    <StatusBadge tone={isCritical ? 'danger' : 'warning'}>
                      {isCritical ? 'Crítica' : 'Novedad'}
                    </StatusBadge>
                    <span className="text-sm font-medium text-[#0F172A] truncate">
                      {alerta.estrategiaNombre}
                    </span>
                    <span className="text-xs text-[#64748B] truncate">
                      {alerta.detalle}
                    </span>
                  </div>
                  <span className="sses-mono text-xs text-[#64748B] shrink-0">
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

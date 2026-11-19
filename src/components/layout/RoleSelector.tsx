import React from 'react';
import {
  ArrowUpRight,
  Building2,
  FileSearch,
  GraduationCap,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useSses } from '../../context/SsesContext';
import type { RolUsuario } from '../../types/sses';
import { AccessibilityMenu } from '../common/AccessibilityMenu';
import { StatusBadge } from '../common/StatusBadge';

interface RoleCardConfig {
  rol: RolUsuario;
  titulo: string;
  frase: string;
  icon: LucideIcon;
}

const ROLE_CARDS: RoleCardConfig[] = [
  {
    rol: 'FUNCIONARIO_MEN',
    titulo: 'Funcionario MEN',
    frase: 'Gestión de estrategias y vinculación estudiantil',
    icon: Building2,
  },
  {
    rol: 'TUTOR',
    titulo: 'Tutor Territorial',
    frase: 'Acompañamiento mensual y operación offline',
    icon: GraduationCap,
  },
  {
    rol: 'ENTE_CONTROL',
    titulo: 'Ente de Control',
    frase: 'Supervisión solo lectura · Ley 1581',
    icon: ShieldCheck,
  },
  {
    rol: 'OFICINA_TECNOLOGIA',
    titulo: 'Oficina de Tecnología',
    frase: 'Auditoría inmutable y cadena SHA-256',
    icon: FileSearch,
  },
];

export const RoleSelector: React.FC = () => {
  const { state, seleccionarRol } = useSses();

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Minimal Top Bar (56px) */}
      <header className="h-14 border-b border-[#E5E7EB] bg-white">
        <div className="max-w-[960px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-heading text-sm font-semibold tracking-[-0.025em] text-[#1E3A8A]">
              SSES · MEN
            </span>
            {state.isOffline && (
              <StatusBadge tone="warning" mono>
                Offline ({state.offlineQueue.length})
              </StatusBadge>
            )}
          </div>
          <AccessibilityMenu />
        </div>
      </header>

      {/* Centered Minimalist Grid (max-width: 960px) */}
      <main className="flex-1 w-full max-w-[960px] mx-auto px-4 sm:px-6 py-14 sm:py-20 flex flex-col justify-center">
        <div className="mb-10 space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-[#0F172A]">
            Seleccionar rol
          </h1>
          <p className="text-sm text-[#64748B]">
            Sistema de Seguimiento de Estrategias Estudiantiles
          </p>
        </div>

        <section
          aria-label="Roles disponibles"
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {ROLE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.rol}
                type="button"
                onClick={() => seleccionarRol(card.rol)}
                aria-label={`Ingresar como ${card.titulo}: ${card.frase}`}
                className="sses-card group p-6 text-left flex flex-col justify-between gap-6 transition-colors duration-150 hover:border-[#0284C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="h-10 w-10 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] text-[#1E3A8A] flex items-center justify-center transition-colors duration-150 group-hover:border-[#BAE6FD] group-hover:bg-[#F0F9FF] group-hover:text-[#0284C7]">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-4 w-4 text-[#94A3B8] transition-colors duration-150 group-hover:text-[#0284C7]"
                    strokeWidth={1.5}
                  />
                </div>

                <div className="space-y-1">
                  <div className="font-heading text-base font-medium text-[#0F172A] group-hover:text-[#1E3A8A] transition-colors duration-150">
                    {card.titulo}
                  </div>
                  <p className="text-sm text-[#64748B]">{card.frase}</p>
                </div>
              </button>
            );
          })}
        </section>
      </main>
    </div>
  );
};

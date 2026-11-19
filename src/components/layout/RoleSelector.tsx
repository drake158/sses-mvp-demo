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
import { StatusBadge } from '../common/StatusBadge';
import { GovTopBar } from './GovTopBar';

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
    <div className="min-h-screen bg-canvas flex flex-col transition-colors duration-150">
      {/* Sticky Institutional Stack: 36px GOV.CO Ribbon + 60px App Bar */}
      <header className="sticky top-0 z-30">
        <GovTopBar />
        <div className="h-[60px] bg-surface border-b border-border-subtle transition-colors duration-150">
          <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-heading text-sm font-semibold tracking-[-0.025em] text-brand-primary">
                SSES
              </span>
              <span aria-hidden="true" className="text-border-strong">
                ·
              </span>
              <span className="text-sm font-medium text-ink-secondary truncate">
                Sistema de Seguimiento
              </span>
            </div>

            <StatusBadge tone={state.isOffline ? 'warning' : 'success'}>
              {state.isOffline
                ? `Offline (${state.offlineQueue.length})`
                : 'En línea'}
            </StatusBadge>
          </div>
        </div>
      </header>

      {/* Centered Minimalist Grid (max-width: 960px) */}
      <main className="flex-1 w-full max-w-[960px] mx-auto px-4 sm:px-6 py-14 sm:py-20 flex flex-col justify-center">
        <div className="mb-10 space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-ink">
            Seleccionar rol
          </h1>
          <p className="text-sm text-ink-secondary">
            Seguimiento de Estrategias Estudiantiles
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
                className="sses-card group p-6 text-left flex flex-col justify-between gap-6 transition-colors duration-150 hover:border-brand-accent hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="h-10 w-10 rounded-lg border border-border-subtle bg-elevated text-brand-accent flex items-center justify-center transition-colors duration-150 group-hover:border-brand-border group-hover:bg-brand-soft">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-4 w-4 text-ink-secondary transition-colors duration-150 group-hover:text-brand-accent"
                    strokeWidth={1.5}
                  />
                </div>

                <div className="space-y-1">
                  <div className="font-heading text-base font-medium text-ink group-hover:text-brand-accent transition-colors duration-150">
                    {card.titulo}
                  </div>
                  <p className="text-sm text-ink-secondary">{card.frase}</p>
                </div>
              </button>
            );
          })}
        </section>
      </main>
    </div>
  );
};

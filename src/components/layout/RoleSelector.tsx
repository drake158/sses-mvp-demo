import React from 'react';
import {
  ArrowRight,
  Building2,
  Database,
  FileSearch,
  GraduationCap,
  Landmark,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { useSses } from '../../context/SsesContext';
import type { RolUsuario } from '../../types/sses';

interface RoleCardConfig {
  rol: RolUsuario;
  titulo: string;
  permisoBadge: string;
  pillClass: string;
  iconBgClass: string;
  icon: React.ComponentType<{ className?: string }>;
  descripcion: string;
  etiquetas: string[];
}

const ROLE_CARDS: RoleCardConfig[] = [
  {
    rol: 'FUNCIONARIO_MEN',
    titulo: 'Funcionario MEN',
    permisoBadge: 'Lectura y Escritura',
    pillClass: 'gov-pill-info',
    iconBgClass: 'bg-sky-50 text-men-navy border-sky-100',
    icon: Building2,
    descripcion:
      'Crea estrategias en entidades activas, vincula estudiantes con inmutabilidad automática y exporta reportes CSV con SHA-256.',
    etiquetas: ['Estrategias inmutables', 'Carga masiva', 'KPIs y CSV'],
  },
  {
    rol: 'TUTOR',
    titulo: 'Tutor Territorial',
    permisoBadge: 'Operación en Campo',
    pillClass: 'gov-pill-warning',
    iconBgClass: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    icon: GraduationCap,
    descripcion:
      'Registra acompañamientos individuales o grupales de 4 semanas y opera sin conexión con sincronización idempotente.',
    etiquetas: ['4 semanas automáticas', 'Modo Offline', 'Idempotency-Key'],
  },
  {
    rol: 'ENTE_CONTROL',
    titulo: 'Ente de Control',
    permisoBadge: 'Solo Lectura · Ley 1581',
    pillClass: 'gov-pill-success',
    iconBgClass: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
    icon: ShieldCheck,
    descripcion:
      'Supervisa cumplimiento en modo solo lectura con enmascaramiento PII Ley 1581 en pantalla y en reportes de ley CSV.',
    etiquetas: ['100% Solo Lectura', 'Máscara CC ******4821', 'Reporte de Ley'],
  },
  {
    rol: 'OFICINA_TECNOLOGIA',
    titulo: 'Oficina de Tecnología',
    permisoBadge: 'Auditoría SHA-256',
    pillClass: 'gov-pill-neutral',
    iconBgClass: 'bg-[#F1F5F9] text-men-navy border-[#E2E8F0]',
    icon: FileSearch,
    descripcion:
      'Inspecciona el audit_log inmutable con diferencias JSON y valida la cadena criptográfica SHA-256 desde el bloque génesis.',
    etiquetas: ['audit_log inmutable', 'JSON Antes/Después', 'Verificador SHA-256'],
  },
];

export const RoleSelector: React.FC = () => {
  const { state, seleccionarRol } = useSses();

  const entidadesActivas = state.entidades.filter(
    (e) => e.estado === 'ACTIVA'
  ).length;

  return (
    <div className="min-h-screen bg-men-bg flex flex-col">
      {/* Gov.co / MEN Institutional Top Ribbon */}
      <div className="bg-men-navy text-white">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium tracking-wide">
            <Landmark className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span className="truncate">
              República de Colombia · Ministerio de Educación Nacional
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-300 gov-mono text-[11px]">
            MVP Demo · Sin contraseñas
          </span>
        </div>
      </div>

      {/* Centered Editorial Welcome Layout */}
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-center">
        {/* Institutional Hero Header */}
        <header className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E2E8F0] shadow-gov-card text-xs font-medium text-men-navy">
            <span className="w-2 h-2 rounded-full bg-men-accent" />
            <span>SSES · Sistema de Seguimiento de Estrategias Estudiantiles</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-men-navy tracking-tight">
            Selector Interactivo de Rol
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Seleccione un perfil institucional para explorar los flujos
            operativos del Ministerio de Educación Nacional. Podrá cambiar de
            rol en cualquier momento conservando el estado de su sesión.
          </p>

          {/* Compact Telemetry Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="gov-pill-neutral gov-mono text-[11px]">
              {entidadesActivas} entidades activas ·{' '}
              {state.entidades.length - entidadesActivas} inactiva
            </span>
            <span className="gov-pill-neutral gov-mono text-[11px]">
              {state.estrategias.length} estrategias · {state.estudiantes.length}{' '}
              estudiantes
            </span>
            <span className="gov-pill-success gov-mono text-[11px]">
              {state.auditLog.length} eventos SHA-256
            </span>
            {state.isOffline && (
              <span className="gov-pill-warning gov-mono text-[11px]">
                <WifiOff className="w-3 h-3" />
                Sin conexión ({state.offlineQueue.length} en cola)
              </span>
            )}
          </div>
        </header>

        {/* Symmetrical 2x2 Role Grid (1 col on mobile, 2 cols on desktop) */}
        <section
          aria-label="Perfiles disponibles"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {ROLE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.rol}
                className="gov-card p-6 flex flex-col justify-between gap-6 transition-all duration-150 ease-in-out hover:-translate-y-0.5 hover:border-men-accent hover:shadow-gov-card-hover group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-150 ${card.iconBgClass}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-men-navy group-hover:text-men-accent transition-colors duration-150">
                          {card.titulo}
                        </h2>
                        <div className="mt-1">
                          <span className={card.pillClass}>
                            {card.permisoBadge}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-2 min-h-[2.75rem]">
                    {card.descripcion}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {card.etiquetas.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => seleccionarRol(card.rol)}
                  className="gov-btn-primary w-full group-hover:bg-men-navy-hover"
                >
                  <span>Ingresar como {card.titulo}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </button>
              </article>
            );
          })}
        </section>
      </main>

      {/* Clean Institutional Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-men-navy shrink-0" />
            <span>
              Persistencia local simulada · Web Crypto SHA-256 nativo · Datos
              sintéticos de Colombia
            </span>
          </div>
          <span className="gov-mono text-[11px]">SSES · MEN Colombia</span>
        </div>
      </footer>
    </div>
  );
};

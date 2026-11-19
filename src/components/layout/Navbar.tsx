import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileSearch,
  GraduationCap,
  RotateCcw,
  ShieldCheck,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useSses } from '../../context/SsesContext';
import type { RolUsuario } from '../../types/sses';

const ROLE_OPTIONS: Array<{
  rol: RolUsuario;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    rol: 'FUNCIONARIO_MEN',
    label: 'Funcionario MEN',
    shortLabel: 'MEN',
    icon: Building2,
  },
  {
    rol: 'TUTOR',
    label: 'Tutor',
    shortLabel: 'Tutor',
    icon: GraduationCap,
  },
  {
    rol: 'ENTE_CONTROL',
    label: 'Ente de Control',
    shortLabel: 'Control',
    icon: ShieldCheck,
  },
  {
    rol: 'OFICINA_TECNOLOGIA',
    label: 'Oficina de Tecnología',
    shortLabel: 'Auditoría',
    icon: FileSearch,
  },
];

export const Navbar: React.FC = () => {
  const {
    state,
    rolActivo,
    seleccionarRol,
    toggleModoOffline,
    restaurarDatosDeFabrica,
  } = useSses();

  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const handleToggleOffline = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      const syncResult = await toggleModoOffline();
      if (syncResult && syncResult.syncedCount > 0) {
        setBannerMessage(
          `Conexión restablecida: ${syncResult.syncedCount} operación(es) sincronizada(s) automáticamente sin duplicados.`
        );
        window.setTimeout(() => setBannerMessage(null), 5000);
      }
    } finally {
      setIsToggling(false);
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await restaurarDatosDeFabrica();
      setShowResetModal(false);
      setBannerMessage(
        'Datos de fábrica de Colombia restaurados correctamente con cadena SHA-256 íntegra.'
      );
      window.setTimeout(() => setBannerMessage(null), 4500);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        {/* Subtle 3px MEN Identity Accent Bar */}
        <div className="h-[3px] bg-men-navy w-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-[64px] py-2 lg:py-0 flex flex-wrap items-center justify-between gap-3">
            {/* Institutional Identity */}
            <button
              type="button"
              onClick={() => seleccionarRol(null)}
              className="flex items-center gap-3 text-left group focus:outline-none rounded-lg focus:ring-2 focus:ring-men-accent/40 pr-2"
              title="Volver al Selector Interactivo de Rol"
            >
              <div className="w-9 h-9 rounded-lg bg-men-navy text-white flex items-center justify-center font-heading font-bold text-xs tracking-tight transition-colors duration-150 group-hover:bg-men-navy-hover">
                MEN
              </div>
              <div className="leading-tight">
                <div className="font-heading text-sm font-bold text-men-navy tracking-tight">
                  SSES
                </div>
                <div className="text-[11px] text-[#64748B] hidden sm:block">
                  Ministerio de Educación
                </div>
              </div>
            </button>

            {/* Segmented Role Switcher */}
            <nav
              aria-label="Selector rápido de rol"
              className="order-3 lg:order-2 w-full lg:w-auto flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0] overflow-x-auto"
            >
              {ROLE_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isActive = rolActivo === item.rol;
                return (
                  <button
                    key={item.rol}
                    type="button"
                    onClick={() => seleccionarRol(item.rol)}
                    className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-150 ease-in-out ${
                      isActive
                        ? 'bg-men-navy text-white shadow-sm'
                        : 'text-slate-600 hover:text-men-navy hover:bg-white/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden xl:inline">{item.label}</span>
                    <span className="xl:hidden">{item.shortLabel}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Context Controls: Segmented Network Status + Factory Reset */}
            <div className="order-2 lg:order-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleOffline}
                disabled={isToggling}
                aria-pressed={state.isOffline}
                title="Cambiar estado de conectividad (En línea / Sin conexión)"
                className="inline-flex items-center p-1 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] transition-all duration-150 ease-in-out hover:border-men-accent focus:outline-none focus:ring-2 focus:ring-men-accent/30 disabled:opacity-60"
              >
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                    !state.isOffline
                      ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] shadow-sm'
                      : 'text-[#64748B] border border-transparent'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>En línea</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                    state.isOffline
                      ? 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] shadow-sm'
                      : 'text-[#64748B] border border-transparent'
                  }`}
                >
                  <WifiOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sin conexión</span>
                  {state.offlineQueue.length > 0 && (
                    <span className="gov-mono ml-0.5 px-1.5 py-0.2 rounded-full bg-[#92400E] text-white text-[10px] font-semibold">
                      {state.offlineQueue.length}
                    </span>
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white text-slate-700 border border-[#E2E8F0] hover:border-men-accent hover:text-men-accent transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-men-accent/30"
                title="Restaurar datos de fábrica"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Restaurar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Soft-Pastel Sync / Reset Notification Strip */}
        {bannerMessage && (
          <div className="bg-[#ECFDF5] text-[#065F46] border-t border-[#A7F3D0] text-xs font-medium px-4 py-2.5">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#065F46]" />
                <span>{bannerMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setBannerMessage(null)}
                className="text-[#065F46]/70 hover:text-[#065F46] transition-colors"
                aria-label="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Factory Reset Confirmation Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4 transition-opacity duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
        >
          <div className="gov-card max-w-md w-full overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h2
                  id="reset-modal-title"
                  className="text-base font-bold text-men-navy"
                >
                  Restaurar datos de fábrica
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-600">
              <p>
                Esta acción restablecerá el escenario demostrativo a los datos
                sintéticos iniciales del Ministerio de Educación Nacional:
              </p>
              <ul className="space-y-2 text-xs text-slate-600 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-men-navy mt-1.5 shrink-0" />
                  <span>
                    Reinicia estrategias, vinculaciones, acompañamientos y
                    reportes al estado base.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-men-navy mt-1.5 shrink-0" />
                  <span>
                    Limpia la cola sin conexión y restablece el modo{' '}
                    <strong className="text-slate-800">En línea</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-men-navy mt-1.5 shrink-0" />
                  <span>
                    Regenera el <code className="gov-mono">audit_log</code> con
                    una cadena SHA-256 íntegra desde el bloque génesis.
                  </span>
                </li>
              </ul>
            </div>

            <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="gov-btn-secondary text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#991B1B] hover:bg-red-900 transition-colors duration-150 disabled:opacity-60"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  {isResetting ? 'Restaurando...' : 'Confirmar restauración'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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
      <header className="sticky top-0 z-30 bg-men-navy text-white shadow-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            {/* Brand / Home to Role Selector */}
            <button
              type="button"
              onClick={() => seleccionarRol(null)}
              className="flex items-center gap-3 text-left group focus:outline-none"
              title="Volver al Selector Interactivo de Rol"
            >
              <div className="w-9 h-9 rounded-lg bg-men-blue flex items-center justify-center font-bold text-sm tracking-tight shadow-sm group-hover:bg-[#0052A3] transition-colors">
                MEN
              </div>
              <div>
                <div className="text-sm font-bold leading-tight tracking-tight">
                  SSES · MVP Demo
                </div>
                <div className="text-[11px] text-slate-300 leading-tight">
                  Ministerio de Educación Nacional
                </div>
              </div>
            </button>

            {/* Quick Role Switcher */}
            <nav
              aria-label="Selector rápido de rol"
              className="flex items-center gap-1 bg-white/10 p-1 rounded-lg overflow-x-auto max-w-full"
            >
              {ROLE_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isActive = rolActivo === item.rol;
                return (
                  <button
                    key={item.rol}
                    type="button"
                    onClick={() => seleccionarRol(item.rol)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-men-blue text-white shadow-sm'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">{item.label}</span>
                    <span className="lg:hidden">{item.shortLabel}</span>
                  </button>
                );
              })}
            </nav>

            {/* Connectivity Toggle + Factory Reset */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleOffline}
                disabled={isToggling}
                aria-pressed={state.isOffline}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  state.isOffline
                    ? 'bg-men-amber text-white border-amber-400 hover:bg-amber-600'
                    : 'bg-men-emerald text-white border-emerald-400 hover:bg-emerald-700'
                }`}
                title="Simular cambio de conectividad En línea / Sin conexión"
              >
                {state.isOffline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Sin conexión</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5" />
                    <span>En línea</span>
                  </>
                )}
                {state.offlineQueue.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-white text-men-navy text-[10px] font-bold">
                    {state.offlineQueue.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
                title="Restaurar datos de fábrica"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  Restaurar datos de fábrica
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Sync / Reset Notification Strip */}
        {bannerMessage && (
          <div className="bg-men-emerald text-white text-xs font-medium px-4 py-2 border-t border-white/15">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{bannerMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setBannerMessage(null)}
                className="text-white/80 hover:text-white"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
        >
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-men-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <h2 id="reset-modal-title" className="text-base font-bold">
                  Restaurar datos de fábrica
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-slate-300 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-sm text-slate-700">
              <p>
                Esta acción restablecerá completamente el escenario demostrativo
                a los datos sintéticos iniciales de Colombia:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                <li>
                  Reinicia estrategias, vinculaciones, acompañamientos y reportes
                  al estado base.
                </li>
                <li>
                  Limpia cualquier operación pendiente en la cola sin conexión y
                  restablece el modo <strong>En línea</strong>.
                </li>
                <li>
                  Regenera el <code>audit_log</code> con una cadena criptográfica
                  SHA-256 íntegra desde el registro génesis.
                </li>
              </ul>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-men-red hover:bg-red-700 disabled:opacity-60"
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

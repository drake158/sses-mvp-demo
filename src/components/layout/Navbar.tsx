import React, { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Check,
  ChevronDown,
  FileSearch,
  GraduationCap,
  RotateCcw,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useSses } from '../../context/SsesContext';
import type { RolUsuario } from '../../types/sses';
import { AccessibilityMenu } from '../common/AccessibilityMenu';

const ROLE_OPTIONS: Array<{
  rol: RolUsuario;
  label: string;
  icon: LucideIcon;
}> = [
  { rol: 'FUNCIONARIO_MEN', label: 'Funcionario MEN', icon: Building2 },
  { rol: 'TUTOR', label: 'Tutor Territorial', icon: GraduationCap },
  { rol: 'ENTE_CONTROL', label: 'Ente de Control', icon: ShieldCheck },
  { rol: 'OFICINA_TECNOLOGIA', label: 'Oficina de Tecnología', icon: FileSearch },
];

export const Navbar: React.FC = () => {
  const {
    state,
    rolActivo,
    seleccionarRol,
    toggleModoOffline,
    restaurarDatosDeFabrica,
  } = useSses();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roleMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRoleMenuOpen(false);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(e.target as Node)
      ) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [roleMenuOpen]);

  useEffect(() => {
    if (!showResetModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isResetting) setShowResetModal(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showResetModal, isResetting]);

  const activeRoleConfig =
    ROLE_OPTIONS.find((r) => r.rol === rolActivo) ?? ROLE_OPTIONS[0];
  const ActiveRoleIcon = activeRoleConfig.icon;

  const handleToggleOffline = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      const syncResult = await toggleModoOffline();
      if (syncResult && syncResult.syncedCount > 0) {
        setBannerMessage(
          `En línea · ${syncResult.syncedCount} operación(es) sincronizada(s)`
        );
        window.setTimeout(() => setBannerMessage(null), 4500);
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
      setBannerMessage('Datos iniciales restaurados · Cadena SHA-256 íntegra');
      window.setTimeout(() => setBannerMessage(null), 4000);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          {/* Left: Compact Logo + Clean Role Dropdown */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => seleccionarRol(null)}
              aria-label="Volver al selector de rol"
              title="Selector de rol"
              className="font-heading text-sm font-semibold tracking-[-0.025em] text-[#1E3A8A] hover:text-[#0284C7] transition-colors duration-150 rounded px-1 py-0.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
            >
              SSES · MEN
            </button>

            <span
              aria-hidden="true"
              className="h-4 w-px bg-[#E5E7EB] shrink-0"
            />

            {/* Role Dropdown */}
            <div ref={roleDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={roleMenuOpen}
                aria-label="Cambiar rol activo"
                className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0F172A] hover:bg-[#FAFAFA] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:ring-offset-2"
              >
                <ActiveRoleIcon
                  className="h-3.5 w-3.5 text-[#64748B] shrink-0"
                  strokeWidth={1.5}
                />
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {activeRoleConfig.label}
                </span>
                <ChevronDown
                  className="h-3.5 w-3.5 text-[#64748B] shrink-0"
                  strokeWidth={1.5}
                />
              </button>

              {roleMenuOpen && (
                <div
                  role="menu"
                  aria-label="Seleccionar perfil"
                  className="absolute left-0 mt-2 w-56 rounded-xl border border-[#E5E7EB] bg-white p-1.5 z-50"
                >
                  {ROLE_OPTIONS.map((item) => {
                    const Icon = item.icon;
                    const isActive = rolActivo === item.rol;
                    return (
                      <button
                        key={item.rol}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isActive}
                        onClick={() => {
                          seleccionarRol(item.rol);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] ${
                          isActive
                            ? 'bg-[#F0F9FF] text-[#0284C7]'
                            : 'text-[#0F172A] hover:bg-[#FAFAFA]'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Icon
                            className="h-3.5 w-3.5 shrink-0"
                            strokeWidth={1.5}
                          />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {isActive && (
                          <Check
                            className="h-3.5 w-3.5 shrink-0 text-[#0284C7]"
                            strokeWidth={1.75}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Network Toggle + Reset + Accessibility */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleOffline}
              disabled={isToggling}
              aria-pressed={state.isOffline}
              aria-label={
                state.isOffline
                  ? 'Modo Offline activo. Cambiar a En línea'
                  : 'Modo En línea activo. Cambiar a Offline'
              }
              title="Alternar conectividad (En línea / Offline)"
              className={`sses-badge inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:ring-offset-2 disabled:opacity-50 ${
                state.isOffline
                  ? 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E] hover:border-[#F59E0B]'
                  : 'border-[#E5E7EB] bg-white text-[#0F172A] hover:bg-[#FAFAFA]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  state.isOffline ? 'bg-[#D97706]' : 'bg-[#059669]'
                }`}
              />
              <span>{state.isOffline ? 'Offline' : 'En línea'}</span>
              {state.offlineQueue.length > 0 && (
                <span className="sses-mono ml-0.5 rounded-full bg-[#D97706] px-1.5 text-[10px] text-white">
                  {state.offlineQueue.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              aria-label="Restaurar datos de fábrica"
              title="Restaurar datos iniciales"
              className="inline-flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-white p-1.5 text-[#64748B] hover:bg-[#FAFAFA] hover:text-[#0F172A] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:ring-offset-2"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>

            <AccessibilityMenu />
          </div>
        </div>

        {/* Minimalist Feedback Strip */}
        {bannerMessage && (
          <div
            role="status"
            className="border-t border-[#E5E7EB] bg-[#F0FDF4] text-[#166534] text-xs font-medium"
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[#059669]"
                />
                <span>{bannerMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setBannerMessage(null)}
                aria-label="Cerrar notificación"
                className="text-[#166534] hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] rounded"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Minimalist Factory Reset Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
        >
          <div className="sses-card max-w-sm w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2
                id="reset-modal-title"
                className="text-sm font-medium text-[#0F172A]"
              >
                Restaurar datos iniciales
              </h2>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                aria-label="Cerrar diálogo"
                className="text-[#64748B] hover:text-[#0F172A] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-6 text-sm text-[#64748B]">
              Se reiniciarán estrategias, acompañamientos, cola offline y la
              cadena SHA-256 al estado base.
            </div>

            <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="sses-btn-secondary text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#DC2626] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#B91C1C] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:ring-offset-2 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>{isResetting ? 'Restaurando...' : 'Restaurar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

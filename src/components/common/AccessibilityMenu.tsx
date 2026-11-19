import React, { useEffect, useRef, useState } from 'react';
import { Accessibility, Moon, RotateCcw, Sun } from 'lucide-react';
import {
  useAccessibility,
  type TextScale,
} from '../../context/AccessibilityContext';

const TEXT_SCALES: Array<{
  value: TextScale;
  label: string;
  title: string;
  ariaLabel: string;
}> = [
  {
    value: 'sm',
    label: 'A-',
    title: 'Texto pequeño (90%)',
    ariaLabel: 'Reducir tamaño de texto al 90%',
  },
  {
    value: 'md',
    label: 'A',
    title: 'Texto normal (100%)',
    ariaLabel: 'Tamaño de texto normal al 100%',
  },
  {
    value: 'lg',
    label: 'A+',
    title: 'Texto grande (115%)',
    ariaLabel: 'Aumentar tamaño de texto al 115%',
  },
];

interface AccessibilityMenuProps {
  variant?: 'ribbon' | 'surface';
}

export const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({
  variant = 'ribbon',
}) => {
  const {
    prefs,
    hasActiveOverrides,
    toggleTheme,
    setTextScale,
    toggleHighContrast,
    toggleReadingSpacing,
    toggleReducedMotion,
    resetPrefs,
  } = useAccessibility();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const triggerClass =
    variant === 'ribbon'
      ? `inline-flex items-center gap-1.5 rounded px-2 py-1 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-gov-ribbon-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
          open ? 'bg-gov-ribbon-hover' : ''
        }`
      : `inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
          open || hasActiveOverrides
            ? 'border-brand-accent bg-brand-soft text-brand-accent'
            : 'border-border-subtle bg-surface text-ink hover:bg-surface-hover'
        }`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Opciones de accesibilidad"
        title="Accesibilidad (WCAG 2.1 AA)"
        className={triggerClass}
      >
        <Accessibility className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
        <span className="hidden sm:inline">Accesibilidad</span>
        {hasActiveOverrides && (
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-status-amber"
          />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Controles de accesibilidad"
          className="sses-popover absolute right-0 mt-2 w-72 p-4 z-50 space-y-4 text-ink"
        >
          <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
            <span className="text-xs font-medium text-ink">Accesibilidad</span>
            {hasActiveOverrides && (
              <button
                type="button"
                onClick={resetPrefs}
                aria-label="Restablecer opciones de accesibilidad"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-accent hover:text-brand-accent-hover rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              >
                <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
                <span>Restablecer</span>
              </button>
            )}
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
              {prefs.theme === 'dark' ? (
                <Moon className="h-3.5 w-3.5 text-brand-accent" strokeWidth={1.5} />
              ) : (
                <Sun className="h-3.5 w-3.5 text-status-amber" strokeWidth={1.5} />
              )}
              <span>Modo oscuro</span>
            </span>
            <SwitchControl
              label="Alternar modo oscuro"
              checked={prefs.theme === 'dark'}
              onToggle={toggleTheme}
            />
          </div>

          {/* Text Size Scale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-ink">Tamaño de fuente</span>
              <span className="sses-mono text-ink-secondary">
                {prefs.textScale === 'sm'
                  ? '90%'
                  : prefs.textScale === 'lg'
                  ? '115%'
                  : '100%'}
              </span>
            </div>
            <div
              role="group"
              aria-label="Escala de texto"
              className="grid grid-cols-3 gap-1 rounded border border-border-subtle bg-elevated p-1"
            >
              {TEXT_SCALES.map((item) => {
                const active = prefs.textScale === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTextScale(item.value)}
                    aria-pressed={active}
                    aria-label={item.ariaLabel}
                    title={item.title}
                    className={`rounded-sm py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
                      active
                        ? 'bg-brand-primary text-[var(--brand-primary-text)]'
                        : 'text-ink-secondary hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accessibility Toggles */}
          <div className="space-y-2.5 pt-1 border-t border-border-subtle">
            <div className="flex items-center justify-between gap-3 pt-2">
              <span
                title="Refuerza bordes y contraste en modo claro y oscuro"
                className="text-xs font-medium text-ink"
              >
                Alto contraste
              </span>
              <SwitchControl
                label="Alto contraste"
                checked={prefs.highContrast}
                onToggle={toggleHighContrast}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span
                title="Amplía el interlineado para lectura cómoda"
                className="text-xs font-medium text-ink"
              >
                Espaciado de lectura
              </span>
              <SwitchControl
                label="Espaciado de lectura"
                checked={prefs.readingSpacing}
                onToggle={toggleReadingSpacing}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span
                title="Desactiva animaciones y transiciones"
                className="text-xs font-medium text-ink"
              >
                Reducir movimiento
              </span>
              <SwitchControl
                label="Reducir movimiento"
                checked={prefs.reducedMotion}
                onToggle={toggleReducedMotion}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SwitchControlProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

const SwitchControl: React.FC<SwitchControlProps> = ({
  label,
  checked,
  onToggle,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
        checked
          ? 'border-brand-primary bg-brand-primary'
          : 'border-border-strong bg-elevated'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full transition-transform duration-150 ${
          checked
            ? 'translate-x-4 bg-[var(--brand-primary-text)]'
            : 'translate-x-0.5 bg-ink-secondary'
        }`}
      />
    </button>
  );
};

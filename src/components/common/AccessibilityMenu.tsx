import React, { useEffect, useRef, useState } from 'react';
import { Accessibility, RotateCcw } from 'lucide-react';
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

export const AccessibilityMenu: React.FC = () => {
  const {
    prefs,
    hasActiveOverrides,
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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Opciones de accesibilidad"
        title="Accesibilidad (WCAG 2.1 AA)"
        className={`relative inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:ring-offset-2 ${
          open || hasActiveOverrides
            ? 'border-[#0284C7] bg-[#F0F9FF] text-[#0369A1]'
            : 'border-[#E5E7EB] bg-white text-[#0F172A] hover:bg-[#FAFAFA]'
        }`}
      >
        <Accessibility className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
        <span className="hidden sm:inline">Accesibilidad</span>
        {hasActiveOverrides && (
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-[#0284C7]"
          />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Controles de accesibilidad"
          className="absolute right-0 mt-2 w-72 rounded-xl border border-[#E5E7EB] bg-white p-4 z-50 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
            <span className="text-xs font-medium text-[#0F172A]">
              Accesibilidad
            </span>
            {hasActiveOverrides && (
              <button
                type="button"
                onClick={resetPrefs}
                aria-label="Restablecer opciones de accesibilidad"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#0284C7] hover:text-[#0369A1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] rounded"
              >
                <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
                <span>Restablecer</span>
              </button>
            )}
          </div>

          {/* Text Size Scale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#0F172A]">Tamaño texto</span>
              <span className="sses-mono text-[#64748B]">
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
              className="grid grid-cols-3 gap-1 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-1"
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
                    className={`rounded-md py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] ${
                      active
                        ? 'bg-[#1E3A8A] text-white'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-1">
            <ToggleRow
              label="Alto contraste"
              title="Refuerza bordes (#0F172A) y maximiza el contraste (> 7:1)"
              checked={prefs.highContrast}
              onToggle={toggleHighContrast}
            />
            <ToggleRow
              label="Espaciado de lectura"
              title="Aumenta el interlineado para facilitar la lectura"
              checked={prefs.readingSpacing}
              onToggle={toggleReadingSpacing}
            />
            <ToggleRow
              label="Reducir movimiento"
              title="Desactiva animaciones y transiciones"
              checked={prefs.reducedMotion}
              onToggle={toggleReducedMotion}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface ToggleRowProps {
  label: string;
  title: string;
  checked: boolean;
  onToggle: () => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  title,
  checked,
  onToggle,
}) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <span title={title} className="text-xs font-medium text-[#0F172A]">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        title={title}
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:ring-offset-2 ${
          checked
            ? 'border-[#1E3A8A] bg-[#1E3A8A]'
            : 'border-[#CBD5E1] bg-[#E5E7EB]'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-150 ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
};

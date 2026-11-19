import React from 'react';
import { Moon, Sun } from 'lucide-react';
import govLogo from '../../../gov.png';
import { useAccessibility } from '../../context/AccessibilityContext';
import { AccessibilityMenu } from '../common/AccessibilityMenu';

export const GovTopBar: React.FC = () => {
  const { prefs, toggleTheme } = useAccessibility();
  const isDark = prefs.theme === 'dark';

  return (
    <div className="h-9 bg-gov-ribbon text-white border-b border-white/10 transition-colors duration-150">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Left: Official GOV.CO Logo */}
        <div className="flex items-center shrink-0">
          <img
            src={govLogo}
            alt="GOV.CO"
            className="h-6 w-auto object-contain select-none"
          />
        </div>

        {/* Right: Theme Toggle + Accessibility Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={isDark}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[13px] font-medium text-white hover:bg-gov-ribbon-hover transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {isDark ? (
              <Sun className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            ) : (
              <Moon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            )}
            <span className="hidden sm:inline">
              {isDark ? 'Claro' : 'Oscuro'}
            </span>
          </button>

          <span aria-hidden="true" className="h-3.5 w-px bg-white/25" />

          <AccessibilityMenu variant="ribbon" />
        </div>
      </div>
    </div>
  );
};

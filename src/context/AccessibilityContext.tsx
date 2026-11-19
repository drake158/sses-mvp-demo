import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ThemeMode = 'light' | 'dark';
export type TextScale = 'sm' | 'md' | 'lg';

export interface AccessibilityPrefs {
  theme: ThemeMode;
  textScale: TextScale;
  highContrast: boolean;
  readingSpacing: boolean;
  reducedMotion: boolean;
}

export const A11Y_STORAGE_KEY = 'sses_a11y_prefs_v1';

const TEXT_SCALE_PERCENT: Record<TextScale, string> = {
  sm: '90%',
  md: '100%',
  lg: '115%',
};

function detectSystemTheme(): ThemeMode {
  try {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
  } catch {
    // Fallback to light mode
  }
  return 'light';
}

function getDefaultPrefs(): AccessibilityPrefs {
  return {
    theme: detectSystemTheme(),
    textScale: 'md',
    highContrast: false,
    readingSpacing: false,
    reducedMotion: false,
  };
}

function readStoredPrefs(): AccessibilityPrefs {
  const defaults = getDefaultPrefs();
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaults;
    }
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<AccessibilityPrefs>;
    const theme: ThemeMode =
      parsed.theme === 'light' || parsed.theme === 'dark'
        ? parsed.theme
        : defaults.theme;
    const textScale: TextScale =
      parsed.textScale === 'sm' ||
      parsed.textScale === 'md' ||
      parsed.textScale === 'lg'
        ? parsed.textScale
        : 'md';
    return {
      theme,
      textScale,
      highContrast: Boolean(parsed.highContrast),
      readingSpacing: Boolean(parsed.readingSpacing),
      reducedMotion: Boolean(parsed.reducedMotion),
    };
  } catch {
    return defaults;
  }
}

function applyPrefsToDocument(prefs: AccessibilityPrefs): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = prefs.theme;
  root.style.colorScheme = prefs.theme;
  root.style.fontSize = TEXT_SCALE_PERCENT[prefs.textScale];
  root.dataset.highContrast = String(prefs.highContrast);
  root.dataset.readingSpacing = String(prefs.readingSpacing);
  root.dataset.reducedMotion = String(prefs.reducedMotion);
}

interface AccessibilityContextValue {
  prefs: AccessibilityPrefs;
  hasActiveOverrides: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setTextScale: (scale: TextScale) => void;
  toggleHighContrast: () => void;
  toggleReadingSpacing: () => void;
  toggleReducedMotion: () => void;
  resetPrefs: () => void;
}

const AccessibilityContext = createContext<
  AccessibilityContextValue | undefined
>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(() =>
    readStoredPrefs()
  );

  useEffect(() => {
    applyPrefsToDocument(prefs);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [prefs]);

  const setTheme = useCallback((theme: ThemeMode) => {
    setPrefs((prev) => ({ ...prev, theme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const setTextScale = useCallback((textScale: TextScale) => {
    setPrefs((prev) => ({ ...prev, textScale }));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setPrefs((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);

  const toggleReadingSpacing = useCallback(() => {
    setPrefs((prev) => ({ ...prev, readingSpacing: !prev.readingSpacing }));
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setPrefs((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  }, []);

  const resetPrefs = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      textScale: 'md',
      highContrast: false,
      readingSpacing: false,
      reducedMotion: false,
    }));
  }, []);

  const hasActiveOverrides =
    prefs.textScale !== 'md' ||
    prefs.highContrast ||
    prefs.readingSpacing ||
    prefs.reducedMotion;

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      prefs,
      hasActiveOverrides,
      setTheme,
      toggleTheme,
      setTextScale,
      toggleHighContrast,
      toggleReadingSpacing,
      toggleReducedMotion,
      resetPrefs,
    }),
    [
      prefs,
      hasActiveOverrides,
      setTheme,
      toggleTheme,
      setTextScale,
      toggleHighContrast,
      toggleReadingSpacing,
      toggleReducedMotion,
      resetPrefs,
    ]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error(
      'useAccessibility debe utilizarse dentro de AccessibilityProvider.'
    );
  }
  return ctx;
}

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type TextScale = 'sm' | 'md' | 'lg';

export interface AccessibilityPrefs {
  textScale: TextScale;
  highContrast: boolean;
  readingSpacing: boolean;
  reducedMotion: boolean;
}

export const A11Y_STORAGE_KEY = 'sses_a11y_prefs_v1';

const DEFAULT_PREFS: AccessibilityPrefs = {
  textScale: 'md',
  highContrast: false,
  readingSpacing: false,
  reducedMotion: false,
};

const TEXT_SCALE_PERCENT: Record<TextScale, string> = {
  sm: '90%',
  md: '100%',
  lg: '115%',
};

function readStoredPrefs(): AccessibilityPrefs {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_PREFS;
    }
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<AccessibilityPrefs>;
    const textScale: TextScale =
      parsed.textScale === 'sm' ||
      parsed.textScale === 'md' ||
      parsed.textScale === 'lg'
        ? parsed.textScale
        : 'md';
    return {
      textScale,
      highContrast: Boolean(parsed.highContrast),
      readingSpacing: Boolean(parsed.readingSpacing),
      reducedMotion: Boolean(parsed.reducedMotion),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function applyPrefsToDocument(prefs: AccessibilityPrefs): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.fontSize = TEXT_SCALE_PERCENT[prefs.textScale];
  root.dataset.highContrast = String(prefs.highContrast);
  root.dataset.readingSpacing = String(prefs.readingSpacing);
  root.dataset.reducedMotion = String(prefs.reducedMotion);
}

interface AccessibilityContextValue {
  prefs: AccessibilityPrefs;
  hasActiveOverrides: boolean;
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
    setPrefs(DEFAULT_PREFS);
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
      setTextScale,
      toggleHighContrast,
      toggleReadingSpacing,
      toggleReducedMotion,
      resetPrefs,
    }),
    [
      prefs,
      hasActiveOverrides,
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

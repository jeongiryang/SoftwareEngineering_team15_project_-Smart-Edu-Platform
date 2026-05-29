import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { themePalettes } from '../styles/theme';

const THEME_STORAGE_KEY = 'smartEduThemeMode';
const ThemeContext = createContext(null);

function getStorage() {
  try {
    return globalThis.localStorage || null;
  } catch (error) {
    return null;
  }
}

function normalizeMode(mode) {
  return mode === 'dark' ? 'dark' : 'light';
}

function readStoredMode() {
  return normalizeMode(getStorage()?.getItem(THEME_STORAGE_KEY));
}

function writeStoredMode(mode) {
  getStorage()?.setItem(THEME_STORAGE_KEY, normalizeMode(mode));
}

function applyThemeVariables(effectiveMode) {
  const documentRef = globalThis.document;

  if (!documentRef?.documentElement) {
    return;
  }

  const mode = themePalettes[effectiveMode] ? effectiveMode : 'light';
  const palette = themePalettes[mode];
  const root = documentRef.documentElement;

  Object.entries(palette).forEach(([name, value]) => {
    root.style.setProperty(`--sagak-color-${name}`, value);
  });

  root.dataset.sagakTheme = mode;
  root.style.colorScheme = mode === 'light' ? 'light' : 'dark';

  if (documentRef.body) {
    documentRef.body.style.backgroundColor = palette.background;
    documentRef.body.style.color = palette.ink;
  }
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(readStoredMode);
  const [highContrastActive, setHighContrastActive] = useState(false);
  const effectiveMode = highContrastActive ? 'highContrast' : mode;

  useEffect(() => {
    applyThemeVariables(effectiveMode);
  }, [effectiveMode]);

  const setThemeMode = useCallback((nextMode) => {
    const normalized = normalizeMode(nextMode);
    setMode(normalized);
    writeStoredMode(normalized);
  }, []);

  const toggleThemeMode = useCallback(() => {
    setMode((currentMode) => {
      const nextMode = currentMode === 'dark' ? 'light' : 'dark';
      writeStoredMode(nextMode);
      return nextMode;
    });
  }, []);

  const value = useMemo(() => ({
    effectiveMode,
    highContrastActive,
    mode,
    palette: themePalettes[effectiveMode],
    setHighContrastActive,
    setThemeMode,
    toggleThemeMode
  }), [effectiveMode, highContrastActive, mode, setThemeMode, toggleThemeMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }

  return context;
}

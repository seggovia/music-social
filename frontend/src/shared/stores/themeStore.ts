import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark';

const THEME_STORAGE_KEY = 'music-social-theme';
const DEFAULT_THEME: ThemePreference = 'light';

interface ThemeState {
  theme: ThemePreference;
  hydrate: (userPreference?: ThemePreference | null) => void;
  setTheme: (theme: ThemePreference, persistLocally?: boolean) => void;
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark';
}

function readStoredTheme(): ThemePreference | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : null;
  } catch {
    return null;
  }
}

function persistTheme(theme: ThemePreference) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The live theme still works when storage is unavailable.
  }
}

function applyTheme(theme: ThemePreference) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: DEFAULT_THEME,

  hydrate: (userPreference) => {
    const theme = isThemePreference(userPreference)
      ? userPreference
      : readStoredTheme() ?? DEFAULT_THEME;
    applyTheme(theme);
    set({ theme });
  },

  setTheme: (theme, persistLocally = true) => {
    applyTheme(theme);
    if (persistLocally) persistTheme(theme);
    set({ theme });
  },
}));

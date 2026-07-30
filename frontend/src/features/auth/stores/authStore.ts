import { create } from 'zustand';
import { reportError } from '@/shared/lib/errors';
import { useThemeStore } from '@/shared/stores/themeStore';
import { authApi } from '../api/authApi';
import type { AuthResponse, AuthState, LoginFormValues, RegisterFormValues, UserProfile } from '../types';

const STORAGE_KEY = 'music-social-auth';

function readStoredAuth() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Pick<AuthState, 'user' | 'accessToken' | 'refreshToken'>) : null;
  } catch {
    return null;
  }
}

function writeStoredAuth(user: UserProfile, accessToken: string | null, refreshToken: string | null) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user, accessToken, refreshToken }),
    );
  } catch {
    // Authentication remains usable when storage is unavailable.
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  hydrate: () => {
    const stored = readStoredAuth();
    useThemeStore.getState().hydrate(stored?.user?.theme_preference);
    set({
      user: stored?.user ?? null,
      accessToken: stored?.accessToken ?? null,
      refreshToken: stored?.refreshToken ?? null,
    });
  },
  refreshUser: async () => {
    const { accessToken, refreshToken } = get();
    if (!accessToken) return;

    try {
      const { user } = await authApi.me(accessToken);
      writeStoredAuth(user, accessToken, refreshToken);
      useThemeStore.getState().setTheme(user.theme_preference, false);
      set({ user });
    } catch {
      // The API client handles an expired session globally.
    }
  },
  patchUser: (profile) => {
    const { user, accessToken, refreshToken } = get();
    if (!user) return;

    const updatedUser = { ...user, ...profile };
    writeStoredAuth(updatedUser, accessToken, refreshToken);
    useThemeStore.getState().setTheme(updatedUser.theme_preference, false);
    set({ user: updatedUser });
  },
  login: async (values: LoginFormValues) => {
    set({ isLoading: true, error: null });
    try {
      const auth = (await authApi.login(values)) as AuthResponse;
      writeStoredAuth(auth.user, auth.access_token, auth.refresh_token);
      useThemeStore.getState().setTheme(auth.user.theme_preference, false);
      set({ user: auth.user, accessToken: auth.access_token, refreshToken: auth.refresh_token, isLoading: false });
    } catch (error) {
      const message = reportError(error, 'No pudimos iniciar sesión. Intenta de nuevo.');
      set({ error: message, isLoading: false });
      throw error;
    }
  },
  register: async (values: RegisterFormValues) => {
    set({ isLoading: true, error: null });
    try {
      const auth = (await authApi.register(values)) as AuthResponse;
      writeStoredAuth(auth.user, auth.access_token, auth.refresh_token);
      useThemeStore.getState().setTheme(auth.user.theme_preference, false);
      set({ user: auth.user, accessToken: auth.access_token, refreshToken: auth.refresh_token, isLoading: false });
    } catch (error) {
      const message = reportError(error, 'No pudimos crear tu cuenta. Intenta de nuevo.');
      set({ error: message, isLoading: false });
      throw error;
    }
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    useThemeStore.getState().hydrate();
    set({ user: null, accessToken: null, refreshToken: null, error: null });
  },
}));

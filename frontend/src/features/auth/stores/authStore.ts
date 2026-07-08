import { create } from 'zustand';
import { reportError } from '@/shared/lib/errors';
import { authApi } from '../api/authApi';
import type { AuthResponse, AuthState, LoginFormValues, RegisterFormValues } from '../types';

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  hydrate: () => {
    const stored = readStoredAuth();
    set({
      user: stored?.user ?? null,
      accessToken: stored?.accessToken ?? null,
      refreshToken: stored?.refreshToken ?? null,
    });
  },
  login: async (values: LoginFormValues) => {
    set({ isLoading: true, error: null });
    try {
      const auth = (await authApi.login(values)) as AuthResponse;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ user: auth.user, accessToken: auth.access_token, refreshToken: auth.refresh_token }),
        );
      }
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
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ user: auth.user, accessToken: auth.access_token, refreshToken: auth.refresh_token }),
        );
      }
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
    set({ user: null, accessToken: null, refreshToken: null, error: null });
  },
}));

import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { apiClient } from '@/shared/api/client';
import { reportError } from '@/shared/lib/errors';
import type { AffinityUser, GenreUser, TopReviewerUser, UpdateProfileInput, UserProfile, UsersFilter, UserSummary } from '../types';

type AnyUserRow = UserSummary | TopReviewerUser | GenreUser | AffinityUser;

interface UsersState {
  currentProfile: UserProfile | null;
  list: AnyUserRow[];
  activeFilter: UsersFilter;
  isLoading: boolean;
  error: string | null;
  fetchProfile: (username: string) => Promise<void>;
  fetchFiltered: (filter: UsersFilter, currentUsername?: string) => Promise<void>;
  updateProfile: (username: string, data: UpdateProfileInput) => Promise<void>;
}

function authOptions(): RequestInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export const useUsersStore = create<UsersState>((set, get) => ({
  currentProfile: null,
  list: [],
  activeFilter: 'all',
  isLoading: false,
  error: null,

  fetchProfile: async (username: string) => {
    set({ currentProfile: null, isLoading: true, error: null });
    try {
      const profile = await apiClient.get<UserProfile>(`/users/${username}`);
      set({ currentProfile: profile, isLoading: false });
    } catch (e) {
      const message = reportError(e, 'No pudimos cargar el perfil. Intenta de nuevo.', () => get().fetchProfile(username));
      set({ error: message, isLoading: false });
    }
  },

  fetchFiltered: async (filter: UsersFilter, currentUsername?: string) => {
    set({ isLoading: true, error: null, activeFilter: filter });
    try {
      let list: AnyUserRow[] = [];
      switch (filter) {
        case 'top-reviewers':
          list = await apiClient.get<TopReviewerUser[]>('/users/filters/top-reviewers');
          break;
        case 'by-genre':
          list = await apiClient.get<GenreUser[]>('/users/filters/by-genre');
          break;
        case 'similar':
          if (currentUsername) list = await apiClient.get<AffinityUser[]>(`/users/filters/similar/${currentUsername}`);
          break;
        case 'opposite':
          if (currentUsername) list = await apiClient.get<AffinityUser[]>(`/users/filters/opposite/${currentUsername}`);
          break;
        default:
          list = await apiClient.get<UserSummary[]>('/users');
      }
      set({ list, isLoading: false });
    } catch (e) {
      const message = reportError(e, 'No pudimos cargar usuarios. Intenta de nuevo.', () => get().fetchFiltered(filter, currentUsername));
      set({ error: message, isLoading: false });
    }
  },

  updateProfile: async (username: string, data: UpdateProfileInput) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiClient.put<UserProfile>(`/users/${username}`, data, authOptions());
      set((state) => ({
        currentProfile: state.currentProfile ? { ...state.currentProfile, ...updated } : null,
        isLoading: false,
      }));
    } catch (e) {
      const message = reportError(e, 'No pudimos actualizar el perfil. Intenta de nuevo.');
      set({ error: message, isLoading: false });
      throw e;
    }
  },
}));

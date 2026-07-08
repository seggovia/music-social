import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { apiClient } from '@/shared/api/client';
import { reportError } from '@/shared/lib/errors';
import type { PaginatedResponse } from '@/shared/types';
import type { AffinityUser, GenreUser, TopReviewerUser, UpdateProfileInput, UserProfile, UsersFilter, UserSummary } from '../types';

const USERS_LIMIT = 20;

type AnyUserRow = UserSummary | TopReviewerUser | GenreUser | AffinityUser;

interface UsersState {
  currentProfile: UserProfile | null;
  list: AnyUserRow[];
  activeFilter: UsersFilter;
  currentUsername?: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  total: number;
  fetchProfile: (username: string) => Promise<void>;
  fetchFiltered: (filter: UsersFilter, currentUsername?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  updateProfile: (username: string, data: UpdateProfileInput) => Promise<void>;
}

function authOptions(): RequestInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

async function fetchUsersPage(filter: UsersFilter, page: number, currentUsername?: string) {
  const query = `page=${page}&limit=${USERS_LIMIT}`;
  switch (filter) {
    case 'top-reviewers':
      return apiClient.get<PaginatedResponse<TopReviewerUser>>(`/users/filters/top-reviewers?${query}`);
    case 'by-genre':
      return apiClient.get<PaginatedResponse<GenreUser>>(`/users/filters/by-genre?${query}`);
    case 'similar':
      if (!currentUsername) return { data: [], meta: { total: 0, page, limit: USERS_LIMIT, hasMore: false } };
      return apiClient.get<PaginatedResponse<AffinityUser>>(`/users/filters/similar/${currentUsername}?${query}`);
    case 'opposite':
      if (!currentUsername) return { data: [], meta: { total: 0, page, limit: USERS_LIMIT, hasMore: false } };
      return apiClient.get<PaginatedResponse<AffinityUser>>(`/users/filters/opposite/${currentUsername}?${query}`);
    default:
      return apiClient.get<PaginatedResponse<UserSummary>>(`/users?${query}`);
  }
}

export const useUsersStore = create<UsersState>((set, get) => ({
  currentProfile: null,
  list: [],
  activeFilter: 'all',
  currentUsername: undefined,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  page: 1,
  hasMore: false,
  total: 0,

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
    set({
      list: [],
      activeFilter: filter,
      currentUsername,
      page: 1,
      hasMore: false,
      total: 0,
      isLoading: true,
      isLoadingMore: false,
      error: null,
    });
    try {
      const response = await fetchUsersPage(filter, 1, currentUsername);
      set({
        list: response.data,
        page: response.meta.page,
        hasMore: response.meta.hasMore,
        total: response.meta.total,
        isLoading: false,
      });
    } catch (e) {
      const message = reportError(e, 'No pudimos cargar usuarios. Intenta de nuevo.', () => get().fetchFiltered(filter, currentUsername));
      set({ error: message, isLoading: false });
    }
  },

  loadMore: async () => {
    const { activeFilter, currentUsername, page, hasMore, isLoadingMore } = get();
    if (!hasMore || isLoadingMore) return;

    const nextPage = page + 1;
    set({ isLoadingMore: true, error: null });
    try {
      const response = await fetchUsersPage(activeFilter, nextPage, currentUsername);
      set((state) => ({
        list: [...state.list, ...response.data],
        page: response.meta.page,
        hasMore: response.meta.hasMore,
        total: response.meta.total,
        isLoadingMore: false,
      }));
    } catch (e) {
      const message = reportError(e, 'No pudimos cargar mas usuarios. Intenta de nuevo.', () => get().loadMore());
      set({ error: message, isLoadingMore: false });
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

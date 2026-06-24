import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { AffinityUser, GenreUser, TopReviewerUser, UpdateProfileInput, UserProfile, UsersFilter, UserSummary } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

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

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json() as Promise<T>;
}

export const useUsersStore = create<UsersState>((set) => ({
  currentProfile: null,
  list: [],
  activeFilter: 'all',
  isLoading: false,
  error: null,

  fetchProfile: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await getJson<UserProfile>(`/users/${username}`);
      set({ currentProfile: profile, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load profile', isLoading: false });
    }
  },

  fetchFiltered: async (filter: UsersFilter, currentUsername?: string) => {
    set({ isLoading: true, error: null, activeFilter: filter });
    try {
      let list: AnyUserRow[] = [];
      switch (filter) {
        case 'top-reviewers':
          list = await getJson<TopReviewerUser[]>('/users/filters/top-reviewers');
          break;
        case 'by-genre':
          list = await getJson<GenreUser[]>('/users/filters/by-genre');
          break;
        case 'similar':
          if (currentUsername) list = await getJson<AffinityUser[]>(`/users/filters/similar/${currentUsername}`);
          break;
        case 'opposite':
          if (currentUsername) list = await getJson<AffinityUser[]>(`/users/filters/opposite/${currentUsername}`);
          break;
        default:
          list = await getJson<UserSummary[]>('/users');
      }
      set({ list, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load users', isLoading: false });
    }
  },

  updateProfile: async (username: string, data: UpdateProfileInput) => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`${BASE_URL}/users/${username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const updated = await response.json() as UserProfile;
      set((state) => ({
        currentProfile: state.currentProfile ? { ...state.currentProfile, ...updated } : null,
        isLoading: false,
      }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to update profile', isLoading: false });
      throw e;
    }
  },
}));
import { create } from 'zustand';
import type { UserProfile, UserSummary } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

interface UsersState {
  currentProfile: UserProfile | null;
  list: UserSummary[];
  isLoading: boolean;
  error: string | null;
  fetchProfile: (username: string) => Promise<void>;
  fetchList: () => Promise<void>;
}

export const useUsersStore = create<UsersState>((set) => ({
  currentProfile: null,
  list: [],
  isLoading: false,
  error: null,

  fetchProfile: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${BASE_URL}/users/${username}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const profile = await response.json() as UserProfile;
      set({ currentProfile: profile, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load profile', isLoading: false });
    }
  },

  fetchList: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${BASE_URL}/users`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const list = await response.json() as UserSummary[];
      set({ list, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load users', isLoading: false });
    }
  },
}));
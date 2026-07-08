import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { apiClient } from '@/shared/api/client';
import { reportError } from '@/shared/lib/errors';
import type { FollowStats, FollowUser } from '../types';

interface FollowsState {
  stats: FollowStats | null;
  followers: FollowUser[];
  following: FollowUser[];
  isLoading: boolean;
  error: string | null;
  fetchStats: (userId: string) => Promise<void>;
  fetchFollowers: (userId: string) => Promise<void>;
  fetchFollowing: (userId: string) => Promise<void>;
  follow: (userId: string) => Promise<void>;
  unfollow: (userId: string) => Promise<void>;
}

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const useFollowsStore = create<FollowsState>((set, get) => ({
  stats: null,
  followers: [],
  following: [],
  isLoading: false,
  error: null,

  fetchStats: async (userId: string) => {
    try {
      const stats = await apiClient.get<FollowStats>(`/follows/${userId}/stats`, { headers: authHeaders() });
      set({ stats });
    } catch (e) {
      const message = reportError(e, 'No pudimos cargar los seguidores. Intenta de nuevo.', () => get().fetchStats(userId));
      set({ error: message });
    }
  },

  fetchFollowers: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const followers = await apiClient.get<FollowUser[]>(`/follows/${userId}/followers`);
      set({ followers, isLoading: false });
    } catch (e) {
      const message = reportError(e, 'No pudimos cargar seguidores. Intenta de nuevo.', () => get().fetchFollowers(userId));
      set({ error: message, isLoading: false });
    }
  },

  fetchFollowing: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const following = await apiClient.get<FollowUser[]>(`/follows/${userId}/following`);
      set({ following, isLoading: false });
    } catch (e) {
      const message = reportError(e, 'No pudimos cargar seguidos. Intenta de nuevo.', () => get().fetchFollowing(userId));
      set({ error: message, isLoading: false });
    }
  },

  follow: async (userId: string) => {
    try {
      await apiClient.post<unknown>(`/follows/${userId}`, undefined, { headers: authHeaders() });
      const current = get().stats;
      set({ stats: current ? { ...current, isFollowing: true, followerCount: current.followerCount + 1 } : null });
    } catch (e) {
      const message = reportError(e, 'No pudimos seguir a este usuario. Intenta de nuevo.');
      set({ error: message });
      throw e;
    }
  },

  unfollow: async (userId: string) => {
    try {
      await apiClient.delete<void>(`/follows/${userId}`, { headers: authHeaders() });
      const current = get().stats;
      set({ stats: current ? { ...current, isFollowing: false, followerCount: Math.max(0, current.followerCount - 1) } : null });
    } catch (e) {
      const message = reportError(e, 'No pudimos dejar de seguir a este usuario. Intenta de nuevo.');
      set({ error: message });
      throw e;
    }
  },
}));

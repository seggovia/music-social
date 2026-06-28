import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { FollowStats, FollowUser } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

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
      const response = await fetch(`${BASE_URL}/follows/${userId}/stats`, {
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const stats = await response.json() as FollowStats;
      set({ stats });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load follow stats' });
    }
  },

  fetchFollowers: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${BASE_URL}/follows/${userId}/followers`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const followers = await response.json() as FollowUser[];
      set({ followers, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load followers', isLoading: false });
    }
  },

  fetchFollowing: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${BASE_URL}/follows/${userId}/following`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const following = await response.json() as FollowUser[];
      set({ following, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load following', isLoading: false });
    }
  },

  follow: async (userId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/follows/${userId}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const current = get().stats;
      set({ stats: current ? { ...current, isFollowing: true, followerCount: current.followerCount + 1 } : null });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to follow user' });
      throw e;
    }
  },

  unfollow: async (userId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/follows/${userId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const current = get().stats;
      set({ stats: current ? { ...current, isFollowing: false, followerCount: Math.max(0, current.followerCount - 1) } : null });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to unfollow user' });
      throw e;
    }
  },
}));
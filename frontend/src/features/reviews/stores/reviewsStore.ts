import { create } from 'zustand';
import { reviewsApi } from '../api/reviewsApi';
import type { CreateReviewInput, Review, UpdateReviewInput } from '../types';

interface ReviewsState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  fetchByAlbum: (albumId: string) => Promise<void>;
  fetchByUser: (userId: string) => Promise<void>;
  create: (data: CreateReviewInput) => Promise<void>;
  update: (id: string, data: UpdateReviewInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useReviewsStore = create<ReviewsState>((set) => ({
  reviews: [],
  isLoading: false,
  error: null,

  fetchByAlbum: async (albumId) => {
    set({ isLoading: true, error: null });
    try {
      const reviews = await reviewsApi.getByAlbum(albumId);
      set({ reviews, isLoading: false });
    } catch {
      set({ error: 'Failed to load reviews', isLoading: false });
    }
  },

  fetchByUser: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const reviews = await reviewsApi.getByUser(userId);
      set({ reviews, isLoading: false });
    } catch {
      set({ error: 'Failed to load reviews', isLoading: false });
    }
  },

  create: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const review = await reviewsApi.create(data);
      set((state) => ({ reviews: [review, ...state.reviews], isLoading: false }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create review';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  update: async (id, data) => {
    try {
      const updated = await reviewsApi.update(id, data);
      set((state) => ({
        reviews: state.reviews.map((r) => (r.id === id ? updated : r)),
      }));
    } catch {
      set({ error: 'Failed to update review' });
    }
  },

  remove: async (id) => {
    try {
      await reviewsApi.delete(id);
      set((state) => ({ reviews: state.reviews.filter((r) => r.id !== id) }));
    } catch {
      set({ error: 'Failed to delete review' });
    }
  },
}));
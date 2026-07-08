import { create } from 'zustand';
import { reportError } from '@/shared/lib/errors';
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

export const useReviewsStore = create<ReviewsState>((set, get) => ({
  reviews: [],
  isLoading: false,
  error: null,

  fetchByAlbum: async (albumId) => {
    set({ isLoading: true, error: null });
    try {
      const reviews = await reviewsApi.getByAlbum(albumId);
      set({ reviews, isLoading: false });
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar las reseñas. Intenta de nuevo.', () => get().fetchByAlbum(albumId));
      set({ error: message, isLoading: false });
    }
  },

  fetchByUser: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const reviews = await reviewsApi.getByUser(userId);
      set({ reviews, isLoading: false });
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar las reseñas. Intenta de nuevo.', () => get().fetchByUser(userId));
      set({ error: message, isLoading: false });
    }
  },

  create: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const review = await reviewsApi.create(data);
      set((state) => ({ reviews: [review, ...state.reviews], isLoading: false }));
    } catch (e) {
      const message = reportError(e, 'No pudimos publicar la reseña. Intenta de nuevo.');
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  update: async (id, data) => {
    try {
      const updated = await reviewsApi.update(id, data);
      set((state) => ({
        reviews: state.reviews.map((r) => (r.id === id ? updated : r)),
      }));
    } catch (error) {
      const message = reportError(error, 'No pudimos actualizar la reseña. Intenta de nuevo.');
      set({ error: message });
    }
  },

  remove: async (id) => {
    try {
      await reviewsApi.delete(id);
      set((state) => ({ reviews: state.reviews.filter((r) => r.id !== id) }));
    } catch (error) {
      const message = reportError(error, 'No pudimos eliminar la reseña. Intenta de nuevo.');
      set({ error: message });
    }
  },
}));

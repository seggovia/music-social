import { create } from 'zustand';
import { reportError } from '@/shared/lib/errors';
import { reviewsApi } from '../api/reviewsApi';
import type { CreateReviewInput, Review, UpdateReviewInput } from '../types';

const REVIEWS_LIMIT = 10;

type ReviewsScope = { type: 'album' | 'user'; id: string } | null;

interface ReviewsState {
  reviews: Review[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  total: number;
  scope: ReviewsScope;
  fetchByAlbum: (albumId: string) => Promise<void>;
  fetchByUser: (userId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  create: (data: CreateReviewInput) => Promise<void>;
  update: (id: string, data: UpdateReviewInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useReviewsStore = create<ReviewsState>((set, get) => ({
  reviews: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  page: 1,
  hasMore: false,
  total: 0,
  scope: null,

  fetchByAlbum: async (albumId) => {
    set({ reviews: [], scope: { type: 'album', id: albumId }, page: 1, isLoading: true, isLoadingMore: false, error: null });
    try {
      const response = await reviewsApi.getByAlbum(albumId, 1, REVIEWS_LIMIT);
      set({
        reviews: response.data,
        page: response.meta.page,
        hasMore: response.meta.hasMore,
        total: response.meta.total,
        isLoading: false,
      });
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar las resenas. Intenta de nuevo.', () => get().fetchByAlbum(albumId));
      set({ error: message, isLoading: false });
    }
  },

  fetchByUser: async (userId) => {
    set({ reviews: [], scope: { type: 'user', id: userId }, page: 1, isLoading: true, isLoadingMore: false, error: null });
    try {
      const response = await reviewsApi.getByUser(userId, 1, REVIEWS_LIMIT);
      set({
        reviews: response.data,
        page: response.meta.page,
        hasMore: response.meta.hasMore,
        total: response.meta.total,
        isLoading: false,
      });
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar las resenas. Intenta de nuevo.', () => get().fetchByUser(userId));
      set({ error: message, isLoading: false });
    }
  },

  loadMore: async () => {
    const { scope, page, hasMore, isLoadingMore } = get();
    if (!scope || !hasMore || isLoadingMore) return;

    const nextPage = page + 1;
    set({ isLoadingMore: true, error: null });
    try {
      const response = scope.type === 'album'
        ? await reviewsApi.getByAlbum(scope.id, nextPage, REVIEWS_LIMIT)
        : await reviewsApi.getByUser(scope.id, nextPage, REVIEWS_LIMIT);

      set((state) => ({
        reviews: [...state.reviews, ...response.data],
        page: response.meta.page,
        hasMore: response.meta.hasMore,
        total: response.meta.total,
        isLoadingMore: false,
      }));
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar mas resenas. Intenta de nuevo.', () => get().loadMore());
      set({ error: message, isLoadingMore: false });
    }
  },

  create: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const review = await reviewsApi.create(data);
      set((state) => ({
        reviews: [review, ...state.reviews],
        total: state.total + 1,
        isLoading: false,
      }));
    } catch (e) {
      const message = reportError(e, 'No pudimos publicar la resena. Intenta de nuevo.');
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
      const message = reportError(error, 'No pudimos actualizar la resena. Intenta de nuevo.');
      set({ error: message });
    }
  },

  remove: async (id) => {
    try {
      await reviewsApi.delete(id);
      set((state) => ({
        reviews: state.reviews.filter((r) => r.id !== id),
        total: Math.max(0, state.total - 1),
      }));
    } catch (error) {
      const message = reportError(error, 'No pudimos eliminar la resena. Intenta de nuevo.');
      set({ error: message });
    }
  },
}));

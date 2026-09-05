import { create } from 'zustand';
import { reportError } from '@/shared/lib/errors';
import { reviewsApi } from '../api/reviewsApi';
import { useReviewsFeedStore } from './reviewsFeedStore';
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
  getMineByAlbum: (albumId: string) => Promise<Review | null>;
  loadMore: () => Promise<void>;
  create: (data: CreateReviewInput) => Promise<Review>;
  update: (id: string, data: UpdateReviewInput) => Promise<Review>;
  remove: (id: string, albumId?: string) => Promise<void>;
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

  getMineByAlbum: async (albumId) => {
    try {
      const review = await reviewsApi.getMineByAlbum(albumId);
      if (!review) return null;

      set((state) => {
        if (state.scope?.type !== 'album' || state.scope.id !== albumId) return state;

        const exists = state.reviews.some((item) => item.id === review.id);
        return {
          reviews: exists
            ? state.reviews.map((item) => item.id === review.id ? review : item)
            : [review, ...state.reviews],
        };
      });
      return review;
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar tu resena. Intenta de nuevo.');
      set({ error: message });
      throw error;
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
        reviews: state.scope?.type === 'album' && state.scope.id === data.albumId
          ? [review, ...state.reviews]
          : state.reviews,
        total: state.scope?.type === 'album' && state.scope.id === data.albumId
          ? state.total + 1
          : state.total,
        isLoading: false,
      }));
      await useReviewsFeedStore.getState().refresh();
      return review;
    } catch (e) {
      const message = reportError(e, 'No pudimos publicar la resena. Intenta de nuevo.');
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  update: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await reviewsApi.update(id, data);
      set((state) => ({
        reviews: state.reviews.map((r) => (r.id === id ? updated : r)),
        isLoading: false,
      }));
      useReviewsFeedStore.getState().patchReview(updated);
      return updated;
    } catch (error) {
      const message = reportError(error, 'No pudimos actualizar la resena. Intenta de nuevo.');
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  remove: async (id, albumId) => {
    set({ isLoading: true, error: null });
    try {
      await reviewsApi.delete(id);
      set((state) => ({
        reviews: state.reviews.filter((r) => r.id !== id),
        total: state.scope?.type === 'album' && state.scope.id === albumId
          ? Math.max(0, state.total - 1)
          : state.total,
        isLoading: false,
      }));
      useReviewsFeedStore.getState().removeReview(id);
      void useReviewsFeedStore.getState().refresh();
    } catch (error) {
      const message = reportError(error, 'No pudimos eliminar la resena. Intenta de nuevo.');
      set({ error: message, isLoading: false });
      throw error;
    }
  },
}));

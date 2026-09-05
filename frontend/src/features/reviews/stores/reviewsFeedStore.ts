import { create } from 'zustand';
import { reportError } from '@/shared/lib/errors';
import { reviewsApi } from '../api/reviewsApi';
import type { FeedReview, Review, ReviewFeedScope } from '../types';

const FEED_LIMIT = 12;
let latestRequestId = 0;

interface ReviewsFeedState {
  items: FeedReview[];
  scope: ReviewFeedScope;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  total: number;
  fetchFeed: (scope: ReviewFeedScope) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  patchReview: (review: Review) => void;
  removeReview: (id: string) => void;
}

export const useReviewsFeedStore = create<ReviewsFeedState>((set, get) => ({
  items: [],
  scope: 'all',
  isLoading: false,
  isLoadingMore: false,
  error: null,
  page: 1,
  hasMore: false,
  total: 0,

  fetchFeed: async (scope) => {
    const requestId = ++latestRequestId;
    set({
      items: [],
      scope,
      isLoading: true,
      isLoadingMore: false,
      error: null,
      page: 1,
      hasMore: false,
      total: 0,
    });

    try {
      const response = await reviewsApi.getFeed(scope, 1, FEED_LIMIT);
      if (requestId !== latestRequestId) return;

      set({
        items: response.data,
        page: response.meta.page,
        hasMore: response.meta.hasMore,
        total: response.meta.total,
        isLoading: false,
      });
    } catch (error) {
      if (requestId !== latestRequestId) return;
      const message = reportError(
        error,
        'No pudimos cargar el feed de reseñas. Intenta de nuevo.',
        () => get().fetchFeed(scope),
      );
      set({ error: message, isLoading: false });
    }
  },

  refresh: async () => {
    const { scope } = get();
    const requestId = ++latestRequestId;
    set({ isLoading: true, isLoadingMore: false, error: null });

    try {
      const response = await reviewsApi.getFeed(scope, 1, FEED_LIMIT);
      if (requestId !== latestRequestId) return;

      set({
        items: response.data,
        page: response.meta.page,
        hasMore: response.meta.hasMore,
        total: response.meta.total,
        isLoading: false,
      });
    } catch (error) {
      if (requestId !== latestRequestId) return;
      const message = reportError(
        error,
        'No pudimos actualizar el feed de reseñas. Intenta de nuevo.',
        () => get().refresh(),
      );
      set({ error: message, isLoading: false });
    }
  },

  loadMore: async () => {
    const { scope, page, hasMore, isLoadingMore, isLoading } = get();
    if (!hasMore || isLoadingMore || isLoading) return;

    const requestId = latestRequestId;
    const nextPage = page + 1;
    set({ isLoadingMore: true, error: null });

    try {
      const response = await reviewsApi.getFeed(scope, nextPage, FEED_LIMIT);
      if (requestId !== latestRequestId || get().scope !== scope) return;

      set((state) => ({
        items: [...state.items, ...response.data],
        page: response.meta.page,
        hasMore: response.meta.hasMore,
        total: response.meta.total,
        isLoadingMore: false,
      }));
    } catch (error) {
      if (requestId !== latestRequestId) return;
      const message = reportError(
        error,
        'No pudimos cargar más reseñas. Intenta de nuevo.',
        () => get().loadMore(),
      );
      set({ error: message, isLoadingMore: false });
    }
  },

  patchReview: (review) => {
    set((state) => ({
      items: state.items.map((item) => item.id === review.id
        ? { ...item, rating: Number(review.rating), content: review.content }
        : item),
    }));
  },

  removeReview: (id) => {
    set((state) => {
      const exists = state.items.some((item) => item.id === id);
      if (!exists) return state;

      return {
        items: state.items.filter((item) => item.id !== id),
        total: Math.max(0, state.total - 1),
      };
    });
  },
}));

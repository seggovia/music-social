import { create } from 'zustand';
import { reportError } from '@/shared/lib/errors';
import { reviewsApi } from '../api/reviewsApi';
import type { ReviewComment } from '../types';

const COMMENTS_LIMIT = 10;

export interface ReviewCommentsBucket {
  items: ReviewComment[];
  total: number;
  page: number;
  hasMore: boolean;
  loaded: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isSubmitting: boolean;
  deletingIds: string[];
  error: string | null;
}

const EMPTY_BUCKET: ReviewCommentsBucket = {
  items: [],
  total: 0,
  page: 1,
  hasMore: false,
  loaded: false,
  isLoading: false,
  isLoadingMore: false,
  isSubmitting: false,
  deletingIds: [],
  error: null,
};

interface ReviewCommentsState {
  byReview: Record<string, ReviewCommentsBucket>;
  fetchComments: (reviewId: string) => Promise<void>;
  loadMore: (reviewId: string) => Promise<void>;
  createComment: (reviewId: string, content: string) => Promise<void>;
  deleteComment: (reviewId: string, commentId: string) => Promise<void>;
}

function currentBucket(state: ReviewCommentsState, reviewId: string) {
  return state.byReview[reviewId] ?? EMPTY_BUCKET;
}

export const useReviewCommentsStore = create<ReviewCommentsState>((set, get) => ({
  byReview: {},

  fetchComments: async (reviewId) => {
    if (currentBucket(get(), reviewId).isLoading) return;

    set((state) => ({
      byReview: {
        ...state.byReview,
        [reviewId]: {
          ...currentBucket(state, reviewId),
          isLoading: true,
          isLoadingMore: false,
          error: null,
        },
      },
    }));

    try {
      const response = await reviewsApi.getComments(reviewId, 1, COMMENTS_LIMIT);
      set((state) => ({
        byReview: {
          ...state.byReview,
          [reviewId]: {
            ...currentBucket(state, reviewId),
            items: response.data,
            total: response.meta.total,
            page: response.meta.page,
            hasMore: response.meta.hasMore,
            loaded: true,
            isLoading: false,
          },
        },
      }));
    } catch (error) {
      const message = reportError(
        error,
        'No pudimos cargar los comentarios. Intenta de nuevo.',
        () => get().fetchComments(reviewId),
      );
      set((state) => ({
        byReview: {
          ...state.byReview,
          [reviewId]: {
            ...currentBucket(state, reviewId),
            isLoading: false,
            error: message,
          },
        },
      }));
    }
  },

  loadMore: async (reviewId) => {
    const bucket = currentBucket(get(), reviewId);
    if (!bucket.hasMore || bucket.isLoadingMore || bucket.isLoading) return;

    const nextPage = bucket.page + 1;
    set((state) => ({
      byReview: {
        ...state.byReview,
        [reviewId]: {
          ...currentBucket(state, reviewId),
          isLoadingMore: true,
          error: null,
        },
      },
    }));

    try {
      const response = await reviewsApi.getComments(reviewId, nextPage, COMMENTS_LIMIT);
      set((state) => {
        const current = currentBucket(state, reviewId);
        return {
          byReview: {
            ...state.byReview,
            [reviewId]: {
              ...current,
              items: [...current.items, ...response.data],
              total: response.meta.total,
              page: response.meta.page,
              hasMore: response.meta.hasMore,
              isLoadingMore: false,
            },
          },
        };
      });
    } catch (error) {
      const message = reportError(
        error,
        'No pudimos cargar más comentarios. Intenta de nuevo.',
        () => get().loadMore(reviewId),
      );
      set((state) => ({
        byReview: {
          ...state.byReview,
          [reviewId]: {
            ...currentBucket(state, reviewId),
            isLoadingMore: false,
            error: message,
          },
        },
      }));
    }
  },

  createComment: async (reviewId, content) => {
    set((state) => ({
      byReview: {
        ...state.byReview,
        [reviewId]: {
          ...currentBucket(state, reviewId),
          isSubmitting: true,
          error: null,
        },
      },
    }));

    try {
      const comment = await reviewsApi.createComment(reviewId, content);

      set((state) => {
        const current = currentBucket(state, reviewId);
        return {
          byReview: {
            ...state.byReview,
            [reviewId]: {
              ...current,
              items: [comment, ...current.items],
              total: current.total + 1,
              loaded: true,
              isSubmitting: false,
            },
          },
        };
      });

      // Reset to page one so offset pagination stays stable after inserting
      // the newest comment.
      await get().fetchComments(reviewId);
    } catch (error) {
      const message = reportError(error, 'No pudimos publicar el comentario. Intenta de nuevo.');
      set((state) => ({
        byReview: {
          ...state.byReview,
          [reviewId]: {
            ...currentBucket(state, reviewId),
            isSubmitting: false,
            error: message,
          },
        },
      }));
      throw error;
    }
  },

  deleteComment: async (reviewId, commentId) => {
    set((state) => {
      const current = currentBucket(state, reviewId);
      return {
        byReview: {
          ...state.byReview,
          [reviewId]: {
            ...current,
            deletingIds: [...current.deletingIds, commentId],
            error: null,
          },
        },
      };
    });

    try {
      await reviewsApi.deleteComment(reviewId, commentId);
      set((state) => {
        const current = currentBucket(state, reviewId);
        return {
          byReview: {
            ...state.byReview,
            [reviewId]: {
              ...current,
              items: current.items.filter((comment) => comment.id !== commentId),
              total: Math.max(0, current.total - 1),
              deletingIds: current.deletingIds.filter((id) => id !== commentId),
            },
          },
        };
      });
    } catch (error) {
      const message = reportError(error, 'No pudimos borrar el comentario. Intenta de nuevo.');
      set((state) => {
        const current = currentBucket(state, reviewId);
        return {
          byReview: {
            ...state.byReview,
            [reviewId]: {
              ...current,
              deletingIds: current.deletingIds.filter((id) => id !== commentId),
              error: message,
            },
          },
        };
      });
    }
  },
}));

export { EMPTY_BUCKET };

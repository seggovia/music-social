import { create } from 'zustand';
import { reportError } from '@/shared/lib/errors';
import { reviewsApi } from '../api/reviewsApi';
import type { ReviewVoteSummary, ReviewVoteValue } from '../types';

export interface ReviewVotesBucket extends ReviewVoteSummary {
  loaded: boolean;
  isLoading: boolean;
  isVoting: boolean;
  viewerId: string | null;
  error: string | null;
}

export const EMPTY_VOTES_BUCKET: ReviewVotesBucket = {
  positive: 0,
  negative: 0,
  net: 0,
  currentVote: null,
  loaded: false,
  isLoading: false,
  isVoting: false,
  viewerId: null,
  error: null,
};

interface ReviewVotesState {
  byReview: Record<string, ReviewVotesBucket>;
  fetchSummary: (reviewId: string, viewerId: string | null) => Promise<void>;
  vote: (reviewId: string, value: ReviewVoteValue, viewerId: string) => Promise<void>;
}

function currentBucket(state: ReviewVotesState, reviewId: string) {
  return state.byReview[reviewId] ?? EMPTY_VOTES_BUCKET;
}

function optimisticSummary(
  bucket: ReviewVotesBucket,
  value: ReviewVoteValue,
): ReviewVoteSummary {
  const nextVote = bucket.currentVote === value ? null : value;
  const positive = bucket.positive
    - (bucket.currentVote === 1 ? 1 : 0)
    + (nextVote === 1 ? 1 : 0);
  const negative = bucket.negative
    - (bucket.currentVote === -1 ? 1 : 0)
    + (nextVote === -1 ? 1 : 0);

  return {
    positive,
    negative,
    net: positive - negative,
    currentVote: nextVote,
  };
}

export const useReviewVotesStore = create<ReviewVotesState>((set, get) => ({
  byReview: {},

  fetchSummary: async (reviewId, viewerId) => {
    const bucket = currentBucket(get(), reviewId);
    if ((bucket.loaded || bucket.isLoading) && bucket.viewerId === viewerId) return;

    set((state) => ({
      byReview: {
        ...state.byReview,
        [reviewId]: {
          ...currentBucket(state, reviewId),
          isLoading: true,
          viewerId,
          error: null,
        },
      },
    }));

    try {
      const summary = await reviewsApi.getVoteSummary(reviewId);
      set((state) => {
        const current = currentBucket(state, reviewId);
        if (current.viewerId !== viewerId) return state;

        return {
          byReview: {
            ...state.byReview,
            [reviewId]: {
              ...current,
              ...summary,
              loaded: true,
              isLoading: false,
            },
          },
        };
      });
    } catch (error) {
      const message = reportError(
        error,
        'No pudimos cargar los votos de la reseña. Intenta de nuevo.',
        () => get().fetchSummary(reviewId, viewerId),
      );
      set((state) => {
        const current = currentBucket(state, reviewId);
        if (current.viewerId !== viewerId) return state;

        return {
          byReview: {
            ...state.byReview,
            [reviewId]: { ...current, isLoading: false, error: message },
          },
        };
      });
    }
  },

  vote: async (reviewId, value, viewerId) => {
    const previous = currentBucket(get(), reviewId);
    if (previous.isVoting) return;

    set((state) => ({
      byReview: {
        ...state.byReview,
        [reviewId]: {
          ...currentBucket(state, reviewId),
          ...optimisticSummary(currentBucket(state, reviewId), value),
          loaded: true,
          isVoting: true,
          viewerId,
          error: null,
        },
      },
    }));

    try {
      const summary = await reviewsApi.vote(reviewId, value);
      set((state) => ({
        byReview: {
          ...state.byReview,
          [reviewId]: {
            ...currentBucket(state, reviewId),
            ...summary,
            loaded: true,
            isLoading: false,
            isVoting: false,
            viewerId,
            error: null,
          },
        },
      }));
    } catch (error) {
      const message = reportError(
        error,
        'No pudimos guardar tu voto. El cambio fue revertido.',
      );
      set((state) => ({
        byReview: {
          ...state.byReview,
          [reviewId]: {
            ...previous,
            isVoting: false,
            error: message,
          },
        },
      }));
      throw error;
    }
  },
}));

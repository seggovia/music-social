import { useAuthStore } from '@/features/auth/stores/authStore';
import { apiClient } from '@/shared/api/client';
import type { PaginatedResponse } from '@/shared/types';
import type {
  CreateReviewInput,
  FeedReview,
  Review,
  ReviewComment,
  ReviewFeedScope,
  UpdateReviewInput,
} from '../types';

function authOptions(): RequestInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export const reviewsApi = {
  create: (data: CreateReviewInput) =>
    apiClient.post<Review>('/reviews', data, authOptions()),

  getFeed: (scope: ReviewFeedScope, page = 1, limit = 12) =>
    apiClient.get<PaginatedResponse<FeedReview>>(
      `/reviews/feed?scope=${scope}&page=${page}&limit=${limit}`,
      authOptions(),
    ),

  getByAlbum: (albumId: string, page = 1, limit = 10) =>
    apiClient.get<PaginatedResponse<Review>>(`/reviews/album/${albumId}?page=${page}&limit=${limit}`),

  getMineByAlbum: (albumId: string) =>
    apiClient.get<Review | null>(`/reviews/album/${encodeURIComponent(albumId)}/mine`, authOptions()),

  getByUser: (userId: string, page = 1, limit = 10) =>
    apiClient.get<PaginatedResponse<Review>>(`/reviews/user/${userId}?page=${page}&limit=${limit}`),

  getById: (id: string) =>
    apiClient.get<Review>(`/reviews/${id}`),

  getComments: (reviewId: string, page = 1, limit = 10) =>
    apiClient.get<PaginatedResponse<ReviewComment>>(
      `/reviews/${encodeURIComponent(reviewId)}/comments?page=${page}&limit=${limit}`,
      authOptions(),
    ),

  createComment: (reviewId: string, content: string) =>
    apiClient.post<ReviewComment>(
      `/reviews/${encodeURIComponent(reviewId)}/comments`,
      { content },
      authOptions(),
    ),

  deleteComment: (reviewId: string, commentId: string) =>
    apiClient.delete<void>(
      `/reviews/${encodeURIComponent(reviewId)}/comments/${encodeURIComponent(commentId)}`,
      authOptions(),
    ),

  update: (id: string, data: UpdateReviewInput) =>
    apiClient.put<Review>(`/reviews/${id}`, data, authOptions()),

  delete: (id: string) =>
    apiClient.delete<void>(`/reviews/${id}`, authOptions()),
};

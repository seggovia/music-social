import { useAuthStore } from '@/features/auth/stores/authStore';
import { apiClient } from '@/shared/api/client';
import type { PaginatedResponse } from '@/shared/types';
import type { CreateReviewInput, FeedReview, Review, ReviewFeedScope, UpdateReviewInput } from '../types';

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

  getByUser: (userId: string, page = 1, limit = 10) =>
    apiClient.get<PaginatedResponse<Review>>(`/reviews/user/${userId}?page=${page}&limit=${limit}`),

  getById: (id: string) =>
    apiClient.get<Review>(`/reviews/${id}`),

  update: (id: string, data: UpdateReviewInput) =>
    apiClient.put<Review>(`/reviews/${id}`, data, authOptions()),

  delete: (id: string) =>
    apiClient.delete<void>(`/reviews/${id}`, authOptions()),
};

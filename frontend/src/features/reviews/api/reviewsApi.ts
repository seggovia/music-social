import { useAuthStore } from '@/features/auth/stores/authStore';
import { apiClient } from '@/shared/api/client';
import type { CreateReviewInput, Review, UpdateReviewInput } from '../types';

function authOptions(): RequestInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export const reviewsApi = {
  create: (data: CreateReviewInput) =>
    apiClient.post<Review>('/reviews', data, authOptions()),

  getByAlbum: (albumId: string) =>
    apiClient.get<Review[]>(`/reviews/album/${albumId}`),

  getByUser: (userId: string) =>
    apiClient.get<Review[]>(`/reviews/user/${userId}`),

  getById: (id: string) =>
    apiClient.get<Review>(`/reviews/${id}`),

  update: (id: string, data: UpdateReviewInput) =>
    apiClient.put<Review>(`/reviews/${id}`, data, authOptions()),

  delete: (id: string) =>
    apiClient.delete<void>(`/reviews/${id}`, authOptions()),
};

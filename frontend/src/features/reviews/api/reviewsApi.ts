import type { CreateReviewInput, Review, UpdateReviewInput } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { useAuthStore } = await import('@/features/auth/stores/authStore');
  const token = useAuthStore.getState().accessToken;
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const reviewsApi = {
  create: (data: CreateReviewInput) =>
    request<Review>('/reviews', { method: 'POST', body: JSON.stringify(data) }),

  getByAlbum: (albumId: string) =>
    request<Review[]>(`/reviews/album/${albumId}`),

  getByUser: (userId: string) =>
    request<Review[]>(`/reviews/user/${userId}`),

  getById: (id: string) =>
    request<Review>(`/reviews/${id}`),

  update: (id: string, data: UpdateReviewInput) =>
    request<Review>(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<void>(`/reviews/${id}`, { method: 'DELETE' }),
};
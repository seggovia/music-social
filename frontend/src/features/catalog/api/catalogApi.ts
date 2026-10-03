import { useAuthStore } from '@/features/auth/stores/authStore';
import { apiClient } from '@/shared/api/client';
import type { PaginatedResponse } from '@/shared/types';
import type { AlbumListenedState, CatalogAlbum } from '../types';

function authOptions(): RequestInit {
  const token = useAuthStore.getState().accessToken;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export const catalogApi = {
  getAlbumState: (albumId: string) =>
    apiClient.get<AlbumListenedState>(
      `/catalog/albums/${encodeURIComponent(albumId)}`,
      authOptions(),
    ),

  toggleAlbum: (albumId: string) =>
    apiClient.post<AlbumListenedState>(
      `/catalog/albums/${encodeURIComponent(albumId)}/toggle`,
      {},
      authOptions(),
    ),

  listByUser: (userId: string, page = 1, limit = 12) =>
    apiClient.get<PaginatedResponse<CatalogAlbum>>(
      `/catalog/users/${encodeURIComponent(userId)}?page=${page}&limit=${limit}`,
    ),
};

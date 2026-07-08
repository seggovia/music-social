import { apiClient } from '@/shared/api/client';
import type { PaginatedResponse } from '@/shared/types';
import type { Album } from '../types';

export const albumsApi = {
  searchAlbums: (query: string, page = 1, limit = 20) =>
    apiClient.get<PaginatedResponse<Album>>(
      `/albums/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    ),
  getAlbum: (id: string) => apiClient.get<Album>(`/albums/${encodeURIComponent(id)}`),
};

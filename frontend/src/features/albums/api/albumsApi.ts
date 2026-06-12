import { apiClient } from '@/shared/api/client';
import type { Album } from '../types';

export const albumsApi = {
  searchAlbums: (query: string) => apiClient.get<Album[]>(`/albums/search?q=${encodeURIComponent(query)}`),
  getAlbum: (id: string) => apiClient.get<Album>(`/albums/${encodeURIComponent(id)}`),
};

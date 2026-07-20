import { apiClient } from '@/shared/api/client';
import type { PaginatedResponse } from '@/shared/types';
import type { Artist, ArtistSummary } from '../types';

export const artistsApi = {
  searchArtists: (query: string, page = 1, limit = 20) =>
    apiClient.get<PaginatedResponse<ArtistSummary>>(
      `/artists/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    ),

  getPopularArtists: (page = 1, limit = 12) =>
    apiClient.get<PaginatedResponse<ArtistSummary>>(
      `/artists/popular?page=${page}&limit=${limit}`,
    ),

  getArtist: (mbid: string) =>
    apiClient.get<Artist>(`/artists/${encodeURIComponent(mbid)}`),
};

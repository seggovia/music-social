import { create } from 'zustand';
import { reportError } from '@/shared/lib/errors';
import { artistsApi } from '../api/artistsApi';
import type { Artist, ArtistSummary } from '../types';

const ARTIST_SEARCH_LIMIT = 20;
const FEATURED_ARTISTS_LIMIT = 12;

interface ArtistsState {
  featured: ArtistSummary[];
  results: ArtistSummary[];
  currentArtist: Artist | null;
  isLoading: boolean;
  isSearching: boolean;
  isLoadingMore: boolean;
  isFeaturedLoading: boolean;
  error: string | null;
  query: string;
  page: number;
  hasMore: boolean;
  total: number;
  fetchPopular: () => Promise<void>;
  search: (query: string) => Promise<void>;
  loadMore: () => Promise<void>;
  fetchArtist: (mbid: string) => Promise<void>;
}

export const useArtistsStore = create<ArtistsState>((set, get) => ({
  featured: [],
  results: [],
  currentArtist: null,
  isLoading: false,
  isSearching: false,
  isLoadingMore: false,
  isFeaturedLoading: false,
  error: null,
  query: '',
  page: 1,
  hasMore: false,
  total: 0,

  fetchPopular: async () => {
    set({ isFeaturedLoading: true, error: null });
    try {
      const response = await artistsApi.getPopularArtists(1, FEATURED_ARTISTS_LIMIT);
      set({
        featured: response.data,
        isFeaturedLoading: false,
      });
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar artistas destacados. Intenta de nuevo.', () => get().fetchPopular());
      set({ error: message, isFeaturedLoading: false });
    }
  },

  search: async (query: string) => {
    set({ query, page: 1, results: [], isSearching: true, isLoadingMore: false, error: null });
    try {
      const response = await artistsApi.searchArtists(query, 1, ARTIST_SEARCH_LIMIT);
      set({
        results: response.data,
        page: response.meta.page,
        hasMore: response.meta.hasMore,
        total: response.meta.total,
        isSearching: false,
      });
    } catch (error) {
      const message = reportError(error, 'No pudimos buscar artistas. Intenta de nuevo.', () => get().search(query));
      set({ error: message, isSearching: false });
    }
  },

  loadMore: async () => {
    const { query, page, hasMore, isLoadingMore } = get();
    if (!query || !hasMore || isLoadingMore) return;

    const nextPage = page + 1;
    set({ isLoadingMore: true, error: null });
    try {
      const response = await artistsApi.searchArtists(query, nextPage, ARTIST_SEARCH_LIMIT);
      set((state) => ({
        results: [...state.results, ...response.data],
        page: response.meta.page,
        hasMore: response.meta.hasMore,
        total: response.meta.total,
        isLoadingMore: false,
      }));
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar mas artistas. Intenta de nuevo.', () => get().loadMore());
      set({ error: message, isLoadingMore: false });
    }
  },

  fetchArtist: async (mbid: string) => {
    set({ currentArtist: null, isLoading: true, error: null });
    try {
      const artist = await artistsApi.getArtist(mbid);
      set({ currentArtist: artist, isLoading: false });
    } catch (e) {
      const message = reportError(e, 'No pudimos cargar el artista. Intenta de nuevo.', () => get().fetchArtist(mbid));
      set({ error: message, isLoading: false });
    }
  },
}));

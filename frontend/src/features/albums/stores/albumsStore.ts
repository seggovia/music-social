import { create } from 'zustand';
import { reportError } from '@/shared/lib/errors';
import { albumsApi } from '../api/albumsApi';
import type { AlbumsState } from '../types';

const ALBUM_SEARCH_LIMIT = 20;

export const useAlbumsStore = create<AlbumsState>((set, get) => ({
  results: [],
  currentAlbum: null,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  query: '',
  page: 1,
  hasMore: false,
  total: 0,

  search: async (query: string) => {
    set({ query, page: 1, results: [], isLoading: true, isLoadingMore: false, error: null });
    try {
      const response = await albumsApi.searchAlbums(query, 1, ALBUM_SEARCH_LIMIT);
      set({
        results: response.data,
        page: response.meta.page,
        hasMore: response.meta.hasMore,
        total: response.meta.total,
        isLoading: false,
      });
    } catch (error) {
      const message = reportError(error, 'No pudimos buscar albumes. Intenta de nuevo.', () => get().search(query));
      set({ error: message, isLoading: false });
    }
  },

  loadMore: async () => {
    const { query, page, hasMore, isLoadingMore } = get();
    if (!query || !hasMore || isLoadingMore) return;

    const nextPage = page + 1;
    set({ isLoadingMore: true, error: null });
    try {
      const response = await albumsApi.searchAlbums(query, nextPage, ALBUM_SEARCH_LIMIT);
      set((state) => ({
        results: [...state.results, ...response.data],
        page: response.meta.page,
        hasMore: response.meta.hasMore,
        total: response.meta.total,
        isLoadingMore: false,
      }));
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar mas albumes. Intenta de nuevo.', () => get().loadMore());
      set({ error: message, isLoadingMore: false });
    }
  },

  fetchAlbum: async (id: string) => {
    set({ currentAlbum: null, isLoading: true, error: null });
    try {
      const currentAlbum = await albumsApi.getAlbum(id);
      set({ currentAlbum, isLoading: false });
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar el album. Intenta de nuevo.', () => get().fetchAlbum(id));
      set({ error: message, isLoading: false });
    }
  },
}));

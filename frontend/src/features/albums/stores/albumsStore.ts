import { create } from 'zustand';
import { reportError } from '@/shared/lib/errors';
import { albumsApi } from '../api/albumsApi';
import type { AlbumsState } from '../types';

export const useAlbumsStore = create<AlbumsState>((set, get) => ({
  results: [],
  currentAlbum: null,
  isLoading: false,
  error: null,
  search: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const results = await albumsApi.searchAlbums(query);
      set({ results, isLoading: false });
    } catch (error) {
      const message = reportError(error, 'No pudimos buscar álbumes. Intenta de nuevo.', () => get().search(query));
      set({ error: message, isLoading: false });
    }
  },
  fetchAlbum: async (id: string) => {
    set({ currentAlbum: null, isLoading: true, error: null });
    try {
      const currentAlbum = await albumsApi.getAlbum(id);
      set({ currentAlbum, isLoading: false });
    } catch (error) {
      const message = reportError(error, 'No pudimos cargar el álbum. Intenta de nuevo.', () => get().fetchAlbum(id));
      set({ error: message, isLoading: false });
    }
  },
}));

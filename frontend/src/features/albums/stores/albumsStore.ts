import { create } from 'zustand';
import { albumsApi } from '../api/albumsApi';
import type { AlbumsState } from '../types';

export const useAlbumsStore = create<AlbumsState>((set) => ({
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
      set({ error: error instanceof Error ? error.message : 'Failed to search albums', isLoading: false });
      throw error;
    }
  },
  fetchAlbum: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const currentAlbum = await albumsApi.getAlbum(id);
      set({ currentAlbum, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch album', isLoading: false });
      throw error;
    }
  },
}));

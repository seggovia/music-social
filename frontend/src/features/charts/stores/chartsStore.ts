import { create } from 'zustand';
import { apiClient } from '@/shared/api/client';
import { reportError } from '@/shared/lib/errors';
import type { ChartAlbum, ChartTab, Genre } from '../types';

interface ChartsState {
  activeTab: ChartTab;
  albums: ChartAlbum[];
  genres: Genre[];
  selectedYear: number;
  selectedGenreSlug: string | null;
  isLoading: boolean;
  error: string | null;
  fetchTab: (tab: ChartTab) => Promise<void>;
  fetchGenres: () => Promise<void>;
  setYear: (year: number) => void;
  setGenre: (slug: string) => void;
}

export const useChartsStore = create<ChartsState>((set, get) => ({
  activeTab: 'most-reviewed',
  albums: [],
  genres: [],
  selectedYear: new Date().getFullYear(),
  selectedGenreSlug: null,
  isLoading: false,
  error: null,

  fetchTab: async (tab: ChartTab) => {
    set({ isLoading: true, error: null, activeTab: tab });
    try {
      let albums: ChartAlbum[] = [];
      switch (tab) {
        case 'most-reviewed':
          albums = await apiClient.get<ChartAlbum[]>('/charts/most-reviewed');
          break;
        case 'top-all-time':
          albums = await apiClient.get<ChartAlbum[]>('/charts/top-all-time');
          break;
        case 'top-by-year':
          albums = await apiClient.get<ChartAlbum[]>(`/charts/top-by-year/${get().selectedYear}`);
          break;
        case 'top-by-genre': {
          const slug = get().selectedGenreSlug;
          if (slug) albums = await apiClient.get<ChartAlbum[]>(`/charts/top-by-genre/${slug}`);
          break;
        }
      }
      set({ albums, isLoading: false });
    } catch (e) {
      const message = reportError(e, 'No pudimos cargar el ranking. Intenta de nuevo.', () => get().fetchTab(tab));
      set({ error: message, isLoading: false });
    }
  },

  fetchGenres: async () => {
    try {
      const genres = await apiClient.get<Genre[]>('/charts/genres');
      set({ genres, selectedGenreSlug: genres[0]?.slug ?? null });
    } catch (e) {
      reportError(e, 'No pudimos cargar los géneros. Intenta de nuevo.', () => get().fetchGenres());
      set({ genres: [] });
    }
  },

  setYear: (year: number) => {
    set({ selectedYear: year });
    void get().fetchTab('top-by-year');
  },

  setGenre: (slug: string) => {
    set({ selectedGenreSlug: slug });
    void get().fetchTab('top-by-genre');
  },
}));

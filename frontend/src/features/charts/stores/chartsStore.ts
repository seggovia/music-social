import { create } from 'zustand';
import type { ChartAlbum, ChartTab, Genre } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

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

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json() as Promise<T>;
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
          albums = await getJson<ChartAlbum[]>('/charts/most-reviewed');
          break;
        case 'top-all-time':
          albums = await getJson<ChartAlbum[]>('/charts/top-all-time');
          break;
        case 'top-by-year':
          albums = await getJson<ChartAlbum[]>(`/charts/top-by-year/${get().selectedYear}`);
          break;
        case 'top-by-genre': {
          const slug = get().selectedGenreSlug;
          if (slug) albums = await getJson<ChartAlbum[]>(`/charts/top-by-genre/${slug}`);
          break;
        }
      }
      set({ albums, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load chart', isLoading: false });
    }
  },

  fetchGenres: async () => {
    try {
      const genres = await getJson<Genre[]>('/charts/genres');
      set({ genres, selectedGenreSlug: genres[0]?.slug ?? null });
    } catch {
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
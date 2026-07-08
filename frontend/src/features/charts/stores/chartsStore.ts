import { create } from 'zustand';
import { apiClient } from '@/shared/api/client';
import { reportError } from '@/shared/lib/errors';
import type { PaginatedResponse } from '@/shared/types';
import type { ChartAlbum, ChartTab, Genre } from '../types';

const CHART_LIMIT = 20;

interface ChartsState {
  activeTab: ChartTab;
  albums: ChartAlbum[];
  genres: Genre[];
  selectedYear: number;
  selectedGenreSlug: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  total: number;
  fetchTab: (tab: ChartTab) => Promise<void>;
  loadMore: () => Promise<void>;
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
  isLoadingMore: false,
  error: null,
  page: 1,
  hasMore: false,
  total: 0,

  fetchTab: async (tab: ChartTab) => {
    set({ albums: [], page: 1, hasMore: false, total: 0, isLoading: true, isLoadingMore: false, error: null, activeTab: tab });
    try {
      let response: PaginatedResponse<ChartAlbum> | null = null;
      switch (tab) {
        case 'most-reviewed':
          response = await apiClient.get<PaginatedResponse<ChartAlbum>>(`/charts/most-reviewed?page=1&limit=${CHART_LIMIT}`);
          break;
        case 'top-all-time':
          response = await apiClient.get<PaginatedResponse<ChartAlbum>>(`/charts/top-all-time?page=1&limit=${CHART_LIMIT}`);
          break;
        case 'top-by-year':
          response = await apiClient.get<PaginatedResponse<ChartAlbum>>(`/charts/top-by-year/${get().selectedYear}?page=1&limit=${CHART_LIMIT}`);
          break;
        case 'top-by-genre': {
          const slug = get().selectedGenreSlug;
          if (slug) response = await apiClient.get<PaginatedResponse<ChartAlbum>>(`/charts/top-by-genre/${slug}?page=1&limit=${CHART_LIMIT}`);
          break;
        }
      }
      set({
        albums: response?.data ?? [],
        page: response?.meta.page ?? 1,
        hasMore: response?.meta.hasMore ?? false,
        total: response?.meta.total ?? 0,
        isLoading: false,
      });
    } catch (e) {
      const message = reportError(e, 'No pudimos cargar el ranking. Intenta de nuevo.', () => get().fetchTab(tab));
      set({ error: message, isLoading: false });
    }
  },

  loadMore: async () => {
    const { activeTab, page, hasMore, isLoadingMore, selectedYear, selectedGenreSlug } = get();
    if (!hasMore || isLoadingMore) return;

    const nextPage = page + 1;
    set({ isLoadingMore: true, error: null });
    try {
      let response: PaginatedResponse<ChartAlbum> | null = null;
      switch (activeTab) {
        case 'most-reviewed':
          response = await apiClient.get<PaginatedResponse<ChartAlbum>>(`/charts/most-reviewed?page=${nextPage}&limit=${CHART_LIMIT}`);
          break;
        case 'top-all-time':
          response = await apiClient.get<PaginatedResponse<ChartAlbum>>(`/charts/top-all-time?page=${nextPage}&limit=${CHART_LIMIT}`);
          break;
        case 'top-by-year':
          response = await apiClient.get<PaginatedResponse<ChartAlbum>>(`/charts/top-by-year/${selectedYear}?page=${nextPage}&limit=${CHART_LIMIT}`);
          break;
        case 'top-by-genre':
          if (selectedGenreSlug) {
            response = await apiClient.get<PaginatedResponse<ChartAlbum>>(`/charts/top-by-genre/${selectedGenreSlug}?page=${nextPage}&limit=${CHART_LIMIT}`);
          }
          break;
      }

      set((state) => ({
        albums: [...state.albums, ...(response?.data ?? [])],
        page: response?.meta.page ?? state.page,
        hasMore: response?.meta.hasMore ?? false,
        total: response?.meta.total ?? state.total,
        isLoadingMore: false,
      }));
    } catch (e) {
      const message = reportError(e, 'No pudimos cargar mas resultados. Intenta de nuevo.', () => get().loadMore());
      set({ error: message, isLoadingMore: false });
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

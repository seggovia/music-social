import { create } from 'zustand';
import { reportError } from '@/shared/lib/errors';
import { catalogApi } from '../api/catalogApi';
import type { AlbumListenedState, CatalogAlbum } from '../types';

const CATALOG_LIMIT = 12;
let latestCatalogRequestId = 0;

interface AlbumStateBucket extends AlbumListenedState {
  loaded: boolean;
  isLoading: boolean;
  isToggling: boolean;
  viewerId: string | null;
  error: string | null;
}

export const EMPTY_ALBUM_STATE: AlbumStateBucket = {
  listened: false,
  explicit: false,
  inferredFromReview: false,
  loaded: false,
  isLoading: false,
  isToggling: false,
  viewerId: null,
  error: null,
};

interface CatalogState {
  items: CatalogAlbum[];
  catalogUserId: string | null;
  page: number;
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  albumStates: Record<string, AlbumStateBucket>;
  fetchCatalog: (userId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  fetchAlbumState: (albumId: string, viewerId: string) => Promise<void>;
  toggleAlbum: (albumId: string, viewerId: string) => Promise<void>;
  markReviewed: (albumId: string, reviewed: boolean) => void;
}

function currentAlbumState(state: CatalogState, albumId: string) {
  return state.albumStates[albumId] ?? EMPTY_ALBUM_STATE;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  items: [],
  catalogUserId: null,
  page: 1,
  total: 0,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  albumStates: {},

  fetchCatalog: async (userId) => {
    const requestId = ++latestCatalogRequestId;
    set({
      items: [],
      catalogUserId: userId,
      page: 1,
      total: 0,
      hasMore: false,
      isLoading: true,
      isLoadingMore: false,
      error: null,
    });

    try {
      const response = await catalogApi.listByUser(userId, 1, CATALOG_LIMIT);
      if (requestId !== latestCatalogRequestId) return;
      set({
        items: response.data,
        page: response.meta.page,
        total: response.meta.total,
        hasMore: response.meta.hasMore,
        isLoading: false,
      });
    } catch (error) {
      if (requestId !== latestCatalogRequestId) return;
      const message = reportError(
        error,
        'No pudimos cargar los álbumes escuchados. Intenta de nuevo.',
        () => get().fetchCatalog(userId),
      );
      set({ error: message, isLoading: false });
    }
  },

  loadMore: async () => {
    const { catalogUserId, page, hasMore, isLoading, isLoadingMore } = get();
    if (!catalogUserId || !hasMore || isLoading || isLoadingMore) return;

    const requestId = latestCatalogRequestId;
    const nextPage = page + 1;
    set({ isLoadingMore: true, error: null });

    try {
      const response = await catalogApi.listByUser(catalogUserId, nextPage, CATALOG_LIMIT);
      if (requestId !== latestCatalogRequestId || get().catalogUserId !== catalogUserId) return;
      set((state) => ({
        items: [...state.items, ...response.data],
        page: response.meta.page,
        total: response.meta.total,
        hasMore: response.meta.hasMore,
        isLoadingMore: false,
      }));
    } catch (error) {
      if (requestId !== latestCatalogRequestId) return;
      const message = reportError(
        error,
        'No pudimos cargar más álbumes escuchados. Intenta de nuevo.',
        () => get().loadMore(),
      );
      set({ error: message, isLoadingMore: false });
    }
  },

  fetchAlbumState: async (albumId, viewerId) => {
    const bucket = currentAlbumState(get(), albumId);
    if (bucket.isLoading && bucket.viewerId === viewerId) return;

    set((state) => ({
      albumStates: {
        ...state.albumStates,
        [albumId]: {
          ...currentAlbumState(state, albumId),
          isLoading: true,
          viewerId,
          error: null,
        },
      },
    }));

    try {
      const albumState = await catalogApi.getAlbumState(albumId);
      set((state) => {
        const current = currentAlbumState(state, albumId);
        if (current.viewerId !== viewerId) return state;
        return {
          albumStates: {
            ...state.albumStates,
            [albumId]: {
              ...current,
              ...albumState,
              loaded: true,
              isLoading: false,
            },
          },
        };
      });
    } catch (error) {
      const message = reportError(
        error,
        'No pudimos consultar si escuchaste este álbum.',
        () => get().fetchAlbumState(albumId, viewerId),
      );
      set((state) => ({
        albumStates: {
          ...state.albumStates,
          [albumId]: {
            ...currentAlbumState(state, albumId),
            isLoading: false,
            error: message,
          },
        },
      }));
    }
  },

  toggleAlbum: async (albumId, viewerId) => {
    const previous = currentAlbumState(get(), albumId);
    if (previous.isToggling || previous.inferredFromReview) return;

    set((state) => ({
      albumStates: {
        ...state.albumStates,
        [albumId]: {
          ...currentAlbumState(state, albumId),
          isToggling: true,
          viewerId,
          error: null,
        },
      },
    }));

    try {
      const albumState = await catalogApi.toggleAlbum(albumId);
      set((state) => ({
        albumStates: {
          ...state.albumStates,
          [albumId]: {
            ...currentAlbumState(state, albumId),
            ...albumState,
            loaded: true,
            isLoading: false,
            isToggling: false,
            viewerId,
            error: null,
          },
        },
      }));
    } catch (error) {
      const message = reportError(error, 'No pudimos actualizar tu catálogo. Intenta de nuevo.');
      set((state) => ({
        albumStates: {
          ...state.albumStates,
          [albumId]: { ...previous, isToggling: false, error: message },
        },
      }));
      throw error;
    }
  },

  markReviewed: (albumId, reviewed) => {
    set((state) => {
      const current = currentAlbumState(state, albumId);
      return {
        albumStates: {
          ...state.albumStates,
          [albumId]: {
            ...current,
            listened: current.explicit || reviewed,
            inferredFromReview: reviewed,
          },
        },
      };
    });
  },
}));

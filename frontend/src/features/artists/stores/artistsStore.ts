import { create } from 'zustand';
import { apiClient } from '@/shared/api/client';
import { reportError } from '@/shared/lib/errors';
import type { Artist } from '../types';

interface ArtistsState {
  currentArtist: Artist | null;
  isLoading: boolean;
  error: string | null;
  fetchArtist: (mbid: string) => Promise<void>;
}

export const useArtistsStore = create<ArtistsState>((set, get) => ({
  currentArtist: null,
  isLoading: false,
  error: null,

  fetchArtist: async (mbid: string) => {
    set({ currentArtist: null, isLoading: true, error: null });
    try {
      const artist = await apiClient.get<Artist>(`/artists/${mbid}`);
      set({ currentArtist: artist, isLoading: false });
    } catch (e) {
      const message = reportError(e, 'No pudimos cargar el artista. Intenta de nuevo.', () => get().fetchArtist(mbid));
      set({ error: message, isLoading: false });
    }
  },
}));

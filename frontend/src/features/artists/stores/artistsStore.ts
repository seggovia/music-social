import { create } from 'zustand';
import type { Artist } from '../types';

interface ArtistsState {
  currentArtist: Artist | null;
  isLoading: boolean;
  error: string | null;
  fetchArtist: (mbid: string) => Promise<void>;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export const useArtistsStore = create<ArtistsState>((set) => ({
  currentArtist: null,
  isLoading: false,
  error: null,

  fetchArtist: async (mbid: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${BASE_URL}/artists/${mbid}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const artist = await response.json() as Artist;
      set({ currentArtist: artist, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load artist', isLoading: false });
    }
  },
}));
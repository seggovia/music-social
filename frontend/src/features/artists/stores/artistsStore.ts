import { create } from 'zustand';
import type { ArtistsState } from '../types';

export const useArtistsStore = create<ArtistsState>(() => ({}));

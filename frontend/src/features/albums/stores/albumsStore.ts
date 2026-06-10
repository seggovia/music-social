import { create } from 'zustand';
import type { AlbumsState } from '../types';

export const useAlbumsStore = create<AlbumsState>(() => ({}));

import { create } from 'zustand';
import type { AuthState } from '../types';

export const useAuthStore = create<AuthState>(() => ({}));

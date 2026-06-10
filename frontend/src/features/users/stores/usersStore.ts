import { create } from 'zustand';
import type { UsersState } from '../types';

export const useUsersStore = create<UsersState>(() => ({}));

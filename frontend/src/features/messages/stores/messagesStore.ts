import { create } from 'zustand';
import type { MessagesState } from '../types';

export const useMessagesStore = create<MessagesState>(() => ({}));

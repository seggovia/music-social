import { create } from 'zustand';
import type { ReviewsState } from '../types';

export const useReviewsStore = create<ReviewsState>(() => ({}));

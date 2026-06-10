import { supabase } from '../../config/supabase.js';

export const reviewsRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'reviews' };
  },
};

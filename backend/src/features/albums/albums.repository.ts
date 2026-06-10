import { supabase } from '../../config/supabase.js';

export const albumsRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'albums' };
  },
};

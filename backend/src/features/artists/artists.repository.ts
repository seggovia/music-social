import { supabase } from '../../config/supabase.js';

export const artistsRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'artists' };
  },
};

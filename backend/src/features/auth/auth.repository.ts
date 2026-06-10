import { supabase } from '../../config/supabase.js';

export const authRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'auth' };
  },
};

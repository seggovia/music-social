import { supabase } from '../../config/supabase.js';

export const usersRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'users' };
  },
};

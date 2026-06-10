import { supabase } from '../../config/supabase.js';

export const messagesRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'messages' };
  },
};

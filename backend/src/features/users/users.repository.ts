import { supabase } from '../../config/supabase.js';
import { AppError } from '../../shared/errors/AppError.js';

export const usersRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'users' };
  },

  async findByUsername(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, bio, created_at')
      .eq('username', username)
      .maybeSingle();

    if (error) throw new AppError('Failed to fetch user', 500, error);
    return data;
  },

  async findById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, bio, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new AppError('Failed to fetch user', 500, error);
    return data;
  },

  async list() {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new AppError('Failed to fetch users', 500, error);
    return data ?? [];
  },

  async countReviewsByUser(userId: string) {
    const { count, error } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw new AppError('Failed to count reviews', 500, error);
    return count ?? 0;
  },
};
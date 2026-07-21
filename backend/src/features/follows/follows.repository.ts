import { supabase } from '../../config/supabase.js';
import { AppError } from '../../shared/errors/AppError.js';

export const followsRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'follows' };
  },

  async create(followerId: string, followingId: string) {
    const { data, error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId })
      .select()
      .single();

    if (error) throw new AppError('Failed to follow user', 500, error);
    return data;
  },

  async remove(followerId: string, followingId: string) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw new AppError('Failed to unfollow user', 500, error);
  },

  async exists(followerId: string, followingId: string) {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (error) throw new AppError('Failed to check follow status', 500, error);
    return Boolean(data);
  },

  /** Usuarios que siguen a `userId` */
  async listFollowers(userId: string) {
    const { data, error } = await supabase
      .from('follows')
      .select('users!follows_follower_id_fkey(id, username, display_name, avatar_url)')
      .eq('following_id', userId);

    if (error) throw new AppError('Failed to fetch followers', 500, error);
    return (data ?? []).map((row: Record<string, unknown>) => row.users);
  },

  /** Usuarios a los que sigue `userId` */
  async listFollowing(userId: string) {
    const { data, error } = await supabase
      .from('follows')
      .select('users!follows_following_id_fkey(id, username, display_name, avatar_url)')
      .eq('follower_id', userId);

    if (error) throw new AppError('Failed to fetch following', 500, error);
    return (data ?? []).map((row: Record<string, unknown>) => row.users);
  },

  async listFollowingIds(userId: string) {
    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (error) throw new AppError('Failed to fetch following', 500, error);
    return (data ?? []).map((row: { following_id: string }) => row.following_id);
  },

  async countFollowers(userId: string) {
    const { count, error } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (error) throw new AppError('Failed to count followers', 500, error);
    return count ?? 0;
  },

  async countFollowing(userId: string) {
    const { count, error } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (error) throw new AppError('Failed to count following', 500, error);
    return count ?? 0;
  },
};

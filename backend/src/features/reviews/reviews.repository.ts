import { supabase } from '../../config/supabase.js';
import { AppError } from '../../shared/errors/AppError.js';

export const reviewsRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'reviews' };
  },

  async create(data: {
    user_id: string;
    album_id: string;
    rating: number;
    content: string;
  }) {
    const { data: review, error } = await supabase
      .from('reviews')
      .insert(data)
      .select('*, users(username, avatar_url)')
      .single();

    if (error) throw new AppError('Failed to create review', 500, error);
    return review;
  },

  async findByAlbum(albumId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users(username, avatar_url)')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch reviews', 500, error);
    return data ?? [];
  },

  async findByUser(userId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, albums(title, cover_url, artists(name))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch user reviews', 500, error);
    return data ?? [];
  },

  async findById(id: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users(username, avatar_url), albums(title, cover_url)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new AppError('Failed to fetch review', 500, error);
    return data;
  },

  async update(id: string, userId: string, data: { rating?: number; content?: string }) {
    const { data: review, error } = await supabase
      .from('reviews')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, users(username, avatar_url)')
      .single();

    if (error) throw new AppError('Failed to update review', 500, error);
    return review;
  },

  async delete(id: string, userId: string) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new AppError('Failed to delete review', 500, error);
  },

  async findExisting(userId: string, albumId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('album_id', albumId)
      .maybeSingle();

    if (error) throw new AppError('Failed to check existing review', 500, error);
    return data;
  },
};
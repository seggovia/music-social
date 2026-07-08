import { supabase } from '../../config/supabase.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { Pagination } from '../../shared/pagination.js';
import { createPaginatedResponse } from '../../shared/pagination.js';

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

  async findByAlbum(albumId: string, pagination?: Pagination) {
    let query = supabase
      .from('reviews')
      .select('*, users(username, avatar_url)', pagination ? { count: 'exact' } : undefined)
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });

    if (pagination) {
      query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw new AppError('Failed to fetch reviews', 500, error);
    if (pagination) return createPaginatedResponse(data ?? [], count ?? 0, pagination);
    return data ?? [];
  },

  async findByUser(userId: string, pagination?: Pagination) {
    let query = supabase
      .from('reviews')
      .select('*, albums(title, cover_url, artists(name))', pagination ? { count: 'exact' } : undefined)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (pagination) {
      query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw new AppError('Failed to fetch user reviews', 500, error);
    if (pagination) return createPaginatedResponse(data ?? [], count ?? 0, pagination);
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

import { supabase } from '../../config/supabase.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { Pagination } from '../../shared/pagination.js';
import { createPaginatedResponse } from '../../shared/pagination.js';

export const usersRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'users' };
  },

  async findByUsername(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, bio, theme_preference, created_at, spotify_url, lastfm_url, instagram_url, twitter_url, youtube_url, bandcamp_url')
      .eq('username', username)
      .maybeSingle();

    if (error) throw new AppError('Failed to fetch user', 500, error);
    return data;
  },

  async findById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, bio, theme_preference, created_at, spotify_url, lastfm_url, instagram_url, twitter_url, youtube_url, bandcamp_url')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new AppError('Failed to fetch user', 500, error);
    return data;
  },

  async list(pagination: Pagination) {
    const { data, error, count } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) throw new AppError('Failed to fetch users', 500, error);
    return createPaginatedResponse(data ?? [], count ?? 0, pagination);
  },

  async countReviewsByUser(userId: string) {
    const { count, error } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw new AppError('Failed to count reviews', 500, error);
    return count ?? 0;
  },

  /** Ranking de usuarios por cantidad de reviews (top reviewers) */
  async listWithReviewCounts() {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, reviews(id)');

    if (error) throw new AppError('Failed to fetch top reviewers', 500, error);
    return (data ?? []).map((u: Record<string, unknown>) => ({
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      reviewCount: Array.isArray(u.reviews) ? u.reviews.length : 0,
    }));
  },

  /** Para cada usuario, el género más reseñado (vía albums -> album_genres -> genres) */
  async listWithTopGenre() {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id, username, display_name, avatar_url,
        reviews(albums(album_genres(genres(name))))
      `);

    if (error) throw new AppError('Failed to fetch users by genre', 500, error);

    return (data ?? []).map((u: Record<string, unknown>) => {
      const genreCounts = new Map<string, number>();
      const reviews = Array.isArray(u.reviews) ? u.reviews : [];

      for (const review of reviews as Record<string, unknown>[]) {
        const album = review.albums as Record<string, unknown> | null;
        const albumGenres = Array.isArray(album?.album_genres) ? album!.album_genres as Record<string, unknown>[] : [];
        for (const ag of albumGenres) {
          const genre = ag.genres as Record<string, unknown> | null;
          const name = typeof genre?.name === 'string' ? genre.name : null;
          if (name) genreCounts.set(name, (genreCounts.get(name) ?? 0) + 1);
        }
      }

      let topGenre: string | null = null;
      let max = 0;
      for (const [name, count] of genreCounts) {
        if (count > max) { max = count; topGenre = name; }
      }

      return {
        id: u.id,
        username: u.username,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        topGenre,
      };
    });
  },

  /** Todas las reviews de todos los usuarios, para calcular afinidad/oposición en memoria */
  async listAllReviewsWithUser() {
    const { data, error } = await supabase
      .from('reviews')
      .select('user_id, album_id, rating, users(username, display_name, avatar_url)');

    if (error) throw new AppError('Failed to fetch reviews for comparison', 500, error);
    return data ?? [];
  },

  async update(userId: string, data: {
    display_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    spotify_url?: string | null;
    lastfm_url?: string | null;
    instagram_url?: string | null;
    twitter_url?: string | null;
    youtube_url?: string | null;
    bandcamp_url?: string | null;
    theme_preference?: 'light' | 'dark';
  }) {
    const { data: updated, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId)
      .select('id, username, display_name, avatar_url, bio, theme_preference, created_at, spotify_url, lastfm_url, instagram_url, twitter_url, youtube_url, bandcamp_url')
      .single();

    if (error) throw new AppError('Failed to update profile', 500, error);
    return updated;
  },


};

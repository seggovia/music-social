import { supabase } from '../../config/supabase.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { Pagination } from '../../shared/pagination.js';
import { createPaginatedResponse } from '../../shared/pagination.js';
import type { ReviewFeedItem } from './reviews.types.js';

interface UserJoin {
  username: string;
  avatar_url: string | null;
}

interface ArtistJoin {
  id: string;
  name: string;
}

interface AlbumJoin {
  id: string;
  title: string;
  cover_url: string | null;
  artists?: ArtistJoin | ArtistJoin[] | null;
}

interface FeedReviewRecord {
  id: string;
  user_id: string;
  album_id: string;
  rating: number | string;
  content: string | null;
  created_at: string;
  users?: UserJoin | UserJoin[] | null;
  albums?: AlbumJoin | AlbumJoin[] | null;
}

function singleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function mapFeedReview(record: FeedReviewRecord): ReviewFeedItem {
  const author = singleRelation(record.users);
  const album = singleRelation(record.albums);
  const artist = singleRelation(album?.artists);

  return {
    id: record.id,
    userId: record.user_id,
    albumId: record.album_id,
    rating: Number(record.rating),
    content: record.content ?? '',
    createdAt: record.created_at,
    author: {
      username: author?.username ?? 'Unknown user',
      avatarUrl: author?.avatar_url ?? null,
    },
    album: {
      id: album?.id ?? record.album_id,
      title: album?.title ?? 'Unknown album',
      coverUrl: album?.cover_url ?? null,
      artist: {
        id: artist?.id ?? '',
        name: artist?.name ?? 'Unknown artist',
      },
    },
  };
}

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

  async findFeed(pagination: Pagination, followingIds?: string[]) {
    if (followingIds && followingIds.length === 0) {
      return createPaginatedResponse<ReviewFeedItem>([], 0, pagination);
    }

    let query = supabase
      .from('reviews')
      .select(
        'id, user_id, album_id, rating, content, created_at, users(username, avatar_url), albums(id, title, cover_url, artists(id, name))',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (followingIds) {
      query = query.in('user_id', followingIds);
    }

    const { data, error, count } = await query.range(
      pagination.offset,
      pagination.offset + pagination.limit - 1,
    );

    if (error) throw new AppError('Failed to fetch review feed', 500, error);
    const reviews = (data ?? []).map((record) => mapFeedReview(record as FeedReviewRecord));
    return createPaginatedResponse(reviews, count ?? 0, pagination);
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

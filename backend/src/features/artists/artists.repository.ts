import { supabase } from '../../config/supabase.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { Pagination } from '../../shared/pagination.js';
import { createPaginatedResponse, paginateArray } from '../../shared/pagination.js';

interface ArtistRecord {
  id: string;
  musicbrainz_id: string | null;
  name: string;
  country: string | null;
  disambiguation: string | null;
  image_url: string | null;
  albums?: Array<{
    id: string;
    title?: string | null;
    cover_url?: string | null;
    release_date?: string | null;
    track_count?: number | null;
    reviews?: Array<{ id?: string | null }>;
  }>;
}

export const artistsRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'artists' };
  },

  async findByMbid(mbid: string) {
    const { data, error } = await supabase
      .from('artists')
      .select('*, albums(id, title, cover_url, release_date, track_count)')
      .eq('musicbrainz_id', mbid)
      .maybeSingle();

    if (error) throw new AppError('Failed to fetch artist', 500, error);
    return data;
  },

  async findById(id: string) {
    const { data, error } = await supabase
      .from('artists')
      .select('*, albums(id, title, cover_url, release_date, track_count)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new AppError('Failed to fetch artist', 500, error);
    return data;
  },

  async searchByName(query: string, pagination: Pagination) {
    const { data, error, count } = await supabase
      .from('artists')
      .select('id, musicbrainz_id, name, country, disambiguation, image_url, albums(id, reviews(id))', { count: 'exact' })
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) throw new AppError('Failed to search artists', 500, error);
    return createPaginatedResponse((data ?? []) as ArtistRecord[], count ?? 0, pagination);
  },

  async popular(pagination: Pagination) {
    const { data, error } = await supabase
      .from('artists')
      .select('id, musicbrainz_id, name, country, disambiguation, image_url, albums(id, reviews(id))');

    if (error) throw new AppError('Failed to fetch popular artists', 500, error);

    const artists = ((data ?? []) as ArtistRecord[])
      .map((artist) => {
        const albums = Array.isArray(artist.albums) ? artist.albums : [];
        const reviewCount = albums.reduce((sum, album) => (
          sum + (Array.isArray(album.reviews) ? album.reviews.length : 0)
        ), 0);

        return {
          ...artist,
          albumCount: albums.length,
          reviewCount,
        };
      })
      .sort((a, b) => (
        b.reviewCount - a.reviewCount
        || b.albumCount - a.albumCount
        || a.name.localeCompare(b.name)
      ));

    return paginateArray(artists, pagination);
  },

  async create(data: {
    musicbrainz_id: string;
    name: string;
    country?: string | null;
    disambiguation?: string | null;
    image_url?: string | null;
  }) {
    const { data: artist, error } = await supabase
      .from('artists')
      .insert(data)
      .select()
      .single();

    if (error) throw new AppError('Failed to create artist', 500, error);
    return artist;
  },
};

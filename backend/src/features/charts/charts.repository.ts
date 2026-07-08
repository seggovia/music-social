import { supabase } from '../../config/supabase.js';
import type { Pagination } from '../../shared/pagination.js';
import { paginateArray } from '../../shared/pagination.js';

interface ReviewedAlbumRow {
  id: string;
  title: string;
  cover_url: string | null;
  release_date: string | null;
  artists?: { name?: string | null } | null;
  reviews: { rating: number }[];
}

function mapAlbumRow(row: ReviewedAlbumRow) {
  const ratings = row.reviews.map((r) => r.rating);
  const reviewCount = ratings.length;
  const avgRating = reviewCount > 0
    ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / reviewCount) * 100) / 100
    : 0;

  return {
    id: row.id,
    title: row.title,
    coverUrl: row.cover_url,
    artist: row.artists?.name ?? 'Unknown Artist',
    year: row.release_date ? new Date(row.release_date).getFullYear() : null,
    avgRating,
    reviewCount,
  };
}

export const chartsRepository = {
  async healthCheck() {
    void supabase;
    return { status: 'ok', feature: 'charts' };
  },

  /** Most reviewed: álbumes ordenados por cantidad de reviews */
  async mostReviewed(pagination: Pagination) {
    const { data, error } = await supabase
      .from('albums')
      .select('id, title, cover_url, release_date, artists(name), reviews(rating)');

    if (error) throw error;

    const albums = (data ?? [])
      .map((row) => mapAlbumRow(row as ReviewedAlbumRow))
      .filter((a) => a.reviewCount >= 1)
      .sort((a, b) => b.reviewCount - a.reviewCount);

    return paginateArray(albums, pagination);
  },

  /** Top albums de todos los tiempos: ordenados por rating promedio (mínimo 1 review) */
  async topAllTime(pagination: Pagination) {
    const { data, error } = await supabase
      .from('albums')
      .select('id, title, cover_url, release_date, artists(name), reviews(rating)');

    if (error) throw error;

    const albums = (data ?? [])
      .map((row) => mapAlbumRow(row as ReviewedAlbumRow))
      .filter((a) => a.reviewCount >= 1)
      .sort((a, b) => b.avgRating - a.avgRating);

    return paginateArray(albums, pagination);
  },

  /** Top albums lanzados en un año específico, ordenados por rating promedio */
  async topByYear(year: number, pagination: Pagination) {
    const { data, error } = await supabase
      .from('albums')
      .select('id, title, cover_url, release_date, artists(name), reviews(rating)')
      .gte('release_date', `${year}-01-01`)
      .lte('release_date', `${year}-12-31`);

    if (error) throw error;

    const albums = (data ?? [])
      .map((row) => mapAlbumRow(row as ReviewedAlbumRow))
      .filter((a) => a.reviewCount >= 1)
      .sort((a, b) => b.avgRating - a.avgRating);

    return paginateArray(albums, pagination);
  },

  /** Top albums de un género específico, ordenados por rating promedio */
  async topByGenre(genreSlug: string, pagination: Pagination) {
    const { data: genre, error: genreError } = await supabase
      .from('genres')
      .select('id, name')
      .eq('slug', genreSlug)
      .maybeSingle();

    if (genreError) throw genreError;
    if (!genre) return paginateArray([], pagination);

    const { data, error } = await supabase
      .from('album_genres')
      .select('albums(id, title, cover_url, release_date, artists(name), reviews(rating))')
      .eq('genre_id', genre.id);

    if (error) throw error;

    const albums = (data ?? [])
      .map((row: Record<string, unknown>) => row.albums as ReviewedAlbumRow | null)
      .filter((album): album is ReviewedAlbumRow => album !== null)
      .map((album) => mapAlbumRow(album))
      .filter((a) => a.reviewCount >= 1)
      .sort((a, b) => b.avgRating - a.avgRating);

    return paginateArray(albums, pagination);
  },

  /** Lista de géneros disponibles para mostrar en un selector */
  async listGenres() {
    const { data, error } = await supabase
      .from('genres')
      .select('id, name, slug')
      .order('name');

    if (error) throw error;
    return data ?? [];
  },
};

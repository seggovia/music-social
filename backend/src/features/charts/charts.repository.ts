import { supabase } from '../../config/supabase.js';

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
  async mostReviewed(limit = 20) {
    const { data, error } = await supabase
      .from('albums')
      .select('id, title, cover_url, release_date, artists(name), reviews(rating)');

    if (error) throw error;

    return (data ?? [])
      .map((row) => mapAlbumRow(row as ReviewedAlbumRow))
      .filter((a) => a.reviewCount >= 1)
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, limit);
  },

  /** Top albums de todos los tiempos: ordenados por rating promedio (mínimo 1 review) */
  async topAllTime(limit = 20) {
    const { data, error } = await supabase
      .from('albums')
      .select('id, title, cover_url, release_date, artists(name), reviews(rating)');

    if (error) throw error;

    return (data ?? [])
      .map((row) => mapAlbumRow(row as ReviewedAlbumRow))
      .filter((a) => a.reviewCount >= 1)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, limit);
  },

  /** Top albums lanzados en un año específico, ordenados por rating promedio */
  async topByYear(year: number, limit = 20) {
    const { data, error } = await supabase
      .from('albums')
      .select('id, title, cover_url, release_date, artists(name), reviews(rating)')
      .gte('release_date', `${year}-01-01`)
      .lte('release_date', `${year}-12-31`);

    if (error) throw error;

    return (data ?? [])
      .map((row) => mapAlbumRow(row as ReviewedAlbumRow))
      .filter((a) => a.reviewCount >= 1)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, limit);
  },

  /** Top albums de un género específico, ordenados por rating promedio */
  async topByGenre(genreSlug: string, limit = 20) {
    const { data: genre, error: genreError } = await supabase
      .from('genres')
      .select('id, name')
      .eq('slug', genreSlug)
      .maybeSingle();

    if (genreError) throw genreError;
    if (!genre) return [];

    const { data, error } = await supabase
      .from('album_genres')
      .select('albums(id, title, cover_url, release_date, artists(name), reviews(rating))')
      .eq('genre_id', genre.id);

    if (error) throw error;

    return (data ?? [])
      .map((row: Record<string, unknown>) => row.albums as ReviewedAlbumRow | null)
      .filter((album): album is ReviewedAlbumRow => album !== null)
      .map((album) => mapAlbumRow(album))
      .filter((a) => a.reviewCount >= 1)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, limit);
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
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
};
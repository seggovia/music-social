import { AppError } from '../../shared/errors/AppError.js';
import { reviewsRepository } from '../reviews/reviews.repository.js';
import { usersRepository } from './users.repository.js';

interface ReviewRow {
  user_id: string;
  album_id: string;
  rating: number;
  users?: { username?: string; display_name?: string | null; avatar_url?: string | null } | null;
}

export const usersService = {
  async healthCheck() {
    return usersRepository.healthCheck();
  },

  async getProfile(username: string) {
    const user = await usersRepository.findByUsername(username);
    if (!user) throw new AppError('User not found', 404);

    const reviews = await reviewsRepository.findByUser(user.id);
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0
      ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewCount
      : null;

    return {
      ...user,
      reviewCount,
      avgRating,
      reviews,
    };
  },

  async list() {
    return usersRepository.list();
  },

  /** Filtro: top reviewers */
  async listTopReviewers() {
    const users = await usersRepository.listWithReviewCounts();
    return users
      .filter((u) => u.reviewCount > 0)
      .sort((a, b) => b.reviewCount - a.reviewCount);
  },

  /** Filtro: agrupados por género favorito */
  async listByGenre() {
    const users = await usersRepository.listWithTopGenre();
    return users.filter((u) => u.topGenre !== null);
  },

  /** Filtro: usuarios con gustos similares (afinidad) u opuestos, relativos a `username` */
  async listByAffinity(username: string, mode: 'similar' | 'opposite') {
    const me = await usersRepository.findByUsername(username);
    if (!me) throw new AppError('User not found', 404);

    const allReviews = await usersRepository.listAllReviewsWithUser() as ReviewRow[];

    const myRatings = new Map<string, number>();
    for (const r of allReviews) {
      if (r.user_id === me.id) myRatings.set(r.album_id, r.rating);
    }

    if (myRatings.size === 0) {
      return [];
    }

    // album_id -> { userId -> rating }, excluyendo a "me"
    const byUser = new Map<string, { username: string; display_name: string | null; avatar_url: string | null; diffs: number[] }>();

    for (const r of allReviews) {
      if (r.user_id === me.id) continue;
      if (!myRatings.has(r.album_id)) continue;

      const myRating = myRatings.get(r.album_id)!;
      const diff = Math.abs(myRating - r.rating);

      if (!byUser.has(r.user_id)) {
        byUser.set(r.user_id, {
          username: r.users?.username ?? 'unknown',
          display_name: r.users?.display_name ?? null,
          avatar_url: r.users?.avatar_url ?? null,
          diffs: [],
        });
      }
      byUser.get(r.user_id)!.diffs.push(diff);
    }

    const results = Array.from(byUser.entries())
      .filter(([, data]) => data.diffs.length >= 1)
      .map(([userId, data]) => {
        const avgDiff = data.diffs.reduce((sum, d) => sum + d, 0) / data.diffs.length;
        return {
          id: userId,
          username: data.username,
          display_name: data.display_name,
          avatar_url: data.avatar_url,
          sharedAlbums: data.diffs.length,
          avgRatingDiff: Math.round(avgDiff * 100) / 100,
        };
      });

    results.sort((a, b) =>
      mode === 'similar' ? a.avgRatingDiff - b.avgRatingDiff : b.avgRatingDiff - a.avgRatingDiff,
    );

    return results;
  },
};
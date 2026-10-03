import { AppError } from '../../shared/errors/AppError.js';
import type { Pagination } from '../../shared/pagination.js';
import { paginateArray } from '../../shared/pagination.js';
import { albumsRepository } from '../albums/albums.repository.js';
import { reviewsRepository } from '../reviews/reviews.repository.js';
import { usersRepository } from '../users/users.repository.js';
import { catalogRepository } from './catalog.repository.js';
import type { AlbumListenedState, CatalogAlbum } from './catalog.types.js';

async function assertAlbumExists(albumId: string) {
  const album = await albumsRepository.findById(albumId);
  if (!album) throw new AppError('Album not found', 404);
}

async function getState(userId: string, albumId: string): Promise<AlbumListenedState> {
  const [explicit, review] = await Promise.all([
    catalogRepository.findExplicitListened(userId, albumId),
    reviewsRepository.findExisting(userId, albumId),
  ]);
  const inferredFromReview = Boolean(review);

  return {
    listened: explicit || inferredFromReview,
    explicit,
    inferredFromReview,
  };
}

export const catalogService = {
  async getAlbumState(userId: string, albumId: string) {
    await assertAlbumExists(albumId);
    return getState(userId, albumId);
  },

  async toggleAlbum(userId: string, albumId: string) {
    await assertAlbumExists(albumId);
    const state = await getState(userId, albumId);

    // A review is authoritative evidence that the album was listened to. The
    // toggle must reject the request instead of looking successful without
    // changing the effective state.
    if (state.inferredFromReview) {
      throw new AppError(
        'Cannot unmark an album with an active review',
        409,
        undefined,
        'REVIEWED_ALBUM_CANNOT_BE_UNMARKED',
      );
    }

    if (state.explicit) {
      await catalogRepository.unmarkListened(userId, albumId);
    } else {
      await catalogRepository.markListened(userId, albumId);
    }

    return getState(userId, albumId);
  },

  async listByUser(userId: string, pagination: Pagination) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const [explicitAlbums, reviewedAlbums] = await Promise.all([
      catalogRepository.listExplicitListened(userId),
      catalogRepository.listReviewedAlbums(userId),
    ]);

    const merged = new Map<string, CatalogAlbum>();
    for (const album of explicitAlbums) merged.set(album.id, album);

    for (const album of reviewedAlbums) {
      const existing = merged.get(album.id);
      if (!existing) {
        merged.set(album.id, album);
        continue;
      }

      merged.set(album.id, {
        ...existing,
        listenedAt: existing.listenedAt > album.listenedAt
          ? existing.listenedAt
          : album.listenedAt,
        source: 'both',
      });
    }

    const sorted = [...merged.values()].sort((a, b) =>
      b.listenedAt.localeCompare(a.listenedAt) || a.id.localeCompare(b.id));
    return paginateArray(sorted, pagination);
  },
};

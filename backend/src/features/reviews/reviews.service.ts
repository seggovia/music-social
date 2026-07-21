import { AppError } from '../../shared/errors/AppError.js';
import type { Pagination } from '../../shared/pagination.js';
import { albumsRepository } from '../albums/albums.repository.js';
import { followsRepository } from '../follows/follows.repository.js';
import { reviewsRepository } from './reviews.repository.js';
import type { ReviewsFeedScope } from './reviews.types.js';

export const reviewsService = {
  async healthCheck() {
    return reviewsRepository.healthCheck();
  },

  async create(userId: string, data: { albumId: string; rating: number; content: string }) {
    if (data.rating < 0.5 || data.rating > 5) {
      throw new AppError('Rating must be between 0.5 and 5', 400);
    }
    if (!data.content.trim()) {
      throw new AppError('Review content cannot be empty', 400);
    }

    const album = await albumsRepository.findById(data.albumId);
    if (!album) throw new AppError('Album not found', 404);

    const existing = await reviewsRepository.findExisting(userId, data.albumId);
    if (existing) throw new AppError('You have already reviewed this album', 409);

    return reviewsRepository.create({
      user_id: userId,
      album_id: data.albumId,
      rating: data.rating,
      content: data.content.trim(),
    });
  },

  async getByAlbum(albumId: string, pagination: Pagination) {
    return reviewsRepository.findByAlbum(albumId, pagination);
  },

  async getFeed(viewerId: string | undefined, rawScope: string, pagination: Pagination) {
    if (rawScope !== 'all' && rawScope !== 'following') {
      throw new AppError('Invalid review feed scope', 400);
    }

    const scope = rawScope as ReviewsFeedScope;
    if (scope === 'following' && !viewerId) {
      throw new AppError('Authentication required for following feed', 401);
    }

    const followingIds = scope === 'following'
      ? await followsRepository.listFollowingIds(viewerId!)
      : undefined;

    return reviewsRepository.findFeed(pagination, followingIds);
  },

  async getByUser(userId: string, pagination: Pagination) {
    return reviewsRepository.findByUser(userId, pagination);
  },

  async getById(id: string) {
    const review = await reviewsRepository.findById(id);
    if (!review) throw new AppError('Review not found', 404);
    return review;
  },

  async update(id: string, userId: string, data: { rating?: number; content?: string }) {
    if (data.rating !== undefined && (data.rating < 0.5 || data.rating > 5)) {
      throw new AppError('Rating must be between 0.5 and 5', 400);
    }
    const review = await reviewsRepository.findById(id);
    if (!review) throw new AppError('Review not found', 404);
    if (review.user_id !== userId) throw new AppError('Not authorized', 403);

    return reviewsRepository.update(id, userId, data);
  },

  async delete(id: string, userId: string) {
    const review = await reviewsRepository.findById(id);
    if (!review) throw new AppError('Review not found', 404);
    if (review.user_id !== userId) throw new AppError('Not authorized', 403);

    await reviewsRepository.delete(id, userId);
  },
};

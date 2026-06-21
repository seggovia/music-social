import { AppError } from '../../shared/errors/AppError.js';
import { reviewsRepository } from '../reviews/reviews.repository.js';
import { usersRepository } from './users.repository.js';

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
};
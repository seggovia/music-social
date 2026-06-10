import { reviewsRepository } from './reviews.repository.js';

export const reviewsService = {
  async healthCheck() {
    return reviewsRepository.healthCheck();
  },
};

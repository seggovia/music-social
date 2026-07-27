import { AppError } from '../../../shared/errors/AppError.js';
import type { Pagination } from '../../../shared/pagination.js';
import { reviewsRepository } from '../reviews.repository.js';
import { reviewCommentsRepository } from './review-comments.repository.js';

const MAX_COMMENT_LENGTH = 2000;

function normalizeContent(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError('Review comment cannot be empty', 400);
  }

  const content = value.trim();
  if (content.length > MAX_COMMENT_LENGTH) {
    throw new AppError('Review comment is too long', 400);
  }

  return content;
}

async function assertReviewExists(reviewId: string) {
  const review = await reviewsRepository.findById(reviewId);
  if (!review) throw new AppError('Review not found', 404);
}

export const reviewCommentsService = {
  async create(reviewId: string, userId: string, content: unknown) {
    const normalizedContent = normalizeContent(content);
    await assertReviewExists(reviewId);
    return reviewCommentsRepository.create(reviewId, userId, normalizedContent);
  },

  async list(reviewId: string, pagination: Pagination) {
    await assertReviewExists(reviewId);
    return reviewCommentsRepository.findByReview(reviewId, pagination);
  },

  async delete(reviewId: string, commentId: string, userId: string) {
    const comment = await reviewCommentsRepository.findById(reviewId, commentId);
    if (!comment) throw new AppError('Review comment not found', 404);
    if (comment.user_id !== userId) {
      throw new AppError('Not authorized to delete this comment', 403);
    }

    await reviewCommentsRepository.delete(reviewId, commentId, userId);
  },
};

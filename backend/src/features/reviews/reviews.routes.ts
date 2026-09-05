import { Router } from 'express';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { authMiddleware, optionalAuthMiddleware } from '../../shared/middleware/auth.middleware.js';
import { reviewCommentsController } from './comments/review-comments.controller.js';
import { reviewsController } from './reviews.controller.js';

export const reviewsRouter = Router();

reviewsRouter.get('/', asyncHandler(reviewsController.healthCheck));
reviewsRouter.post('/', authMiddleware, asyncHandler(reviewsController.create));
reviewsRouter.get('/feed', optionalAuthMiddleware, asyncHandler(reviewsController.getFeed));
reviewsRouter.get('/album/:albumId/mine', authMiddleware, asyncHandler(reviewsController.getMineByAlbum));
reviewsRouter.get('/album/:albumId', asyncHandler(reviewsController.getByAlbum));
reviewsRouter.get('/user/:userId', asyncHandler(reviewsController.getByUser));
reviewsRouter.get('/:reviewId/comments', optionalAuthMiddleware, asyncHandler(reviewCommentsController.list));
reviewsRouter.post('/:reviewId/comments', authMiddleware, asyncHandler(reviewCommentsController.create));
reviewsRouter.delete(
  '/:reviewId/comments/:commentId',
  authMiddleware,
  asyncHandler(reviewCommentsController.delete),
);
reviewsRouter.get('/:id', asyncHandler(reviewsController.getById));
reviewsRouter.put('/:id', authMiddleware, asyncHandler(reviewsController.update));
reviewsRouter.delete('/:id', authMiddleware, asyncHandler(reviewsController.delete));

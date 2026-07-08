import { Router } from 'express';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { reviewsController } from './reviews.controller.js';

export const reviewsRouter = Router();

reviewsRouter.get('/', asyncHandler(reviewsController.healthCheck));
reviewsRouter.post('/', authMiddleware, asyncHandler(reviewsController.create));
reviewsRouter.get('/album/:albumId', asyncHandler(reviewsController.getByAlbum));
reviewsRouter.get('/user/:userId', asyncHandler(reviewsController.getByUser));
reviewsRouter.get('/:id', asyncHandler(reviewsController.getById));
reviewsRouter.put('/:id', authMiddleware, asyncHandler(reviewsController.update));
reviewsRouter.delete('/:id', authMiddleware, asyncHandler(reviewsController.delete));

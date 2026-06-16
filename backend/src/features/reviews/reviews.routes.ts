import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { reviewsController } from './reviews.controller.js';

export const reviewsRouter = Router();

reviewsRouter.get('/', reviewsController.healthCheck);
reviewsRouter.post('/', authMiddleware, reviewsController.create);
reviewsRouter.get('/album/:albumId', reviewsController.getByAlbum);
reviewsRouter.get('/user/:userId', reviewsController.getByUser);
reviewsRouter.get('/:id', reviewsController.getById);
reviewsRouter.put('/:id', authMiddleware, reviewsController.update);
reviewsRouter.delete('/:id', authMiddleware, reviewsController.delete);
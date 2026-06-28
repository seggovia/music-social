import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../../shared/middleware/auth.middleware.js';
import { followsController } from './follows.controller.js';

export const followsRouter = Router();

followsRouter.get('/', followsController.healthCheck);
followsRouter.get('/:userId/followers', followsController.getFollowers);
followsRouter.get('/:userId/following', followsController.getFollowing);
followsRouter.get('/:userId/stats', optionalAuthMiddleware, followsController.getStats);
followsRouter.post('/:userId', authMiddleware, followsController.follow);
followsRouter.delete('/:userId', authMiddleware, followsController.unfollow);
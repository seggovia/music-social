import { Router } from 'express';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { authMiddleware, optionalAuthMiddleware } from '../../shared/middleware/auth.middleware.js';
import { followsController } from './follows.controller.js';

export const followsRouter = Router();

followsRouter.get('/', asyncHandler(followsController.healthCheck));
followsRouter.get('/:userId/followers', asyncHandler(followsController.getFollowers));
followsRouter.get('/:userId/following', asyncHandler(followsController.getFollowing));
followsRouter.get('/:userId/stats', optionalAuthMiddleware, asyncHandler(followsController.getStats));
followsRouter.post('/:userId', authMiddleware, asyncHandler(followsController.follow));
followsRouter.delete('/:userId', authMiddleware, asyncHandler(followsController.unfollow));

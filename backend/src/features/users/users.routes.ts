import { Router } from 'express';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { usersController } from './users.controller.js';

export const usersRouter = Router();

usersRouter.get('/', asyncHandler(usersController.list));
usersRouter.get('/filters/top-reviewers', asyncHandler(usersController.topReviewers));
usersRouter.get('/filters/by-genre', asyncHandler(usersController.byGenre));
usersRouter.get('/filters/similar/:username', asyncHandler(usersController.similar));
usersRouter.get('/filters/opposite/:username', asyncHandler(usersController.opposite));
usersRouter.get('/:username', asyncHandler(usersController.getProfile));
usersRouter.put('/:username', authMiddleware, asyncHandler(usersController.updateProfile));

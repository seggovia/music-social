import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { usersController } from './users.controller.js';

export const usersRouter = Router();

usersRouter.get('/', usersController.list);
usersRouter.get('/filters/top-reviewers', usersController.topReviewers);
usersRouter.get('/filters/by-genre', usersController.byGenre);
usersRouter.get('/filters/similar/:username', usersController.similar);
usersRouter.get('/filters/opposite/:username', usersController.opposite);
usersRouter.get('/:username', usersController.getProfile);
usersRouter.put('/:username', authMiddleware, usersController.updateProfile);
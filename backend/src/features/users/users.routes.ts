import { Router } from 'express';
import { usersController } from './users.controller.js';

export const usersRouter = Router();

usersRouter.get('/', usersController.list);
usersRouter.get('/filters/top-reviewers', usersController.topReviewers);
usersRouter.get('/filters/by-genre', usersController.byGenre);
usersRouter.get('/filters/similar/:username', usersController.similar);
usersRouter.get('/filters/opposite/:username', usersController.opposite);
usersRouter.get('/:username', usersController.getProfile);
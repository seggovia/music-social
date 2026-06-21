import { Router } from 'express';
import { usersController } from './users.controller.js';

export const usersRouter = Router();

usersRouter.get('/', usersController.list);
usersRouter.get('/:username', usersController.getProfile);
import { Router } from 'express';
import { albumsController } from './albums.controller.js';

export const albumsRouter = Router();

albumsRouter.get('/', albumsController.healthCheck);

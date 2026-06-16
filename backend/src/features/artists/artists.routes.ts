import { Router } from 'express';
import { artistsController } from './artists.controller.js';

export const artistsRouter = Router();

artistsRouter.get('/', artistsController.healthCheck);
artistsRouter.get('/:mbid', artistsController.getByMbid);
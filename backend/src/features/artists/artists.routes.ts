import { Router } from 'express';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { artistsController } from './artists.controller.js';

export const artistsRouter = Router();

artistsRouter.get('/', asyncHandler(artistsController.healthCheck));
artistsRouter.get('/:mbid', asyncHandler(artistsController.getByMbid));

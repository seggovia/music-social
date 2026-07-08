import { Router } from 'express';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { albumsController } from './albums.controller.js';

export const albumsRouter = Router();

albumsRouter.get('/search', asyncHandler(albumsController.search));
albumsRouter.get('/:id', asyncHandler(albumsController.getAlbum));
albumsRouter.get('/', asyncHandler(albumsController.healthCheck));

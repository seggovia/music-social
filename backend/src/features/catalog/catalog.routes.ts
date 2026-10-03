import { Router } from 'express';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { catalogController } from './catalog.controller.js';

export const catalogRouter = Router();

catalogRouter.get('/users/:userId', asyncHandler(catalogController.listByUser));
catalogRouter.get('/albums/:albumId', authMiddleware, asyncHandler(catalogController.getAlbumState));
catalogRouter.post('/albums/:albumId/toggle', authMiddleware, asyncHandler(catalogController.toggleAlbum));

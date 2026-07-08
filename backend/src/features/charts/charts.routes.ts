import { Router } from 'express';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { chartsController } from './charts.controller.js';

export const chartsRouter = Router();

chartsRouter.get('/', asyncHandler(chartsController.healthCheck));
chartsRouter.get('/most-reviewed', asyncHandler(chartsController.mostReviewed));
chartsRouter.get('/top-all-time', asyncHandler(chartsController.topAllTime));
chartsRouter.get('/top-by-year/:year', asyncHandler(chartsController.topByYear));
chartsRouter.get('/genres', asyncHandler(chartsController.listGenres));
chartsRouter.get('/top-by-genre/:genre', asyncHandler(chartsController.topByGenre));

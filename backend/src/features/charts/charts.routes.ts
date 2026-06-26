import { Router } from 'express';
import { chartsController } from './charts.controller.js';

export const chartsRouter = Router();

chartsRouter.get('/', chartsController.healthCheck);
chartsRouter.get('/most-reviewed', chartsController.mostReviewed);
chartsRouter.get('/top-all-time', chartsController.topAllTime);
chartsRouter.get('/top-by-year/:year', chartsController.topByYear);
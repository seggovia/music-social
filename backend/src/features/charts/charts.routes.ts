import { Router } from 'express';
import { chartsController } from './charts.controller.js';

export const chartsRouter = Router();

chartsRouter.get('/', chartsController.healthCheck);
chartsRouter.get('/most-reviewed', chartsController.mostReviewed);
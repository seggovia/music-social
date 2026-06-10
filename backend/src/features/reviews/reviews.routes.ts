import { Router } from 'express';
import { reviewsController } from './reviews.controller.js';

export const reviewsRouter = Router();

reviewsRouter.get('/', reviewsController.healthCheck);

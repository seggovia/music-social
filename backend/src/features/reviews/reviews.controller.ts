import type { RequestHandler } from 'express';
import { reviewsService } from './reviews.service.js';

export const reviewsController = {
  healthCheck: (async (_req, res) => {
    const result = await reviewsService.healthCheck();
    res.json(result);
  }) as RequestHandler,
};

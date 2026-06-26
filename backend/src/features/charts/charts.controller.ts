import type { RequestHandler } from 'express';
import { chartsService } from './charts.service.js';

export const chartsController = {
  healthCheck: (async (_req, res) => {
    const result = await chartsService.healthCheck();
    res.json(result);
  }) as RequestHandler,

  mostReviewed: (async (_req, res) => {
    const albums = await chartsService.mostReviewed();
    res.json(albums);
  }) as RequestHandler,
  topAllTime: (async (_req, res) => {
    const albums = await chartsService.topAllTime();
    res.json(albums);
  }) as RequestHandler,
};
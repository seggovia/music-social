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
  topByYear: (async (req, res) => {
    const year = Number(req.params.year);
    const albums = await chartsService.topByYear(year);
    res.json(albums);
  }) as RequestHandler,
};
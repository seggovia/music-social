import type { RequestHandler } from 'express';
import { artistsService } from './artists.service.js';

export const artistsController = {
  healthCheck: (async (_req, res) => {
    const result = await artistsService.healthCheck();
    res.json(result);
  }) as RequestHandler,
};

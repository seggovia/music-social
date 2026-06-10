import type { RequestHandler } from 'express';
import { albumsService } from './albums.service.js';

export const albumsController = {
  healthCheck: (async (_req, res) => {
    const result = await albumsService.healthCheck();
    res.json(result);
  }) as RequestHandler,
};

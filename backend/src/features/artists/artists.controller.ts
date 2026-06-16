import type { RequestHandler } from 'express';
import { artistsService } from './artists.service.js';

export const artistsController = {
  healthCheck: (async (_req, res) => {
    const result = await artistsService.healthCheck();
    res.json(result);
  }) as RequestHandler,

  getByMbid: (async (req, res) => {
    const mbid = req.params.mbid as string;
    const artist = await artistsService.getOrCache(mbid);
    res.json(artist);
  }) as RequestHandler,
};
import type { RequestHandler } from 'express';
import { albumsService } from './albums.service.js';

export const albumsController = {
  healthCheck: (async (_req, res) => {
    const result = await albumsService.healthCheck();
    res.json(result);
  }) as RequestHandler,

  search: (async (req, res, next) => {
    try {
      const query = String(req.query.q ?? '').trim();
      const result = await albumsService.search(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  getAlbum: (async (req, res, next) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await albumsService.getOrCache(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,
};

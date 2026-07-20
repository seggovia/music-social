import type { RequestHandler } from 'express';
import { parsePagination } from '../../shared/pagination.js';
import { artistsService } from './artists.service.js';

export const artistsController = {
  healthCheck: (async (_req, res) => {
    const result = await artistsService.healthCheck();
    res.json(result);
  }) as RequestHandler,

  search: (async (req, res) => {
    const query = String(req.query.q ?? '').trim();
    const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 50 });
    const artists = await artistsService.search(query, pagination);
    res.json(artists);
  }) as RequestHandler,

  popular: (async (req, res) => {
    const pagination = parsePagination(req.query, { defaultLimit: 12, maxLimit: 50 });
    const artists = await artistsService.popular(pagination);
    res.json(artists);
  }) as RequestHandler,

  getByMbid: (async (req, res) => {
    const mbid = req.params.mbid as string;
    const artist = await artistsService.getOrCache(mbid);
    res.json(artist);
  }) as RequestHandler,
};

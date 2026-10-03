import type { RequestHandler } from 'express';
import { parsePagination } from '../../shared/pagination.js';
import { catalogService } from './catalog.service.js';

export const catalogController = {
  getAlbumState: (async (req, res) => {
    const albumId = req.params.albumId as string;
    const state = await catalogService.getAlbumState(req.userId!, albumId);
    res.json(state);
  }) as RequestHandler,

  toggleAlbum: (async (req, res) => {
    const albumId = req.params.albumId as string;
    const state = await catalogService.toggleAlbum(req.userId!, albumId);
    res.json(state);
  }) as RequestHandler,

  listByUser: (async (req, res) => {
    const userId = req.params.userId as string;
    const pagination = parsePagination(req.query, { defaultLimit: 12, maxLimit: 48 });
    const catalog = await catalogService.listByUser(userId, pagination);
    res.json(catalog);
  }) as RequestHandler,
};

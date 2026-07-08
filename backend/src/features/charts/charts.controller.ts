import type { RequestHandler } from 'express';
import { parsePagination } from '../../shared/pagination.js';
import { chartsService } from './charts.service.js';

export const chartsController = {
  healthCheck: (async (_req, res) => {
    const result = await chartsService.healthCheck();
    res.json(result);
  }) as RequestHandler,

  mostReviewed: (async (req, res) => {
    const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 50 });
    const albums = await chartsService.mostReviewed(pagination);
    res.json(albums);
  }) as RequestHandler,
  topAllTime: (async (req, res) => {
    const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 50 });
    const albums = await chartsService.topAllTime(pagination);
    res.json(albums);
  }) as RequestHandler,
  topByYear: (async (req, res) => {
    const year = Number(req.params.year);
    const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 50 });
    const albums = await chartsService.topByYear(year, pagination);
    res.json(albums);
  }) as RequestHandler,
  topByGenre: (async (req, res) => {
    const genreSlug = req.params.genre as string;
    const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 50 });
    const albums = await chartsService.topByGenre(genreSlug, pagination);
    res.json(albums);
  }) as RequestHandler,

  listGenres: (async (_req, res) => {
    const genres = await chartsService.listGenres();
    res.json(genres);
  }) as RequestHandler,
};

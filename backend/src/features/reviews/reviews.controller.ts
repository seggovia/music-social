import type { RequestHandler } from 'express';
import { reviewsService } from './reviews.service.js';

export const reviewsController = {
  healthCheck: (async (_req, res) => {
    const result = await reviewsService.healthCheck();
    res.json(result);
  }) as RequestHandler,

  create: (async (req, res) => {
    const userId = req.userId!;
    const { albumId, rating, content } = req.body as {
      albumId: string;
      rating: number;
      content: string;
    };
    const review = await reviewsService.create(userId, { albumId, rating, content });
    res.status(201).json(review);
  }) as RequestHandler,

  getByAlbum: (async (req, res) => {
    const albumId = req.params.albumId as string;
    const reviews = await reviewsService.getByAlbum(albumId);
    res.json(reviews);
  }) as RequestHandler,

  getByUser: (async (req, res) => {
    const userId = req.params.userId as string;
    const reviews = await reviewsService.getByUser(userId);
    res.json(reviews);
  }) as RequestHandler,

  getById: (async (req, res) => {
    const id = req.params.id as string;
    const review = await reviewsService.getById(id);
    res.json(review);
  }) as RequestHandler,

  update: (async (req, res) => {
    const userId = req.userId!;
    const id = req.params.id as string;
    const { rating, content } = req.body as { rating?: number; content?: string };
    const review = await reviewsService.update(id, userId, { rating, content });
    res.json(review);
  }) as RequestHandler,

  delete: (async (req, res) => {
    const userId = req.userId!;
    const id = req.params.id as string;
    await reviewsService.delete(id, userId);
    res.status(204).send();
  }) as RequestHandler,
};
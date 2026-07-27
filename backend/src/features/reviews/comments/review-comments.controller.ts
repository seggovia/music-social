import type { RequestHandler } from 'express';
import { parsePagination } from '../../../shared/pagination.js';
import { reviewCommentsService } from './review-comments.service.js';

export const reviewCommentsController = {
  create: (async (req, res) => {
    const reviewId = req.params.reviewId as string;
    const comment = await reviewCommentsService.create(reviewId, req.userId!, req.body?.content);
    res.status(201).json(comment);
  }) as RequestHandler,

  list: (async (req, res) => {
    const reviewId = req.params.reviewId as string;
    const pagination = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });
    const comments = await reviewCommentsService.list(reviewId, pagination);
    res.json(comments);
  }) as RequestHandler,

  delete: (async (req, res) => {
    const reviewId = req.params.reviewId as string;
    const commentId = req.params.commentId as string;
    await reviewCommentsService.delete(reviewId, commentId, req.userId!);
    res.status(204).send();
  }) as RequestHandler,
};

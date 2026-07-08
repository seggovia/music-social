import type { RequestHandler } from 'express';
import { parsePagination } from '../../shared/pagination.js';
import { usersService } from './users.service.js';

export const usersController = {
  healthCheck: (async (_req, res) => {
    const result = await usersService.healthCheck();
    res.json(result);
  }) as RequestHandler,

  getProfile: (async (req, res) => {
    const username = req.params.username as string;
    const profile = await usersService.getProfile(username);
    res.json(profile);
  }) as RequestHandler,

  list: (async (req, res) => {
    const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 50 });
    const users = await usersService.list(pagination);
    res.json(users);
  }) as RequestHandler,

  topReviewers: (async (req, res) => {
    const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 50 });
    const users = await usersService.listTopReviewers(pagination);
    res.json(users);
  }) as RequestHandler,

  byGenre: (async (req, res) => {
    const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 50 });
    const users = await usersService.listByGenre(pagination);
    res.json(users);
  }) as RequestHandler,

  similar: (async (req, res) => {
    const username = req.params.username as string;
    const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 50 });
    const users = await usersService.listByAffinity(username, 'similar', pagination);
    res.json(users);
  }) as RequestHandler,

  opposite: (async (req, res) => {
    const username = req.params.username as string;
    const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 50 });
    const users = await usersService.listByAffinity(username, 'opposite', pagination);
    res.json(users);
  }) as RequestHandler,

  updateProfile: (async (req, res) => {
    const username = req.params.username as string;
    const requesterId = req.userId!;
    const updated = await usersService.updateProfile(requesterId, username, req.body);
    res.json(updated);
  }) as RequestHandler,
};

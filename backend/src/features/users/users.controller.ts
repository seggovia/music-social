import type { RequestHandler } from 'express';
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

  list: (async (_req, res) => {
    const users = await usersService.list();
    res.json(users);
  }) as RequestHandler,

  topReviewers: (async (_req, res) => {
    const users = await usersService.listTopReviewers();
    res.json(users);
  }) as RequestHandler,

  byGenre: (async (_req, res) => {
    const users = await usersService.listByGenre();
    res.json(users);
  }) as RequestHandler,

  similar: (async (req, res) => {
    const username = req.params.username as string;
    const users = await usersService.listByAffinity(username, 'similar');
    res.json(users);
  }) as RequestHandler,

  opposite: (async (req, res) => {
    const username = req.params.username as string;
    const users = await usersService.listByAffinity(username, 'opposite');
    res.json(users);
  }) as RequestHandler,

  updateProfile: (async (req, res) => {
    const username = req.params.username as string;
    const requesterId = req.userId!;
    const updated = await usersService.updateProfile(requesterId, username, req.body);
    res.json(updated);
  }) as RequestHandler,
};
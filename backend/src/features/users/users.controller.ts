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
};
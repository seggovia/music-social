import type { RequestHandler } from 'express';
import { usersService } from './users.service.js';

export const usersController = {
  healthCheck: (async (_req, res) => {
    const result = await usersService.healthCheck();
    res.json(result);
  }) as RequestHandler,
};

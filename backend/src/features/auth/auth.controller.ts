import type { RequestHandler } from 'express';
import { authService } from './auth.service.js';

export const authController = {
  healthCheck: (async (_req, res) => {
    const result = await authService.healthCheck();
    res.json(result);
  }) as RequestHandler,
};

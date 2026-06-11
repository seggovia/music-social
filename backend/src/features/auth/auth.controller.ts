import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import { authService } from './auth.service.js';

export const authController = {
  register: (async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  login: (async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  me: (async (req, res, next) => {
    try {
      if (!req.userId) {
        throw new AppError('Authentication required', 401);
      }

      const result = await authService.me(req.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  healthCheck: (async (_req, res) => {
    const result = await authService.healthCheck();
    res.json(result);
  }) as RequestHandler,
};

import type { RequestHandler } from 'express';
import { supabase } from '../../config/supabase.js';
import { AppError } from '../errors/AppError.js';

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;

    if (!token) {
      throw new AppError('Authentication token missing', 401);
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new AppError('Invalid or expired token', 401, error);
    }

    req.userId = data.user.id;
    next();
  } catch (error) {
    next(error);
  }
};

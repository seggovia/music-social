import type { NextFunction, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AppError } from '../errors/AppError.js';

const ONE_MINUTE_MS = 60 * 1000;
const FIFTEEN_MINUTES_MS = 15 * ONE_MINUTE_MS;

function rateLimitHandler(message: string, code: string) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(message, 429, undefined, code));
  };
}

export const apiRateLimiter = rateLimit({
  windowMs: ONE_MINUTE_MS,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  identifier: 'api-general',
  handler: rateLimitHandler('API rate limit exceeded', 'API_RATE_LIMIT_EXCEEDED'),
});

export const authRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  identifier: 'auth-attempts',
  handler: rateLimitHandler('Authentication rate limit exceeded', 'AUTH_RATE_LIMIT_EXCEEDED'),
});

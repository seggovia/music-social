import { Router } from 'express';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { authRateLimiter } from '../../shared/middleware/rateLimit.middleware.js';
import { authController } from './auth.controller.js';

export const authRouter = Router();

authRouter.get('/', asyncHandler(authController.healthCheck));
authRouter.post('/register', authRateLimiter, asyncHandler(authController.register));
authRouter.post('/login', authRateLimiter, asyncHandler(authController.login));
authRouter.get('/me', authMiddleware, asyncHandler(authController.me));

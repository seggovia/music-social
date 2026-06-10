import { Router } from 'express';
import { authController } from './auth.controller.js';

export const authRouter = Router();

authRouter.get('/', authController.healthCheck);

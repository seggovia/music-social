import { Router } from 'express';
import { messagesController } from './messages.controller.js';

export const messagesRouter = Router();

messagesRouter.get('/', messagesController.healthCheck);

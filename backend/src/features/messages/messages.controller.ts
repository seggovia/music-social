import type { RequestHandler } from 'express';
import { messagesService } from './messages.service.js';

export const messagesController = {
  healthCheck: (async (_req, res) => {
    const result = await messagesService.healthCheck();
    res.json(result);
  }) as RequestHandler,
};

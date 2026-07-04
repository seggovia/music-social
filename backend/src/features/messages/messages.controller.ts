import type { RequestHandler } from 'express';
import { messagesService } from './messages.service.js';

export const messagesController = {
  healthCheck: (async (_req, res) => {
    const result = await messagesService.healthCheck();
    res.json(result);
  }) as RequestHandler,

  getConversations: (async (req, res) => {
    const userId = req.userId!;
    const conversations = await messagesService.getConversations(userId);
    res.json(conversations);
  }) as RequestHandler,

  startConversation: (async (req, res) => {
    const userOneId = req.userId!;
    const userTwoId = req.body.targetUserId as string;
    const conversation = await messagesService.startConversation(userOneId, userTwoId);
    res.status(201).json(conversation);
  }) as RequestHandler,

  getMessages: (async (req, res) => {
    const conversationId = req.params.conversationId as string;
    const userId = req.userId!;
    const messages = await messagesService.getMessages(conversationId, userId);
    res.json(messages);
  }) as RequestHandler,

  sendMessage: (async (req, res) => {
    const conversationId = req.params.conversationId as string;
    const senderId = req.userId!;
    const body = req.body.body as string;
    const message = await messagesService.sendMessage(conversationId, senderId, body);
    res.status(201).json(message);
  }) as RequestHandler,
};

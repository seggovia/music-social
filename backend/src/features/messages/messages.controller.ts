import type { RequestHandler } from 'express';
import { parsePagination } from '../../shared/pagination.js';
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
    const pagination = parsePagination(req.query, { defaultLimit: 30, maxLimit: 100 });
    const messages = await messagesService.getMessages(conversationId, userId, pagination);
    res.json(messages);
  }) as RequestHandler,

  markAsRead: (async (req, res) => {
    const conversationId = req.params.conversationId as string;
    const userId = req.userId!;
    await messagesService.markAsRead(conversationId, userId);
    res.status(204).end();
  }) as RequestHandler,

  sendMessage: (async (req, res) => {
    const conversationId = req.params.conversationId as string;
    const senderId = req.userId!;
    const body = req.body.body as string;
    const message = await messagesService.sendMessage(conversationId, senderId, body);
    res.status(201).json(message);
  }) as RequestHandler,

  editMessage: (async (req, res) => {
    const conversationId = req.params.conversationId as string;
    const messageId = req.params.messageId as string;
    const userId = req.userId!;
    const body = req.body.body as unknown;
    const message = await messagesService.editMessage(conversationId, messageId, userId, body);
    res.json(message);
  }) as RequestHandler,

  deleteMessage: (async (req, res) => {
    const conversationId = req.params.conversationId as string;
    const messageId = req.params.messageId as string;
    const userId = req.userId!;
    const mode = req.body?.mode ?? req.query.mode;
    const message = await messagesService.deleteMessage(conversationId, messageId, userId, mode);
    res.json(message);
  }) as RequestHandler,

  pinMessage: (async (req, res) => {
    const messageId = req.params.messageId as string;
    const conversationId = req.params.conversationId as string;
    const message = await messagesService.pinMessage(messageId, conversationId);
    res.json(message);
  }) as RequestHandler,

  unpinMessage: (async (req, res) => {
    const messageId = req.params.messageId as string;
    const conversationId = req.params.conversationId as string;
    const message = await messagesService.unpinMessage(messageId, conversationId);
    res.json(message);
  }) as RequestHandler,

  getPinnedMessages: (async (req, res) => {
    const conversationId = req.params.conversationId as string;
    const messages = await messagesService.getPinnedMessages(conversationId);
    res.json(messages);
  }) as RequestHandler,
};

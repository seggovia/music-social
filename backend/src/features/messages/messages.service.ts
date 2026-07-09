import { AppError } from '../../shared/errors/AppError.js';
import type { Pagination } from '../../shared/pagination.js';
import { messagesRepository } from './messages.repository.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertMessageRouteIds(messageId: string, conversationId: string) {
  if (!UUID_PATTERN.test(messageId) || !UUID_PATTERN.test(conversationId)) {
    throw new AppError('Message not found', 404);
  }
}

function parseMessageBody(body: unknown) {
  if (typeof body !== 'string' || !body.trim()) {
    throw new AppError('Message body cannot be empty', 400);
  }

  return body.trim();
}

function parseDeleteMode(mode: unknown) {
  if (mode !== 'sender' && mode !== 'all') {
    throw new AppError('Invalid message delete mode', 400);
  }

  return mode;
}

export const messagesService = {
  async healthCheck() {
    return messagesRepository.healthCheck();
  },

  async startConversation(userOneId: string, userTwoId: string) {
    return messagesRepository.findOrCreateConversation(userOneId, userTwoId);
  },

  async getConversations(userId: string) {
    return messagesRepository.getConversations(userId);
  },

  async getMessages(conversationId: string, userId: string, pagination: Pagination) {
    const messages = await messagesRepository.getMessages(conversationId, pagination);
    await messagesRepository.markAsRead(conversationId, userId);
    return messages;
  },

  async sendMessage(conversationId: string, senderId: string, body: unknown) {
    return messagesRepository.sendMessage(conversationId, senderId, parseMessageBody(body));
  },

  async editMessage(conversationId: string, messageId: string, userId: string, body: unknown) {
    assertMessageRouteIds(messageId, conversationId);
    return messagesRepository.editMessage(conversationId, messageId, userId, parseMessageBody(body));
  },

  async deleteMessage(conversationId: string, messageId: string, userId: string, mode: unknown) {
    assertMessageRouteIds(messageId, conversationId);
    return messagesRepository.deleteMessage(conversationId, messageId, userId, parseDeleteMode(mode));
  },

  async pinMessage(messageId: string, conversationId: string) {
    assertMessageRouteIds(messageId, conversationId);
    return messagesRepository.pinMessage(messageId, conversationId);
  },

  async unpinMessage(messageId: string, conversationId: string) {
    assertMessageRouteIds(messageId, conversationId);
    return messagesRepository.unpinMessage(messageId, conversationId);
  },

  async getPinnedMessages(conversationId: string) {
    return messagesRepository.getPinnedMessages(conversationId);
  },
};

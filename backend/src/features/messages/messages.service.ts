import { AppError } from '../../shared/errors/AppError.js';
import { messagesRepository } from './messages.repository.js';

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

  async getMessages(conversationId: string, userId: string) {
    const messages = await messagesRepository.getMessages(conversationId);
    await messagesRepository.markAsRead(conversationId, userId);
    return messages;
  },

  async sendMessage(conversationId: string, senderId: string, body: string) {
    if (!body.trim()) {
      throw new AppError('Message body cannot be empty', 400);
    }

    return messagesRepository.sendMessage(conversationId, senderId, body.trim());
  },

  async editMessage(messageId: string, userId: string, body: string) {
    if (!body.trim()) {
      throw new AppError('Message body cannot be empty', 400);
    }

    return messagesRepository.editMessage(messageId, userId, body.trim());
  },

  async deleteMessage(messageId: string, userId: string, mode: 'sender' | 'all') {
    return messagesRepository.deleteMessage(messageId, userId, mode);
  },

  async pinMessage(messageId: string, conversationId: string) {
    return messagesRepository.pinMessage(messageId, conversationId);
  },

  async unpinMessage(messageId: string) {
    return messagesRepository.unpinMessage(messageId);
  },

  async getPinnedMessages(conversationId: string) {
    return messagesRepository.getPinnedMessages(conversationId);
  },
};

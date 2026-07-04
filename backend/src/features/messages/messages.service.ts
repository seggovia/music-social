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
};

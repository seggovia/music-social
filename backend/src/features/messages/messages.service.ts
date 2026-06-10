import { messagesRepository } from './messages.repository.js';

export const messagesService = {
  async healthCheck() {
    return messagesRepository.healthCheck();
  },
};

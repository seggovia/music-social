import { usersRepository } from './users.repository.js';

export const usersService = {
  async healthCheck() {
    return usersRepository.healthCheck();
  },
};

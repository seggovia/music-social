import { authRepository } from './auth.repository.js';

export const authService = {
  async healthCheck() {
    return authRepository.healthCheck();
  },
};

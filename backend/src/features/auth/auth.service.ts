import { authRepository } from './auth.repository.js';
import type { AuthMeResponse, AuthResponse, LoginInput, RegisterInput } from './auth.types.js';

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    return authRepository.register(input);
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    return authRepository.login(input);
  },

  async me(userId: string): Promise<AuthMeResponse> {
    const user = await authRepository.me(userId);
    return { user };
  },

  async healthCheck() {
    return authRepository.healthCheck();
  },
};

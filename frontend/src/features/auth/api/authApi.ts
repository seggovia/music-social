import { apiClient } from '@/shared/api/client';
import type { AuthResponse, LoginFormValues, RegisterFormValues, UserProfile } from '../types';

export const authApi = {
  login: (values: LoginFormValues) => apiClient.post<AuthResponse>('/auth/login', values),
  register: (values: RegisterFormValues) => apiClient.post<AuthResponse>('/auth/register', values),
  me: (token: string) =>
    apiClient.get<{ user: UserProfile }>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const { user, accessToken, refreshToken, isLoading, error, login, register, logout, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return { user, accessToken, refreshToken, isLoading, error, login, register, logout };
}

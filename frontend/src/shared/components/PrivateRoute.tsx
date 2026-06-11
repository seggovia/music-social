import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ROUTES } from '@/shared/lib/constants';

export function PrivateRoute() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return accessToken ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />;
}

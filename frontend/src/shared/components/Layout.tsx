import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ROUTES } from '@/shared/lib/constants';

export function Layout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div>
      <header>
        <nav>
          <Link to={ROUTES.HOME}>Home</Link>
          {' | '}
          <Link to={ROUTES.ALBUMS}>Albums</Link>
          {' | '}
          <Link to={ROUTES.ARTISTS}>Artists</Link>
          {' | '}
          <Link to={ROUTES.REVIEWS}>Reviews</Link>
          {' | '}
          <Link to={ROUTES.MESSAGES}>Messages</Link>
          {' | '}
          <Link to={ROUTES.USERS}>Users</Link>
          {' | '}
          {user ? (
            <button type="button" onClick={() => logout()}>
              Logout ({user.username})
            </button>
          ) : (
            <>
              <Link to={ROUTES.LOGIN}>Login</Link>
              {' | '}
              <Link to={ROUTES.REGISTER}>Register</Link>
            </>
          )}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

import { Link, Outlet } from 'react-router-dom';
import { ROUTES } from '@/shared/lib/constants';

export function Layout() {
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
          <Link to={ROUTES.LOGIN}>Login</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

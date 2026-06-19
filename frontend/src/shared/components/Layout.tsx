import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ROUTES } from '@/shared/lib/constants';
import styles from './Layout.module.css';

export function Layout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.linkActive}` : styles.link;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to={ROUTES.HOME} className={styles.brand}>
            music<span>social</span>
          </Link>

          <div className={styles.links}>
            <NavLink to={ROUTES.ALBUMS} className={navLinkClass}>Albums</NavLink>
            <NavLink to={ROUTES.ARTISTS} className={navLinkClass}>Artists</NavLink>
            <NavLink to={ROUTES.REVIEWS} className={navLinkClass}>Reviews</NavLink>
            <NavLink to={ROUTES.MESSAGES} className={navLinkClass}>Messages</NavLink>
            <NavLink to={ROUTES.USERS} className={navLinkClass}>Users</NavLink>
          </div>

          <div className={styles.authActions}>
            {user ? (
              <button type="button" className={styles.logoutButton} onClick={() => logout()}>
                {user.username}
              </button>
            ) : (
              <>
                <Link to={ROUTES.LOGIN} className={styles.link}>Login</Link>
                <Link to={ROUTES.REGISTER} className={styles.link}>Register</Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
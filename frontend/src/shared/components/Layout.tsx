import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ROUTES } from '@/shared/lib/constants';
import { ErrorToast } from './ErrorToast';
import styles from './Layout.module.css';

export function Layout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.linkActive}` : styles.link;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function goToProfile() {
    setMenuOpen(false);
    if (user) navigate(`${ROUTES.USERS}/${user.username}`);
  }

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate(ROUTES.HOME);
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to={ROUTES.HOME} className={styles.brand}>
            <span className={styles.brandMark}>ms</span>
            <span className={styles.brandText}>music<span>social</span></span>
          </Link>

          <div className={styles.links}>
            <NavLink to={ROUTES.ALBUMS} className={navLinkClass}>Albums</NavLink>
            <NavLink to={ROUTES.ARTISTS} className={navLinkClass}>Artists</NavLink>
            <NavLink to={ROUTES.CHARTS} className={navLinkClass}>Charts</NavLink>
            <NavLink to={ROUTES.REVIEWS} className={navLinkClass}>Reviews</NavLink>
            <NavLink to={ROUTES.MESSAGES} className={navLinkClass}>Messages</NavLink>
            <NavLink to={ROUTES.USERS} className={navLinkClass}>Users</NavLink>
          </div>

          <div className={styles.authActions}>
            {user ? (
              <div className={styles.userMenu} ref={menuRef}>
                <button
                  type="button"
                  className={styles.userMenuTrigger}
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className={styles.userAvatar} />
                  ) : (
                    <span className={styles.userAvatarFallback}>{user.username.charAt(0).toUpperCase()}</span>
                  )}
                  <span className={styles.userName}>{user.username}</span>
                  <span className={styles.userChevron}>⌄</span>
                </button>
                {menuOpen && (
                  <div className={styles.dropdown}>
                    <button type="button" className={styles.dropdownItem} onClick={goToProfile}>
                      My profile
                    </button>
                    <button
                      type="button"
                      className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
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
      <ErrorToast />
    </div>
  );
}

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAlbumsStore } from '@/features/albums/stores/albumsStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ROUTES } from '@/shared/lib/constants';
import { ErrorToast } from './ErrorToast';
import styles from './Layout.module.css';

export function Layout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const {
    results: albumSearchResults,
    isLoading: isAlbumSearchLoading,
    query: activeAlbumSearchQuery,
    search: searchAlbums,
  } = useAlbumsStore((state) => state);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [albumSearchQuery, setAlbumSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const activeAlbumSearchQueryRef = useRef(activeAlbumSearchQuery);
  const trimmedAlbumSearchQuery = albumSearchQuery.trim();
  const autocompleteResults = trimmedAlbumSearchQuery === activeAlbumSearchQuery
    ? albumSearchResults.slice(0, 6)
    : [];
  const isAutocompleteLoading = Boolean(trimmedAlbumSearchQuery) && (
    isAlbumSearchLoading || trimmedAlbumSearchQuery !== activeAlbumSearchQuery
  );
  const showSearchDropdown = searchOpen && Boolean(trimmedAlbumSearchQuery);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.linkActive}` : styles.link;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    activeAlbumSearchQueryRef.current = activeAlbumSearchQuery;
  }, [activeAlbumSearchQuery]);

  useEffect(() => {
    if (!trimmedAlbumSearchQuery) return;

    const timer = window.setTimeout(() => {
      if (trimmedAlbumSearchQuery !== activeAlbumSearchQueryRef.current) {
        void searchAlbums(trimmedAlbumSearchQuery);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchAlbums, trimmedAlbumSearchQuery]);

  useEffect(() => {
    if (location.pathname !== ROUTES.ALBUMS) return;

    const params = new URLSearchParams(location.search);
    setAlbumSearchQuery(params.get('q') ?? '');
  }, [location.pathname, location.search]);

  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname]);

  function handleAlbumSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedAlbumSearchQuery) return;

    setSearchOpen(false);
    navigate(`${ROUTES.ALBUMS}?q=${encodeURIComponent(trimmedAlbumSearchQuery)}`);
  }

  function handleAlbumSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setSearchOpen(false);
    }
  }

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

          <div className={styles.navSearchShell} ref={searchRef}>
            <form className={styles.navSearch} role="search" onSubmit={handleAlbumSearchSubmit}>
              <input
                type="search"
                value={albumSearchQuery}
                onChange={(event) => {
                  setAlbumSearchQuery(event.target.value);
                  setSearchOpen(Boolean(event.target.value.trim()));
                }}
                onFocus={() => setSearchOpen(Boolean(trimmedAlbumSearchQuery))}
                onKeyDown={handleAlbumSearchKeyDown}
                className={styles.navSearchInput}
                placeholder="Search albums"
                aria-label="Search albums"
                aria-expanded={showSearchDropdown}
                aria-controls="album-search-results"
              />
            </form>

            {showSearchDropdown ? (
              <div id="album-search-results" className={styles.searchDropdown}>
                {isAutocompleteLoading ? (
                  <div className={styles.searchLoading}>
                    <span className={styles.searchSpinner} aria-hidden="true" />
                    <span>Searching albums...</span>
                  </div>
                ) : null}

                {!isAutocompleteLoading && autocompleteResults.length > 0 ? (
                  <div className={styles.searchResultsList}>
                    {autocompleteResults.map((album) => (
                      <Link
                        key={album.mbid}
                        to={`${ROUTES.ALBUMS}/${album.mbid}`}
                        className={styles.searchResultItem}
                        onClick={() => setSearchOpen(false)}
                      >
                        <img
                          src={album.coverUrl ?? 'https://placehold.co/48x48?text=No+Cover'}
                          alt=""
                          className={styles.searchResultCover}
                          loading="lazy"
                        />
                        <span className={styles.searchResultCopy}>
                          <span className={styles.searchResultTitle}>{album.title}</span>
                          <span className={styles.searchResultArtist}>{album.artist}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : null}

                {!isAutocompleteLoading && autocompleteResults.length === 0 ? (
                  <p className={styles.searchEmpty}>No albums found.</p>
                ) : null}

                <Link
                  to={`${ROUTES.ALBUMS}?q=${encodeURIComponent(trimmedAlbumSearchQuery)}`}
                  className={styles.searchViewAll}
                  onClick={() => setSearchOpen(false)}
                >
                  View all results
                </Link>
              </div>
            ) : null}
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
                  <span className={styles.userChevron} aria-hidden="true">v</span>
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
        <div key={`${location.pathname}${location.search}`} className={styles.routeFrame}>
          <Outlet />
        </div>
      </main>
      <ErrorToast />
    </div>
  );
}

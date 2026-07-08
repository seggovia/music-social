import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useUsersStore } from '../stores/usersStore';
import type { AffinityUser, GenreUser, TopReviewerUser, UsersFilter } from '../types';
import styles from './UsersListPage.module.css';

const FILTERS: { key: UsersFilter; label: string; needsMe?: boolean }[] = [
  { key: 'all', label: 'All users' },
  { key: 'top-reviewers', label: 'Top reviewers' },
  { key: 'by-genre', label: 'By favorite genre' },
  { key: 'similar', label: 'Similar taste to me', needsMe: true },
  { key: 'opposite', label: 'Opposite taste to me', needsMe: true },
];

export function UsersListPage() {
  const { list, activeFilter, isLoading, isLoadingMore, hasMore, error, fetchFiltered, loadMore } = useUsersStore();
  const me = useAuthStore((state) => state.user);

  useEffect(() => {
    void fetchFiltered('all');
  }, [fetchFiltered]);

  function renderBadge(user: typeof list[number]) {
    if ('reviewCount' in user) {
      const u = user as TopReviewerUser;
      return `${u.reviewCount} reviews`;
    }
    if ('topGenre' in user) {
      const u = user as GenreUser;
      return u.topGenre ?? null;
    }
    if ('avgRatingDiff' in user) {
      const u = user as AffinityUser;
      return `${u.sharedAlbums} shared · diff ${u.avgRatingDiff}`;
    }
    return null;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Users</h1>

      <div className={styles.tabs}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={f.key === activeFilter ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            disabled={f.needsMe && !me}
            onClick={() => fetchFiltered(f.key, me?.username)}
            title={f.needsMe && !me ? 'Log in to use this filter' : undefined}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <p className={styles.empty}>Loading users...</p>}

      {!isLoading && !error && list.length === 0 && (
        <p className={styles.empty}>No users found for this filter.</p>
      )}

      {!isLoading && !error && list.length > 0 && (
        <>
          <div className={styles.grid}>
            {list.map((user) => {
              const initial = user.username.charAt(0).toUpperCase();
              const badge = renderBadge(user);
              return (
                <Link key={user.id} to={`/users/${user.username}`} className={styles.card}>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>{initial}</div>
                  )}
                  <div className={styles.userInfo}>
                    <p className={styles.username}>{user.username}</p>
                    {user.display_name && <p className={styles.displayName}>{user.display_name}</p>}
                    {badge && <p className={styles.badge}>{badge}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
          {isLoadingMore ? <p className={styles.empty}>Loading more users...</p> : null}
          {hasMore ? (
            <div className={styles.loadMoreRow}>
              <button type="button" className={styles.loadMoreButton} onClick={() => void loadMore()} disabled={isLoadingMore}>
                {isLoadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

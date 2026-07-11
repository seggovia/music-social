import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Skeleton } from '@/shared/components/Skeleton';
import { useUsersStore } from '../stores/usersStore';
import type { AffinityUser, GenreUser, TopReviewerUser, UsersFilter } from '../types';
import styles from './UsersListPage.module.css';

const FILTERS: { key: UsersFilter; label: string; description: string; needsMe?: boolean }[] = [
  { key: 'all', label: 'All users', description: 'Browse every listener in the community.' },
  { key: 'top-reviewers', label: 'Top reviewers', description: 'People writing the most album reviews.' },
  { key: 'by-genre', label: 'By favorite genre', description: 'Find users grouped by their strongest genre signal.' },
  { key: 'similar', label: 'Similar taste to me', description: 'Listeners with ratings close to yours.', needsMe: true },
  { key: 'opposite', label: 'Opposite taste to me', description: 'Listeners who rate shared albums differently.', needsMe: true },
];

const SKELETON_CARDS = Array.from({ length: 8 }, (_, index) => index);

export function UsersListPage() {
  const { list, activeFilter, isLoading, isLoadingMore, hasMore, error, total, fetchFiltered, loadMore } = useUsersStore();
  const me = useAuthStore((state) => state.user);
  const activeFilterConfig = FILTERS.find((filter) => filter.key === activeFilter) ?? FILTERS[0];

  useEffect(() => {
    void fetchFiltered('all');
  }, [fetchFiltered]);

  function renderMetric(user: typeof list[number]) {
    if ('reviewCount' in user) {
      const u = user as TopReviewerUser;
      return (
        <span className={styles.metric}>
          <span className={styles.metricValue}>{u.reviewCount}</span>
          <span className={styles.metricLabel}>reviews</span>
        </span>
      );
    }

    if ('topGenre' in user) {
      const u = user as GenreUser;
      return (
        <span className={styles.genrePill}>
          {u.topGenre ?? 'No genre yet'}
        </span>
      );
    }

    if ('avgRatingDiff' in user) {
      const u = user as AffinityUser;
      return (
        <span className={styles.affinityGroup}>
          <span className={styles.metric}>
            <span className={styles.metricValue}>{u.sharedAlbums}</span>
            <span className={styles.metricLabel}>shared</span>
          </span>
          <span className={styles.diffPill}>diff {u.avgRatingDiff}</span>
        </span>
      );
    }

    return <span className={styles.cardHint}>View profile</span>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.headerPanel}>
        <p className={styles.eyebrow}>Community directory</p>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Users</h1>
            <p className={styles.subtitle}>{activeFilterConfig.description}</p>
          </div>
          <div className={styles.summaryPill}>
            <span className={styles.summaryValue}>{isLoading ? '...' : total}</span>
            <span className={styles.summaryLabel}>{isLoading ? 'Loading' : 'users found'}</span>
          </div>
        </div>
      </header>

      <section className={styles.filtersPanel} aria-label="User filters">
        <div className={styles.tabs}>
          {FILTERS.map((filter) => {
            const disabled = filter.needsMe && !me;
            const className = filter.key === activeFilter ? `${styles.tab} ${styles.tabActive}` : styles.tab;

            return (
              <button
                key={filter.key}
                type="button"
                className={className}
                disabled={disabled}
                onClick={() => fetchFiltered(filter.key, me?.username)}
                title={disabled ? 'Log in to use this filter' : undefined}
              >
                <span className={styles.tabLabel}>{filter.label}</span>
                <span className={styles.tabDescription}>{disabled ? 'Login required' : filter.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.resultsSection}>
        <div className={styles.resultsHeader}>
          <div>
            <p className={styles.resultsEyebrow}>Now showing</p>
            <h2 className={styles.resultsTitle}>{activeFilterConfig.label}</h2>
          </div>
          <span className={styles.resultsCount}>{isLoading ? 'Loading' : `${list.length}${hasMore ? '+' : ''} visible`}</span>
        </div>

        {error && !isLoading ? <p className={styles.empty}>{error}</p> : null}

        {isLoading ? (
          <div className={styles.grid} aria-hidden="true">
            {SKELETON_CARDS.map((index) => (
              <article key={index} className={`${styles.card} ${styles.skeletonCard}`}>
                <Skeleton width="64px" height="64px" borderRadius="999px" />
                <div className={styles.skeletonCopy}>
                  <Skeleton width="70%" height="16px" />
                  <Skeleton width="52%" height="14px" />
                  <Skeleton width="42%" height="24px" borderRadius="999px" />
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!isLoading && !error && list.length === 0 ? (
          <p className={styles.empty}>No users found for this filter.</p>
        ) : null}

        {!isLoading && !error && list.length > 0 ? (
          <>
            <div className={styles.grid}>
              {list.map((user) => {
                const initial = user.username.charAt(0).toUpperCase();

                return (
                  <Link key={user.id} to={`/users/${user.username}`} className={styles.card}>
                    <div className={styles.avatarWrap}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>{initial}</div>
                      )}
                    </div>
                    <div className={styles.userInfo}>
                      <p className={styles.username}>{user.username}</p>
                      <p className={styles.displayName}>{user.display_name ?? 'music-social listener'}</p>
                      <div className={styles.cardFooter}>
                        {renderMetric(user)}
                      </div>
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
        ) : null}
      </section>
    </div>
  );
}

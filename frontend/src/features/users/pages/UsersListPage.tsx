import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Skeleton } from '@/shared/components/Skeleton';
import { Button, ButtonLink, Card } from '@/shared/components/ui';
import { ROUTES } from '@/shared/lib/constants';
import { useUsersStore } from '../stores/usersStore';
import type { AffinityUser, GenreUser, TopReviewerUser, UsersFilter } from '../types';
import styles from './UsersListPage.module.css';

const FILTERS: { key: UsersFilter; label: string; description: string; needsMe?: boolean }[] = [
  { key: 'all', label: 'All users', description: 'Browse every listener in the community.' },
  { key: 'top-reviewers', label: 'Top reviewers', description: 'People writing the most album reviews.' },
  { key: 'by-genre', label: 'By favorite genre', description: 'Find listeners through the genre they rate most often.' },
  { key: 'similar', label: 'Similar taste to me', description: 'Listeners with ratings close to yours.', needsMe: true },
  { key: 'opposite', label: 'Opposite taste to me', description: 'Listeners who rate shared albums differently.', needsMe: true },
];

const SKELETON_CARDS = Array.from({ length: 8 }, (_, index) => index);

function formatDifference(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

function UserMetric({ user }: { user: ReturnType<typeof useUsersStore.getState>['list'][number] }) {
  if ('reviewCount' in user) {
    const reviewer = user as TopReviewerUser;
    return (
      <p className={styles.metric}>
        <span className={styles.metricValue}>{reviewer.reviewCount}</span>
        {reviewer.reviewCount === 1 ? ' review' : ' reviews'}
      </p>
    );
  }

  if ('topGenre' in user) {
    const genreUser = user as GenreUser;
    return (
      <p className={styles.metric}>
        <span className={styles.metricLabel}>Favorite genre</span>
        <span className={styles.genreValue}>{genreUser.topGenre ?? 'Not set yet'}</span>
      </p>
    );
  }

  if ('avgRatingDiff' in user) {
    const affinityUser = user as AffinityUser;
    return (
      <p className={styles.metric}>
        <span><span className={styles.metricValue}>{affinityUser.sharedAlbums}</span> shared albums</span>
        <span className={styles.metricDivider} aria-hidden="true">·</span>
        <span><span className={styles.metricValue}>{formatDifference(affinityUser.avgRatingDiff)}</span> avg diff</span>
      </p>
    );
  }

  return <p className={styles.metric}>Community member</p>;
}

function UserSkeletonCard() {
  return (
    <Card className={`${styles.userCard} ${styles.skeletonCard}`} aria-hidden="true">
      <Skeleton width="5rem" height="5rem" borderRadius="999px" />
      <div className={styles.skeletonCopy}>
        <Skeleton width="72%" height="1.1rem" />
        <Skeleton width="54%" height="0.75rem" />
        <Skeleton width="82%" height="0.8rem" />
      </div>
      <Skeleton width="100%" height="2.5rem" borderRadius="999px" />
    </Card>
  );
}

export function UsersListPage() {
  const {
    list,
    activeFilter,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    total,
    fetchFiltered,
    loadMore,
  } = useUsersStore();
  const me = useAuthStore((state) => state.user);
  const activeFilterConfig = FILTERS.find((filter) => filter.key === activeFilter) ?? FILTERS[0];

  useEffect(() => {
    void fetchFiltered('all');
  }, [fetchFiltered]);

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Community Directory</p>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.subtitle}>
            Discover the listeners shaping the community and find your next favorite profile.
          </p>
        </div>

        <Card
          className={styles.summaryCard}
          aria-label={isLoading ? 'Loading users' : `${total} users found`}
        >
          <span className={styles.summaryValue}>{isLoading ? '…' : total}</span>
          <span className={styles.summaryLabel}>{isLoading ? 'Loading users' : 'Users found'}</span>
        </Card>
      </header>

      <section className={styles.filters} aria-label="User filters">
        <div className={styles.tabs} role="group" aria-label="Directory view">
          {FILTERS.map((filter) => {
            const isActive = filter.key === activeFilter;
            const disabled = filter.needsMe && !me;

            return (
              <Button
                key={filter.key}
                variant={isActive ? 'primary' : 'secondary'}
                className={styles.tab}
                aria-pressed={isActive}
                disabled={disabled}
                onClick={() => void fetchFiltered(filter.key, me?.username)}
                title={disabled ? 'Log in to use this filter' : undefined}
              >
                {filter.label}
              </Button>
            );
          })}
        </div>

        <p className={styles.filterDescription}>
          <span className={styles.descriptionDot} aria-hidden="true" />
          {activeFilterConfig.description}
        </p>
      </section>

      <section className={styles.results} aria-labelledby="users-results-title">
        <header className={styles.resultsHeader}>
          <div>
            <p className={styles.resultsEyebrow}>Now showing</p>
            <h2 id="users-results-title" className={styles.resultsTitle}>{activeFilterConfig.label}</h2>
          </div>
          <p className={styles.resultsCount}>
            {isLoading ? 'Loading' : `${list.length}${hasMore ? '+' : ''} visible`}
          </p>
        </header>

        {isLoading ? (
          <div className={styles.grid} aria-label="Loading users">
            {SKELETON_CARDS.map((index) => <UserSkeletonCard key={index} />)}
          </div>
        ) : null}

        {!isLoading && error ? (
          <Card className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>We couldn't load these users</h3>
            <p className={styles.emptyText}>{error}</p>
          </Card>
        ) : null}

        {!isLoading && !error && list.length === 0 ? (
          <Card className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>No users found</h3>
            <p className={styles.emptyText}>Try another directory filter to discover more listeners.</p>
          </Card>
        ) : null}

        {!isLoading && !error && list.length > 0 ? (
          <>
            <div className={styles.grid}>
              {list.map((user) => {
                const initial = user.username.charAt(0).toUpperCase() || '?';
                const profilePath = `${ROUTES.USERS}/${encodeURIComponent(user.username)}`;

                return (
                  <Card key={user.id} className={styles.userCard}>
                    <div className={styles.avatarWrap}>
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={`Avatar of ${user.username}`}
                          className={styles.avatar}
                          loading="lazy"
                        />
                      ) : (
                        <span className={styles.avatarFallback} aria-hidden="true">{initial}</span>
                      )}
                    </div>

                    <div className={styles.userCopy}>
                      <h3 className={styles.username}>{user.username}</h3>
                      <p className={styles.displayName}>{user.display_name ?? 'music-social listener'}</p>
                      <UserMetric user={user} />
                    </div>

                    <ButtonLink to={profilePath} variant="secondary" className={styles.profileButton}>
                      View profile
                    </ButtonLink>
                  </Card>
                );
              })}
            </div>

            {isLoadingMore ? (
              <div className={styles.grid} aria-label="Loading more users">
                {Array.from({ length: 4 }).map((_, index) => <UserSkeletonCard key={index} />)}
              </div>
            ) : null}

            {hasMore ? (
              <div className={styles.loadMoreRow}>
                <Button variant="secondary" onClick={() => void loadMore()} disabled={isLoadingMore}>
                  {isLoadingMore ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}

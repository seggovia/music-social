import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { Skeleton } from '@/shared/components/Skeleton';
import { ROUTES } from '@/shared/lib/constants';
import styles from './SearchPage.module.css';

function formatRating(rating: number) {
  return Number.isFinite(rating) ? rating.toFixed(1) : 'No rating';
}

function formatReviewCount(count: number) {
  return `${count} review${count === 1 ? '' : 's'}`;
}

export function SearchPage() {
  const {
    albums,
    isLoading,
    error,
    fetchTab,
  } = useChartsStore((state) => state);
  const spotlightAlbum = albums[0];
  const rankedAlbums = albums.slice(1, 9);

  useEffect(() => {
    void fetchTab('top-all-time');
  }, [fetchTab]);

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Album discovery</p>
          <h1 className={styles.title}>Find your next essential record</h1>
          <p className={styles.subtitle}>
            Browse community favorites from the charts. For a specific album, use the autocomplete search in the navbar and jump straight to its album page.
          </p>
          <Link to={ROUTES.CHARTS} className={styles.primaryLink}>
            Open full charts
          </Link>
        </div>

        <div className={styles.spotlight}>
          {isLoading && !spotlightAlbum ? (
            <div className={styles.spotlightSkeleton}>
              <Skeleton height="100%" borderRadius="0" />
            </div>
          ) : null}

          {!isLoading && spotlightAlbum ? (
            <Link to={`${ROUTES.ALBUMS}/${spotlightAlbum.id}`} className={styles.spotlightCard}>
              <img
                src={spotlightAlbum.coverUrl ?? 'https://placehold.co/520x520?text=No+Cover'}
                alt={spotlightAlbum.title}
                className={styles.spotlightCover}
              />
              <div className={styles.spotlightCopy}>
                <p className={styles.spotlightRank}>#1 Top All Time</p>
                <h2 className={styles.spotlightTitle}>{spotlightAlbum.title}</h2>
                <p className={styles.spotlightArtist}>
                  {spotlightAlbum.artist}{spotlightAlbum.year ? ` - ${spotlightAlbum.year}` : ''}
                </p>
                <div className={styles.metrics}>
                  <span>{formatRating(spotlightAlbum.avgRating)} avg</span>
                  <span>{formatReviewCount(spotlightAlbum.reviewCount)}</span>
                </div>
              </div>
            </Link>
          ) : null}

          {!isLoading && !spotlightAlbum ? (
            <div className={styles.emptySpotlight}>
              <p className={styles.emptyTitle}>No charted albums yet</p>
              <p className={styles.emptyText}>Rated albums will appear here as the community adds reviews.</p>
            </div>
          ) : null}
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Top All Time</p>
            <h2 className={styles.sectionTitle}>Community favorites</h2>
          </div>
          <Link to={ROUTES.CHARTS} className={styles.textLink}>See charts</Link>
        </div>

        {error ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Charts unavailable</p>
            <p className={styles.emptyText}>{error}</p>
          </div>
        ) : null}

        {isLoading && !error ? (
          <div className={styles.albumGrid}>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className={styles.skeletonTile}>
                <Skeleton height="auto" borderRadius="0" style={{ aspectRatio: '1' }} />
                <Skeleton height="1rem" />
                <Skeleton height="0.8rem" width="72%" />
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && !error && rankedAlbums.length > 0 ? (
          <div className={styles.albumGrid}>
            {rankedAlbums.map((album, index) => (
              <Link key={album.id} to={`${ROUTES.ALBUMS}/${album.id}`} className={styles.albumTile}>
                <div className={styles.coverFrame}>
                  <img
                    src={album.coverUrl ?? 'https://placehold.co/320x320?text=No+Cover'}
                    alt={album.title}
                    className={styles.cover}
                    loading="lazy"
                  />
                </div>
                <div className={styles.tileCopy}>
                  <div className={styles.rankLine}>
                    <span className={styles.rankBadge}>#{index + 2}</span>
                    <span>{formatRating(album.avgRating)} avg</span>
                  </div>
                  <h3 className={styles.tileTitle}>{album.title}</h3>
                  <p className={styles.tileArtist}>{album.artist}{album.year ? ` - ${album.year}` : ''}</p>
                  <p className={styles.tileReviews}>{formatReviewCount(album.reviewCount)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className={styles.searchMessage}>
        <div>
          <p className={styles.eyebrow}>Looking for something specific?</p>
          <h2 className={styles.sectionTitle}>Use the navbar search</h2>
        </div>
        <p className={styles.searchMessageText}>
          Start typing an album title in the top bar, choose a suggestion, and music-social will route directly to that AlbumPage.
        </p>
      </section>
    </section>
  );
}

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/shared/components/Skeleton';
import { ROUTES } from '@/shared/lib/constants';
import { useArtistsStore } from '../stores/artistsStore';
import type { ArtistSummary } from '../types';
import styles from './ArtistsPage.module.css';

const SKELETON_CARDS = Array.from({ length: 8 }, (_, index) => index);

function formatCount(count: number, label: string) {
  return `${count} ${label}${count === 1 ? '' : 's'}`;
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';
}

function ArtistCard({ artist }: { artist: ArtistSummary }) {
  return (
    <Link to={`${ROUTES.ARTISTS}/${artist.mbid}`} className={styles.card}>
      <div className={styles.imageWrap}>
        {artist.imageUrl ? (
          <img src={artist.imageUrl} alt={artist.name} className={styles.image} loading="lazy" />
        ) : (
          <div className={styles.imageFallback}>{initialsFor(artist.name)}</div>
        )}
      </div>

      <div className={styles.cardCopy}>
        <div className={styles.cardHeader}>
          <h3 className={styles.artistName}>{artist.name}</h3>
          {artist.country ? <span className={styles.countryPill}>{artist.country}</span> : null}
        </div>
        {artist.bio ? <p className={styles.bio}>{artist.bio}</p> : <p className={styles.bio}>MusicBrainz artist</p>}
        <div className={styles.metrics}>
          <span>{formatCount(artist.albumCount, 'album')}</span>
          <span>{formatCount(artist.reviewCount, 'review')}</span>
        </div>
      </div>
    </Link>
  );
}

function ArtistSkeletonCard() {
  return (
    <article className={`${styles.card} ${styles.skeletonCard}`}>
      <Skeleton width="72px" height="72px" borderRadius="8px" />
      <div className={styles.skeletonCopy}>
        <Skeleton width="64%" height="18px" />
        <Skeleton width="82%" height="14px" />
        <Skeleton width="48%" height="28px" borderRadius="999px" />
      </div>
    </article>
  );
}

export function ArtistsPage() {
  const {
    featured,
    results,
    query: activeQuery,
    total,
    hasMore,
    isSearching,
    isLoadingMore,
    isFeaturedLoading,
    error,
    fetchPopular,
    search,
    loadMore,
  } = useArtistsStore();
  const [artistSearchQuery, setArtistSearchQuery] = useState('');
  const activeQueryRef = useRef(activeQuery);
  const trimmedQuery = artistSearchQuery.trim();
  const isViewingSearch = Boolean(trimmedQuery);
  const isCurrentQuery = isViewingSearch && activeQuery === trimmedQuery;
  const isSearchLoading = isViewingSearch && (isSearching || !isCurrentQuery);
  const visibleArtists = isViewingSearch ? (isCurrentQuery ? results : []) : featured;

  useEffect(() => {
    activeQueryRef.current = activeQuery;
  }, [activeQuery]);

  useEffect(() => {
    void fetchPopular();
  }, [fetchPopular]);

  useEffect(() => {
    if (!trimmedQuery) return;

    const timer = window.setTimeout(() => {
      if (trimmedQuery !== activeQueryRef.current) {
        void search(trimmedQuery);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search, trimmedQuery]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedQuery || trimmedQuery === activeQueryRef.current) return;
    void search(trimmedQuery);
  }

  return (
    <div className={styles.page}>
      <header className={styles.headerPanel}>
        <p className={styles.eyebrow}>MusicBrainz directory</p>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Artists</h1>
            <p className={styles.subtitle}>
              Search cached artists and expand from MusicBrainz when the local catalog needs more results.
            </p>
          </div>
          <div className={styles.summaryPill}>
            <span className={styles.summaryValue}>
              {isViewingSearch ? (isSearchLoading ? '...' : total) : (isFeaturedLoading ? '...' : featured.length)}
            </span>
            <span className={styles.summaryLabel}>{isViewingSearch ? 'artists found' : 'featured artists'}</span>
          </div>
        </div>
      </header>

      <section className={styles.searchPanel} aria-label="Artist search">
        <form className={styles.searchForm} role="search" onSubmit={handleSubmit}>
          <label className={styles.searchLabel} htmlFor="artistSearch">Search artists</label>
          <input
            id="artistSearch"
            type="search"
            value={artistSearchQuery}
            onChange={(event) => setArtistSearchQuery(event.target.value)}
            className={styles.searchInput}
            placeholder="Try Radiohead, Bjork, Kendrick Lamar..."
          />
        </form>
      </section>

      <section className={styles.resultsSection}>
        <div className={styles.resultsHeader}>
          <div>
            <p className={styles.resultsEyebrow}>Now showing</p>
            <h2 className={styles.resultsTitle}>
              {isViewingSearch ? `Results for "${trimmedQuery}"` : 'Popular artists'}
            </h2>
          </div>
          <span className={styles.resultsCount}>
            {isViewingSearch
              ? (isSearchLoading ? 'Searching' : `${visibleArtists.length}${hasMore ? '+' : ''} visible`)
              : (isFeaturedLoading ? 'Loading' : `${visibleArtists.length} visible`)}
          </span>
        </div>

        {error && !isSearchLoading && !isFeaturedLoading ? <p className={styles.empty}>{error}</p> : null}

        {isSearchLoading || (!isViewingSearch && isFeaturedLoading && featured.length === 0) ? (
          <div className={styles.grid} aria-hidden="true">
            {SKELETON_CARDS.map((index) => (
              <ArtistSkeletonCard key={index} />
            ))}
          </div>
        ) : null}

        {!isSearchLoading && !isFeaturedLoading && !error && visibleArtists.length === 0 ? (
          <p className={styles.empty}>
            {isViewingSearch ? 'No artists found. Try a different spelling.' : 'No featured artists yet.'}
          </p>
        ) : null}

        {!isSearchLoading && !error && visibleArtists.length > 0 ? (
          <>
            <div className={styles.grid}>
              {visibleArtists.map((artist) => (
                <ArtistCard key={`${artist.id}-${artist.mbid}`} artist={artist} />
              ))}
            </div>

            {isLoadingMore ? <p className={styles.empty}>Loading more artists...</p> : null}

            {isViewingSearch && hasMore ? (
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

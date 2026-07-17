import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlbumCard } from '../components/AlbumCard';
import { SkeletonAlbumCard } from '@/shared/components/Skeleton';
import { useAlbumsStore } from '../stores/albumsStore';
import styles from './SearchPage.module.css';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q')?.trim() ?? '';
  const {
    results,
    isLoading,
    isLoadingMore,
    hasMore,
    search,
    loadMore,
    query: activeQuery,
  } = useAlbumsStore((state) => state);
  const isViewingQuery = Boolean(urlQuery);
  const isCurrentQuery = isViewingQuery && activeQuery === urlQuery;
  const visibleResults = isCurrentQuery ? results : [];
  const isSearchingCurrentQuery = isViewingQuery && (isLoading || !isCurrentQuery);

  useEffect(() => {
    if (urlQuery && urlQuery !== activeQuery) {
      void search(urlQuery);
    }
  }, [activeQuery, search, urlQuery]);

  return (
    <section className={styles.page}>
      <div className={styles.searchPanel}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>MusicBrainz lookup</p>
          <h1 className={styles.title}>Search albums</h1>
          <p className={styles.subtitle}>
            {isViewingQuery
              ? `Showing expanded results for "${urlQuery}".`
              : 'Use the album search in the navbar to find records from anywhere in music-social.'}
          </p>
        </div>
      </div>

      {visibleResults.length > 0 ? (
        <div className={styles.resultsHeader}>
          <p className={styles.resultsCount}>{visibleResults.length} albums found</p>
        </div>
      ) : null}

      <div className={styles.grid}>
        {isSearchingCurrentQuery && visibleResults.length === 0 ? (
          Array.from({ length: 10 }).map((_, i) => (
            <SkeletonAlbumCard key={i} />
          ))
        ) : (
          <>
            {visibleResults.map((album) => (
              <AlbumCard key={album.mbid} album={album} />
            ))}
            {isLoadingMore && Array.from({ length: 4 }).map((_, i) => (
              <SkeletonAlbumCard key={`more-${i}`} />
            ))}
          </>
        )}
      </div>

      {!isSearchingCurrentQuery && visibleResults.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>{isViewingQuery ? 'No albums found' : 'Search from the navbar'}</p>
          <p className={styles.emptyText}>
            {isViewingQuery
              ? 'Try a different spelling, artist name, or release title in the navbar search.'
              : 'Start typing an album title in the top bar to open live suggestions.'}
          </p>
        </div>
      ) : null}
      {!isSearchingCurrentQuery && isCurrentQuery && hasMore ? (
        <div className={styles.loadMoreRow}>
          <button type="button" className={styles.loadMoreButton} onClick={() => void loadMore()} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      ) : null}
    </section>
  );
}

import { useState, useEffect, type FormEvent } from 'react';
import { AlbumCard } from '../components/AlbumCard';
import { SkeletonAlbumCard } from '@/shared/components/Skeleton';
import { useAlbumsStore } from '../stores/albumsStore';
import styles from './SearchPage.module.css';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const { results, isLoading, isLoadingMore, hasMore, search, loadMore } = useAlbumsStore((state) => state);

  // Debounce search with 400ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        search(query.trim());
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, search]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <section className={styles.page}>
      <div className={styles.searchPanel}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>MusicBrainz lookup</p>
          <h1 className={styles.title}>Search albums</h1>
          <p className={styles.subtitle}>Find records, compare releases, and add the right album to your music graph.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.searchForm}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: Abbey Road"
            className={styles.input}
          />
          <button type="submit" disabled={isLoading} className={styles.searchButton}>
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {results.length > 0 ? (
        <div className={styles.resultsHeader}>
          <p className={styles.resultsCount}>{results.length} albums found</p>
        </div>
      ) : null}

      <div className={styles.grid}>
        {isLoading && results.length === 0 ? (
          Array.from({ length: 10 }).map((_, i) => (
            <SkeletonAlbumCard key={i} />
          ))
        ) : (
          <>
            {results.map((album) => (
              <AlbumCard key={album.mbid} album={album} />
            ))}
            {isLoadingMore && Array.from({ length: 4 }).map((_, i) => (
              <SkeletonAlbumCard key={`more-${i}`} />
            ))}
          </>
        )}
      </div>

      {!isLoading && results.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>{query.trim() ? 'No albums found' : 'Start with a record title'}</p>
          <p className={styles.emptyText}>
            {query.trim() ? 'Try a different spelling, artist name, or release title.' : 'Search results will appear here as album cards.'}
          </p>
        </div>
      ) : null}
      {!isLoading && hasMore ? (
        <div className={styles.loadMoreRow}>
          <button type="button" className={styles.loadMoreButton} onClick={() => void loadMore()} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      ) : null}
    </section>
  );
}

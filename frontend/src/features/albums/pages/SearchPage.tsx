import { useState, useEffect, type FormEvent } from 'react';
import { AlbumCard } from '../components/AlbumCard';
import { SkeletonAlbumCard } from '@/shared/components/Skeleton';
import { useAlbumsStore } from '../stores/albumsStore';
import styles from './SearchPage.module.css';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const { results, isLoading, search } = useAlbumsStore((state) => state);

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
      <h1 className={styles.title}>Search albums</h1>
      <p className={styles.subtitle}>Search MusicBrainz and cache the result locally.</p>

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

      <div className={styles.grid}>
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <SkeletonAlbumCard key={i} />
          ))
        ) : (
          results.map((album) => (
            <AlbumCard key={album.mbid} album={album} />
          ))
        )}
      </div>

      {!isLoading && results.length === 0 ? <p className={styles.empty}>No albums found yet.</p> : null}
    </section>
  );
}

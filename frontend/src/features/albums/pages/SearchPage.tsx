import { useState, type FormEvent } from 'react';
import { AlbumCard } from '../components/AlbumCard';
import { useAlbumsStore } from '../stores/albumsStore';
import styles from './SearchPage.module.css';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const { results, isLoading, error, search } = useAlbumsStore((state) => state);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    await search(query.trim());
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

      {error ? <p role="alert" className={styles.error}>{error}</p> : null}

      <div className={styles.grid}>
        {results.map((album) => (
          <AlbumCard key={album.mbid} album={album} />
        ))}
      </div>

      {!isLoading && results.length === 0 ? <p className={styles.empty}>No albums found yet.</p> : null}
    </section>
  );
}
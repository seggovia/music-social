import { useState, type FormEvent } from 'react';
import { AlbumCard } from '../components/AlbumCard';
import { useAlbumsStore } from '../stores/albumsStore';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const { results, isLoading, error, search } = useAlbumsStore((state) => state);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    await search(query.trim());
  }

  return (
    <section style={{ maxWidth: 1080, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Search albums</h1>
      <p>Search MusicBrainz and cache the result locally.</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try: Abbey Road"
          style={{ flex: 1, padding: '0.75rem' }}
        />
        <button type="submit" disabled={isLoading}>{isLoading ? 'Searching...' : 'Search'}</button>
      </form>

      {error ? <p role="alert">{error}</p> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {results.map((album) => (
          <AlbumCard key={album.mbid} album={album} />
        ))}
      </div>

      {!isLoading && results.length === 0 ? <p>No albums found yet.</p> : null}
    </section>
  );
}

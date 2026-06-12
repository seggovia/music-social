import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAlbumsStore } from '../stores/albumsStore';

export function AlbumPage() {
  const { id } = useParams();
  const { currentAlbum, isLoading, error, fetchAlbum } = useAlbumsStore((state) => state);

  useEffect(() => {
    if (!id) return;
    void fetchAlbum(id);
  }, [fetchAlbum, id]);

  if (!id) {
    return <p>Album not found.</p>;
  }

  if (isLoading) {
    return <p>Loading album details…</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!currentAlbum) {
    return <p>No album details available.</p>;
  }

  return (
    <article style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <img
        src={currentAlbum.coverUrl ?? 'https://placehold.co/400x400?text=No+Cover'}
        alt={currentAlbum.title}
        style={{ width: 320, height: 320, objectFit: 'cover', borderRadius: 16 }}
      />
      <h1>{currentAlbum.title}</h1>
      <p><strong>Artist:</strong> {currentAlbum.artist}</p>
      <p><strong>Year:</strong> {currentAlbum.year ?? 'Unknown'}</p>
      <p><strong>Tracks:</strong> {currentAlbum.trackCount ?? 'Unknown'}</p>
      <p><strong>Genres:</strong> {currentAlbum.genres?.join(', ') ?? 'Not available'}</p>
      <h2>Tracklist</h2>
      <ul>
        {(currentAlbum.tracks ?? []).map((track, index) => (
          <li key={`${currentAlbum.mbid}-${index}`}>{track.number ? `${track.number}. ` : ''}{track.title}</li>
        ))}
      </ul>
    </article>
  );
}

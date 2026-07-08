import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useArtistsStore } from '../../artists/stores/artistsStore';
import type { ArtistAlbum } from '../types';
export function ArtistPage() {
  const { mbid } = useParams();
  const { currentArtist, isLoading, fetchArtist } = useArtistsStore();

  useEffect(() => {
    if (!mbid) return;
    void fetchArtist(mbid);
  }, [fetchArtist, mbid]);

  if (!mbid) return <p>Artist not found.</p>;
  if (isLoading) return <p>Loading artist...</p>;
  if (!currentArtist) return <p>No artist details available.</p>;

  return (
    <article style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>{currentArtist.name}</h1>
      <div style={{ color: '#666', marginBottom: '1rem' }}>
        {currentArtist.country && <span>📍 {currentArtist.country}</span>}
        {currentArtist.formedYear && <span style={{ marginLeft: '1rem' }}>🎸 Since {currentArtist.formedYear}</span>}
      </div>
      {currentArtist.bio && (
        <p style={{ maxWidth: 600, lineHeight: 1.6 }}>{currentArtist.bio}</p>
      )}

      <hr style={{ margin: '2rem 0' }} />

      <h2>Discography ({currentArtist.albums.length})</h2>
      {currentArtist.albums.length === 0 ? (
        <p>No albums cached yet. Search for albums by this artist to populate their discography.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {currentArtist.albums.map((album: ArtistAlbum) => (
            <Link
              key={album.id}
              to={`/albums/${album.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                <img
                  src={album.coverUrl ?? 'https://placehold.co/160x160?text=No+Cover'}
                  alt={album.title}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
                />
                <div style={{ padding: '0.5rem' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.85rem' }}>{album.title}</p>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>{album.year ?? 'Unknown year'}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

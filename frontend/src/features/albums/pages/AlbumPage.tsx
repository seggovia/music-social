import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ReviewForm } from '@/features/reviews/components/ReviewForm';
import { ReviewList } from '@/features/reviews/components/ReviewList';
import { useReviewsStore } from '@/features/reviews/stores/reviewsStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useAlbumsStore } from '../stores/albumsStore';

export function AlbumPage() {
  const { id } = useParams();
  const { currentAlbum, isLoading, error, fetchAlbum } = useAlbumsStore((state) => state);
  const fetchByAlbum = useReviewsStore((state) => state.fetchByAlbum);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!id) return;
    void fetchAlbum(id);
    void fetchByAlbum(id);
  }, [fetchAlbum, fetchByAlbum, id]);

  if (!id) return <p>Album not found.</p>;
  if (isLoading) return <p>Loading album details…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!currentAlbum) return <p>No album details available.</p>;

  return (
    <article style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <img
          src={currentAlbum.coverUrl ?? 'https://placehold.co/400x400?text=No+Cover'}
          alt={currentAlbum.title}
          style={{ width: 280, height: 280, objectFit: 'cover', borderRadius: 12 }}
        />
        <div>
          <h1 style={{ marginTop: 0 }}>{currentAlbum.title}</h1>
          <p>
            <strong>Artist:</strong>{' '}
            {currentAlbum.artistMbid ? (
              <Link to={`/artists/${currentAlbum.artistMbid}`}>
                {currentAlbum.artist}
              </Link>
            ) : (
              currentAlbum.artist
            )}
          </p>
          <p><strong>Year:</strong> {currentAlbum.year ?? 'Unknown'}</p>
          <p><strong>Tracks:</strong> {currentAlbum.trackCount ?? 'Unknown'}</p>
          <p><strong>Genres:</strong> {currentAlbum.genres?.join(', ') || 'Not available'}</p>
        </div>
      </div>

      {(currentAlbum.tracks ?? []).length > 0 && (
        <>
          <h2>Tracklist</h2>
          <ol>
            {currentAlbum.tracks!.map((track, index) => (
              <li key={`${currentAlbum.mbid}-${index}`}>
                {track.title}
              </li>
            ))}
          </ol>
        </>
      )}

      <hr style={{ margin: '2rem 0' }} />

      <ReviewList />

      {user ? (
        <ReviewForm albumId={currentAlbum.id} onSuccess={() => fetchByAlbum(currentAlbum.id)} />
      ) : (
        <p><a href="/login">Log in</a> to write a review.</p>
      )}
    </article>
  );
}
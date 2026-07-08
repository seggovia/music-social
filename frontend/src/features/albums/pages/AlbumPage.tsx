import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Skeleton } from '@/shared/components/Skeleton';
import { ReviewForm } from '@/features/reviews/components/ReviewForm';
import { ReviewList } from '@/features/reviews/components/ReviewList';
import { useReviewsStore } from '@/features/reviews/stores/reviewsStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useAlbumsStore } from '../stores/albumsStore';
import styles from './AlbumPage.module.css';

export function AlbumPage() {
  const { id } = useParams();
  const { currentAlbum, isLoading, fetchAlbum } = useAlbumsStore((state) => state);
  const fetchByAlbum = useReviewsStore((state) => state.fetchByAlbum);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!id) return;
    void fetchAlbum(id);
    void fetchByAlbum(id);
  }, [fetchAlbum, fetchByAlbum, id]);

  if (!id) return <p className={styles.page}>Album not found.</p>;
  if (isLoading) {
    return (
      <article className={styles.page}>
        <div className={styles.hero}>
          <Skeleton width="280px" height="280px" borderRadius="12px" />
          <div className={styles.details}>
            <Skeleton width="300px" height="20px" />
            <div style={{ marginTop: '1rem' }}>
              <Skeleton width="200px" height="20px" />
              <Skeleton width="150px" height="20px" style={{ marginTop: '0.5rem' }} />
              <Skeleton width="180px" height="20px" style={{ marginTop: '0.5rem' }} />
            </div>
          </div>
        </div>
      </article>
    );
  }
  if (!currentAlbum) return <p className={styles.page}>No album details available.</p>;

  return (
    <article className={styles.page}>
      <div className={styles.hero}>
        <img
          src={currentAlbum.coverUrl ?? 'https://placehold.co/400x400?text=No+Cover'}
          alt={currentAlbum.title}
          className={styles.cover}
          loading="lazy"
        />
        <div className={styles.details}>
          <h1 className={styles.albumTitle}>{currentAlbum.title}</h1>
          <div className={styles.meta}>
            <p>
              <strong>Artist:</strong>{' '}
              {currentAlbum.artistMbid ? (
                <Link to={`/artists/${currentAlbum.artistMbid}`} className={styles.artistLink}>
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
      </div>

      {(currentAlbum.tracks ?? []).length > 0 && (
        <div className={styles.tracklist}>
          <h2>Tracklist</h2>
          <ol>
            {currentAlbum.tracks!.map((track, index) => (
              <li key={`${currentAlbum.mbid}-${index}`}>
                {track.title}
              </li>
            ))}
          </ol>
        </div>
      )}

      <hr className={styles.divider} />

      <ReviewList />

      {user ? (
        <ReviewForm albumId={currentAlbum.id} onSuccess={() => fetchByAlbum(currentAlbum.id)} />
      ) : (
        <p className={styles.loginPrompt}><Link to="/login">Log in</Link> to write a review.</p>
      )}
    </article>
  );
}

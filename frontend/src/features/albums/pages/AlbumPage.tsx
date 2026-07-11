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
            <div className={styles.loadingMeta}>
              <Skeleton width="200px" height="20px" />
              <Skeleton width="150px" height="20px" />
              <Skeleton width="180px" height="20px" />
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
        <div className={styles.coverPanel}>
          <img
            src={currentAlbum.coverUrl ?? 'https://placehold.co/400x400?text=No+Cover'}
            alt={currentAlbum.title}
            className={styles.cover}
            loading="lazy"
          />
        </div>
        <div className={styles.details}>
          <p className={styles.eyebrow}>Album</p>
          <h1 className={styles.albumTitle}>{currentAlbum.title}</h1>
          <div className={styles.artistLine}>
            <span>by</span>{' '}
            {currentAlbum.artistMbid ? (
              <Link to={`/artists/${currentAlbum.artistMbid}`} className={styles.artistLink}>
                {currentAlbum.artist}
              </Link>
            ) : (
              <span className={styles.artistName}>{currentAlbum.artist}</span>
            )}
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Year</span>
              <span className={styles.metaValue}>{currentAlbum.year ?? 'Unknown'}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Tracks</span>
              <span className={styles.metaValue}>{currentAlbum.trackCount ?? 'Unknown'}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Release</span>
              <span className={styles.metaValue}>{currentAlbum.releaseDate ?? 'Unknown'}</span>
            </div>
          </div>

          <div className={styles.genreList} aria-label="Genres">
            {(currentAlbum.genres ?? []).length > 0 ? (
              currentAlbum.genres!.map((genre) => (
                <span key={genre} className={styles.genrePill}>{genre}</span>
              ))
            ) : (
              <span className={styles.genrePillMuted}>Genres not available</span>
            )}
          </div>
        </div>
      </div>

      {(currentAlbum.tracks ?? []).length > 0 && (
        <div className={styles.tracklist}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>Sequence</p>
            <h2>Tracklist</h2>
          </div>
          <ol>
            {currentAlbum.tracks!.map((track, index) => (
              <li key={`${currentAlbum.mbid}-${index}`}>
                <span className={styles.trackNumber}>{String(track.number ?? index + 1).padStart(2, '0')}</span>
                <span className={styles.trackTitle}>{track.title}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <section className={styles.reviewsSection}>
        <ReviewList />

        {user ? (
          <ReviewForm albumId={currentAlbum.id} onSuccess={() => fetchByAlbum(currentAlbum.id)} />
        ) : (
          <p className={styles.loginPrompt}><Link to="/login">Log in</Link> to write a review.</p>
        )}
      </section>
    </article>
  );
}

import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ReviewForm } from '@/features/reviews/components/ReviewForm';
import { ReviewList } from '@/features/reviews/components/ReviewList';
import { useReviewsStore } from '@/features/reviews/stores/reviewsStore';
import { Skeleton } from '@/shared/components/Skeleton';
import { Badge, Button, Card } from '@/shared/components/ui';
import { ROUTES } from '@/shared/lib/constants';
import { useAlbumsStore } from '../stores/albumsStore';
import styles from './AlbumPage.module.css';

function formatRating(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : '0.0';
}

function RatingStars({ rating }: { rating: number }) {
  const filledStars = Math.round(Math.min(5, Math.max(0, rating)));

  return (
    <span className={styles.stars} aria-label={`${formatRating(rating)} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={index < filledStars ? styles.starFilled : styles.starEmpty}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function AlbumPage() {
  const { id } = useParams();
  const { currentAlbum, isLoading, fetchAlbum } = useAlbumsStore((state) => state);
  const fetchByAlbum = useReviewsStore((state) => state.fetchByAlbum);
  const reviews = useReviewsStore((state) => state.reviews);
  const totalReviews = useReviewsStore((state) => state.total);
  const user = useAuthStore((state) => state.user);
  const existingReview = user
    ? reviews.find((review) => review.user_id === user.id && review.album_id === currentAlbum?.id)
    : null;
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length
    : 0;

  useEffect(() => {
    if (!id) return;
    void fetchAlbum(id);
    void fetchByAlbum(id);
  }, [fetchAlbum, fetchByAlbum, id]);

  function scrollToRatingForm() {
    document.getElementById('album-review-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  if (!id) return <p className={styles.page}>Álbum no encontrado.</p>;
  if (isLoading) {
    return (
      <article className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.coverColumn}>
            <Skeleton width="280px" height="280px" borderRadius="17px" />
          </div>
          <div className={styles.details}>
            <Skeleton width="220px" height="16px" />
            <Skeleton width="min(560px, 100%)" height="58px" />
            <Skeleton width="280px" height="24px" />
            <Skeleton width="100%" height="116px" borderRadius="17px" />
          </div>
        </div>
      </article>
    );
  }
  if (!currentAlbum) return <p className={styles.page}>No hay detalles disponibles para este álbum.</p>;

  const genreLabel = (currentAlbum.genres ?? []).slice(0, 2).join(' · ') || 'Álbum';
  const yearLabel = currentAlbum.year ? ` · ${currentAlbum.year}` : '';

  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.coverColumn}>
          <img
            src={currentAlbum.coverUrl ?? 'https://placehold.co/560x560?text=No+Cover'}
            alt={currentAlbum.title}
            className={styles.cover}
          />
          <div className={styles.coverActions}>
            <Button
              className={styles.listenButton}
              disabled
              title="La reproducción todavía no está disponible"
            >
              <span aria-hidden="true">▶</span>
              Escuchar
            </Button>
            <Button
              variant="secondary"
              className={styles.iconButton}
              aria-label="Añadir álbum"
              title="Añadir álbum"
            >
              <span aria-hidden="true">＋</span>
            </Button>
            <Button
              variant="secondary"
              className={styles.iconButton}
              aria-label="Compartir álbum"
              title="Compartir álbum"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="18" cy="5" r="2.5" />
                <circle cx="6" cy="12" r="2.5" />
                <circle cx="18" cy="19" r="2.5" />
                <path d="m8.3 10.8 7.4-4.5M8.3 13.2l7.4 4.5" />
              </svg>
            </Button>
          </div>
        </div>

        <div className={styles.details}>
          <p className={styles.albumMeta}>{genreLabel}{yearLabel}</p>
          <h1 className={styles.albumTitle}>{currentAlbum.title}</h1>
          <p className={styles.artistLine}>
            {currentAlbum.artistMbid ? (
              <Link to={`${ROUTES.ARTISTS}/${currentAlbum.artistMbid}`} className={styles.artistLink}>
                {currentAlbum.artist}
              </Link>
            ) : (
              <span>{currentAlbum.artist}</span>
            )}
          </p>

          <Card className={styles.ratingSummary}>
            <div className={styles.ratingScore}>
              <strong>{formatRating(averageRating)}</strong>
              <span>/5.0</span>
            </div>
            <div className={styles.ratingDetails}>
              <RatingStars rating={averageRating} />
              <span className={styles.ratingCount}>
                {totalReviews} {totalReviews === 1 ? 'calificación' : 'calificaciones'}
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              className={styles.rateButton}
              onClick={scrollToRatingForm}
            >
              Calificar álbum
            </Button>
          </Card>

          {currentAlbum.description ? (
            <p className={styles.description}>{currentAlbum.description}</p>
          ) : null}

          {(currentAlbum.genres ?? []).length > 2 ? (
            <div className={styles.genreList} aria-label="Géneros">
              {currentAlbum.genres!.slice(2).map((genre) => (
                <Badge key={genre} variant="accent">{genre}</Badge>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className={styles.contentGrid}>
        <section className={styles.trackSection} aria-labelledby="tracklist-title">
          <div className={styles.sectionHeader}>
            <h2 id="tracklist-title">Tracklist</h2>
            {currentAlbum.trackCount ? (
              <span className={styles.sectionCount}>{currentAlbum.trackCount} tracks</span>
            ) : null}
          </div>

          <Card padding="none" className={styles.trackCard}>
            {(currentAlbum.tracks ?? []).length > 0 ? (
              <ol className={styles.trackList}>
                {currentAlbum.tracks!.map((track, index) => (
                  <li key={`${currentAlbum.mbid}-${index}`} className={styles.trackRow}>
                    <span className={styles.trackNumber}>
                      {String(track.number ?? index + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.trackTitle}>{track.title}</span>
                    <span className={styles.trackDuration}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="8.5" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      {track.duration ?? '—'}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className={styles.trackEmpty}>
                <p>Tracklist no disponible.</p>
                {currentAlbum.trackCount ? (
                  <span>Este lanzamiento contiene {currentAlbum.trackCount} tracks.</span>
                ) : null}
              </div>
            )}
          </Card>
        </section>

        <section className={styles.reviewsSection} aria-label="Reviews del álbum">
          <ReviewList />

          <div id="album-review-form" className={styles.reviewFormAnchor}>
            {user ? (
              <ReviewForm albumId={currentAlbum.id} existingReview={existingReview} />
            ) : (
              <Card className={styles.loginPrompt}>
                <Link to={ROUTES.LOGIN}>Inicia sesión</Link> para calificar este álbum.
              </Card>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}

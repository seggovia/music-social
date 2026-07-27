import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Skeleton } from '@/shared/components/Skeleton';
import { ROUTES } from '@/shared/lib/constants';
import { ReviewComments } from '../components/ReviewComments';
import { useReviewsFeedStore } from '../stores/reviewsFeedStore';
import type { FeedReview, ReviewFeedScope } from '../types';
import styles from './ReviewsPage.module.css';

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha desconocida' : dateFormatter.format(date);
}

function formatRating(value: number) {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function FeedSkeleton() {
  return (
    <div className={styles.timeline} aria-label="Cargando reseñas">
      {Array.from({ length: 4 }).map((_, index) => (
        <article key={index} className={`${styles.reviewCard} ${styles.skeletonCard}`} aria-hidden="true">
          <Skeleton width={58} height={58} borderRadius="999px" />
          <div className={styles.skeletonContent}>
            <Skeleton width="32%" height={16} />
            <div className={styles.skeletonAlbum}>
              <Skeleton width={76} height={76} borderRadius={8} />
              <div className={styles.skeletonAlbumCopy}>
                <Skeleton width="58%" height={18} />
                <Skeleton width="38%" height={14} />
              </div>
            </div>
            <Skeleton width="92%" height={14} />
            <Skeleton width="72%" height={14} />
          </div>
        </article>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: FeedReview }) {
  const initial = review.author.username.charAt(0).toUpperCase() || '?';
  const userPath = `${ROUTES.USERS}/${encodeURIComponent(review.author.username)}`;
  const albumPath = `${ROUTES.ALBUMS}/${encodeURIComponent(review.album.id)}`;
  const artistPath = review.album.artist.id
    ? `${ROUTES.ARTISTS}/${encodeURIComponent(review.album.artist.id)}`
    : null;

  return (
    <article className={styles.reviewCard}>
      <Link to={userPath} className={styles.avatarLink} aria-label={`Ver perfil de ${review.author.username}`}>
        {review.author.avatarUrl ? (
          <img src={review.author.avatarUrl} alt="" className={styles.avatar} loading="lazy" />
        ) : (
          <span className={styles.avatarFallback} aria-hidden="true">{initial}</span>
        )}
      </Link>

      <div className={styles.cardContent}>
        <header className={styles.cardHeader}>
          <p className={styles.authorLine}>
            <Link to={userPath} className={styles.authorLink}>{review.author.username}</Link>
            <span>publicó una reseña</span>
          </p>
          <time className={styles.date} dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
        </header>

        <div className={styles.albumRow}>
          <Link to={albumPath} className={styles.coverLink} aria-label={`Ver ${review.album.title}`}>
            <img
              src={review.album.coverUrl ?? 'https://placehold.co/152x152?text=No+Cover'}
              alt={`Portada de ${review.album.title}`}
              className={styles.cover}
              loading="lazy"
            />
          </Link>

          <div className={styles.albumCopy}>
            <Link to={albumPath} className={styles.albumTitle}>{review.album.title}</Link>
            {artistPath ? (
              <Link to={artistPath} className={styles.artistName}>{review.album.artist.name}</Link>
            ) : (
              <span className={styles.artistName}>{review.album.artist.name}</span>
            )}
          </div>

          <span className={styles.rating} aria-label={`${formatRating(review.rating)} de 5`}>
            <span aria-hidden="true">★</span> {formatRating(review.rating)}
          </span>
        </div>

        <p className={review.content ? styles.reviewText : `${styles.reviewText} ${styles.reviewTextEmpty}`}>
          {review.content || 'Esta reseña no incluye texto.'}
        </p>
        <ReviewComments reviewId={review.id} initialCount={review.commentCount} />
      </div>
    </article>
  );
}

export function ReviewsPage() {
  const [activeScope, setActiveScope] = useState<ReviewFeedScope>('all');
  const userId = useAuthStore((state) => state.user?.id);
  const { items, total, isLoading, isLoadingMore, hasMore, error, fetchFeed, loadMore } = useReviewsFeedStore();
  const requiresLogin = activeScope === 'following' && !userId;

  useEffect(() => {
    if (activeScope === 'following' && !userId) return;
    void fetchFeed(activeScope);
  }, [activeScope, fetchFeed, userId]);

  return (
    <div className={styles.page}>
      <header className={styles.headerPanel}>
        <div>
          <p className={styles.eyebrow}>La comunidad está escuchando</p>
          <h1 className={styles.title}>Reviews recientes</h1>
          <p className={styles.subtitle}>
            Opiniones nuevas sobre los álbumes que están sonando en music-social.
          </p>
        </div>
        {!isLoading && !requiresLogin ? (
          <div className={styles.totalPill} aria-label={`${total} reseñas en este feed`}>
            <span className={styles.totalValue}>{total}</span>
            <span className={styles.totalLabel}>reseñas</span>
          </div>
        ) : null}
      </header>

      <div className={styles.feedToolbar}>
        <div className={styles.toggle} role="group" aria-label="Filtrar reviews">
          <button
            type="button"
            className={activeScope === 'all' ? `${styles.toggleButton} ${styles.toggleButtonActive}` : styles.toggleButton}
            onClick={() => setActiveScope('all')}
            aria-pressed={activeScope === 'all'}
          >
            Todas
          </button>
          <button
            type="button"
            className={activeScope === 'following' ? `${styles.toggleButton} ${styles.toggleButtonActive}` : styles.toggleButton}
            onClick={() => setActiveScope('following')}
            aria-pressed={activeScope === 'following'}
          >
            Siguiendo
          </button>
        </div>
        <p className={styles.scopeDescription}>
          {activeScope === 'all' ? 'Lo último de toda la plataforma' : 'Solo personas que sigues'}
        </p>
      </div>

      {requiresLogin ? (
        <section className={styles.loginGate}>
          <span className={styles.loginMark} aria-hidden="true">ms</span>
          <h2>Tu feed personal te espera</h2>
          <p>Inicia sesión para ver las reviews de las personas que sigues.</p>
          <Link to={ROUTES.LOGIN} className={styles.loginButton}>Iniciar sesión</Link>
        </section>
      ) : null}

      {!requiresLogin && isLoading ? <FeedSkeleton /> : null}

      {!requiresLogin && !isLoading && error && items.length === 0 ? (
        <section className={styles.emptyState}>
          <h2>No pudimos cargar el feed</h2>
          <p>{error}</p>
          <button type="button" className={styles.retryButton} onClick={() => void fetchFeed(activeScope)}>
            Reintentar
          </button>
        </section>
      ) : null}

      {!requiresLogin && !isLoading && !error && items.length === 0 ? (
        <section className={styles.emptyState}>
          <h2>{activeScope === 'following' ? 'Todavía no hay reviews aquí' : 'Aún no hay reviews'}</h2>
          <p>
            {activeScope === 'following'
              ? 'Sigue a más personas o vuelve pronto para descubrir qué están escuchando.'
              : 'Cuando alguien publique la primera, aparecerá en este timeline.'}
          </p>
        </section>
      ) : null}

      {!requiresLogin && !isLoading && items.length > 0 ? (
        <>
          <section className={styles.timeline} aria-label="Feed de reviews recientes">
            {items.map((review) => <ReviewCard key={review.id} review={review} />)}
          </section>

          <div className={styles.pagination}>
            {hasMore ? (
              <button
                type="button"
                className={styles.loadMoreButton}
                onClick={() => void loadMore()}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Cargando…' : 'Cargar más'}
              </button>
            ) : (
              <p className={styles.endMessage}>Estás al día.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

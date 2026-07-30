import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Skeleton } from '@/shared/components/Skeleton';
import { Button, ButtonLink, Card } from '@/shared/components/ui';
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
  return Number(value).toFixed(1);
}

function RatingStars({ rating }: { rating: number }) {
  const filledStars = Math.round(Math.min(5, Math.max(0, Number(rating))));

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

function FeedSkeleton() {
  return (
    <div className={styles.timeline} aria-label="Cargando reseñas">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className={styles.reviewCard} aria-hidden="true">
          <div className={styles.cardHeader}>
            <Skeleton width={44} height={44} borderRadius="999px" />
            <div className={styles.skeletonAuthor}>
              <Skeleton width="190px" height={15} />
              <Skeleton width="135px" height={12} />
            </div>
          </div>
          <div className={styles.skeletonAlbum}>
            <Skeleton width={64} height={64} borderRadius={10} />
            <div className={styles.skeletonAlbumCopy}>
              <Skeleton width="58%" height={17} />
              <Skeleton width="38%" height={13} />
              <Skeleton width="80px" height={13} />
            </div>
          </div>
          <div className={styles.skeletonText}>
            <Skeleton width="96%" height={13} />
            <Skeleton width="72%" height={13} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: FeedReview }) {
  const initial = review.author.username.charAt(0).toUpperCase() || '?';
  const userPath = `${ROUTES.USERS}/${encodeURIComponent(review.author.username)}`;
  const albumPath = `${ROUTES.ALBUMS}/${encodeURIComponent(review.album.id)}`;

  return (
    <Card className={styles.reviewCard} role="article">
      <header className={styles.cardHeader}>
        <Link to={userPath} className={styles.avatarLink} aria-label={`Ver perfil de ${review.author.username}`}>
          {review.author.avatarUrl ? (
            <img src={review.author.avatarUrl} alt="" className={styles.avatar} loading="lazy" />
          ) : (
            <span className={styles.avatarFallback} aria-hidden="true">{initial}</span>
          )}
        </Link>

        <div className={styles.authorCopy}>
          <p className={styles.authorLine}>
            <Link to={userPath} className={styles.authorLink}>{review.author.username}</Link>
            <span>calificó un álbum</span>
          </p>
          <p className={styles.authorMeta}>
            <span>@{review.author.username}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
          </p>
        </div>

        <RatingStars rating={review.rating} />
      </header>

      <Link to={albumPath} className={styles.albumReference} aria-label={`Ver ${review.album.title}`}>
        <img
          src={review.album.coverUrl ?? 'https://placehold.co/128x128?text=No+Cover'}
          alt=""
          className={styles.cover}
          loading="lazy"
        />
        <span className={styles.albumCopy}>
          <strong className={styles.albumTitle}>{review.album.title}</strong>
          <span className={styles.artistName}>{review.album.artist.name}</span>
          <span className={styles.albumRating}>{formatRating(review.rating)} / 5.0</span>
        </span>
      </Link>

      <p className={review.content ? styles.reviewText : `${styles.reviewText} ${styles.reviewTextEmpty}`}>
        {review.content || 'Esta reseña no incluye texto.'}
      </p>

      <ReviewComments reviewId={review.id} initialCount={review.commentCount} />
    </Card>
  );
}

export function ReviewsPage() {
  const [activeScope, setActiveScope] = useState<ReviewFeedScope>('all');
  const userId = useAuthStore((state) => state.user?.id);
  const { items, isLoading, isLoadingMore, hasMore, error, fetchFeed, loadMore } = useReviewsFeedStore();
  const requiresLogin = activeScope === 'following' && !userId;

  useEffect(() => {
    if (activeScope === 'following' && !userId) return;
    void fetchFeed(activeScope);
  }, [activeScope, fetchFeed, userId]);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Feed de reseñas</h1>
        <p className={styles.subtitle}>
          Descubre qué está escuchando y calificando la comunidad de music-social.
        </p>
      </header>

      <div className={styles.filters} role="group" aria-label="Filtrar reseñas">
        <Button
          type="button"
          variant={activeScope === 'all' ? 'primary' : 'secondary'}
          className={styles.filterPill}
          onClick={() => setActiveScope('all')}
          aria-pressed={activeScope === 'all'}
        >
          Todas
        </Button>
        <Button
          type="button"
          variant={activeScope === 'following' ? 'primary' : 'secondary'}
          className={styles.filterPill}
          onClick={() => setActiveScope('following')}
          aria-pressed={activeScope === 'following'}
        >
          Siguiendo
        </Button>
      </div>

      {requiresLogin ? (
        <Card className={styles.statusCard}>
          <h2>Tu feed personal te espera</h2>
          <p>Inicia sesión para ver las reseñas de las personas que sigues.</p>
          <ButtonLink to={ROUTES.LOGIN}>Iniciar sesión</ButtonLink>
        </Card>
      ) : null}

      {!requiresLogin && isLoading ? <FeedSkeleton /> : null}

      {!requiresLogin && !isLoading && error && items.length === 0 ? (
        <Card className={styles.statusCard}>
          <h2>No pudimos cargar el feed</h2>
          <p>{error}</p>
          <Button type="button" variant="secondary" onClick={() => void fetchFeed(activeScope)}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      {!requiresLogin && !isLoading && !error && items.length === 0 ? (
        <Card className={styles.statusCard}>
          <h2>{activeScope === 'following' ? 'Todavía no hay reseñas aquí' : 'Aún no hay reseñas'}</h2>
          <p>
            {activeScope === 'following'
              ? 'Sigue a más personas o vuelve pronto para descubrir qué están escuchando.'
              : 'Cuando alguien publique la primera, aparecerá en este timeline.'}
          </p>
        </Card>
      ) : null}

      {!requiresLogin && !isLoading && items.length > 0 ? (
        <>
          <section className={styles.timeline} aria-label="Feed de reseñas recientes">
            {items.map((review) => <ReviewCard key={review.id} review={review} />)}
          </section>

          <div className={styles.pagination}>
            {hasMore ? (
              <Button
                type="button"
                variant="secondary"
                className={styles.loadMoreButton}
                onClick={() => void loadMore()}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Cargando…' : 'Cargar más'}
              </Button>
            ) : (
              <p className={styles.endMessage}>Estás al día.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

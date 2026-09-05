import { Link } from 'react-router-dom';
import { Badge, Button, Card } from '@/shared/components/ui';
import { ROUTES } from '@/shared/lib/constants';
import { useReviewsStore } from '../stores/reviewsStore';
import { ReviewComments } from './ReviewComments';
import styles from './ReviewList.module.css';

const reviewDateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha desconocida' : reviewDateFormatter.format(date);
}

function RatingStars({ rating }: { rating: number }) {
  const filledStars = Math.round(Math.min(5, Math.max(0, Number(rating))));

  return (
    <span className={styles.stars} aria-label={`${Number(rating).toFixed(1)} de 5 estrellas`}>
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

export function ReviewList() {
  const { reviews, total, isLoading, isLoadingMore, hasMore, loadMore } = useReviewsStore();

  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.heading}>Reviews</h2>
        <span className={styles.counter}>{reviews.length} de {total}</span>
      </header>

      {isLoading && reviews.length === 0 ? (
        <Card className={styles.status}>Cargando reviews…</Card>
      ) : null}

      {!isLoading && reviews.length === 0 ? (
        <Card className={styles.status}>Todavía no hay reviews. Sé la primera persona en publicar una.</Card>
      ) : null}

      <div className={styles.list}>
        {reviews.map((review) => {
          const username = review.users?.username ?? 'Usuario desconocido';
          const avatarUrl = review.users?.avatar_url;
          const userPath = `${ROUTES.USERS}/${encodeURIComponent(username)}`;
          const initial = username.charAt(0).toUpperCase() || '?';

          return (
            <Card key={review.id} className={styles.card}>
              <header className={styles.cardHeader}>
                <div className={styles.author}>
                  <Link to={userPath} className={styles.avatarLink} aria-label={`Ver perfil de ${username}`}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className={styles.avatar} loading="lazy" />
                    ) : (
                      <span className={styles.avatarFallback} aria-hidden="true">{initial}</span>
                    )}
                  </Link>
                  <div className={styles.authorCopy}>
                    <Link to={userPath} className={styles.displayName}>{username}</Link>
                    <div className={styles.authorMeta}>
                      <span>@{username}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={review.created_at}>{formatDate(review.created_at)}</time>
                    </div>
                  </div>
                </div>
                <Badge variant="rating" numeric className={styles.rating}>
                  <RatingStars rating={review.rating} />
                  <span>{Number(review.rating).toFixed(1)}</span>
                </Badge>
              </header>

              <p className={styles.content}>{review.content}</p>

              <ReviewComments
                reviewId={review.id}
                initialCount={Number(review.review_comments?.[0]?.count ?? 0)}
              />
            </Card>
          );
        })}
      </div>

      {isLoadingMore ? <p className={styles.loadingMore}>Cargando más reviews…</p> : null}
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
      ) : null}
    </section>
  );
}

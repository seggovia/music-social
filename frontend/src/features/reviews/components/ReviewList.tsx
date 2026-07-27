import { useReviewsStore } from '../stores/reviewsStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ReviewComments } from './ReviewComments';
import styles from './ReviewList.module.css';

export function ReviewList() {
  const { reviews, total, isLoading, isLoadingMore, hasMore, loadMore, remove } = useReviewsStore();
  const user = useAuthStore((state) => state.user);

  if (isLoading && reviews.length === 0) return <p className={styles.loading}>Loading reviews...</p>;
  if (reviews.length === 0) return <p className={styles.empty}>No reviews yet. Be the first!</p>;

  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>Reviews ({total})</h3>
      {reviews.map((review) => (
        <article key={review.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.username}>{review.users?.username ?? 'Unknown user'}</span>
            <span className={styles.rating}>{review.rating} / 5</span>
          </div>
          <p className={styles.content}>{review.content}</p>
          <small className={styles.date}>
            {new Date(review.created_at).toLocaleDateString()}
          </small>
          {user?.id === review.user_id && (
            <div>
              <button onClick={() => remove(review.id)} className={styles.deleteButton}>
                Delete
              </button>
            </div>
          )}
          <ReviewComments
            reviewId={review.id}
            initialCount={Number(review.review_comments?.[0]?.count ?? 0)}
          />
        </article>
      ))}
      {isLoadingMore ? <p className={styles.loading}>Loading more reviews...</p> : null}
      {hasMore ? (
        <button type="button" className={styles.loadMoreButton} onClick={() => void loadMore()} disabled={isLoadingMore}>
          {isLoadingMore ? 'Loading...' : 'Load more'}
        </button>
      ) : null}
    </section>
  );
}

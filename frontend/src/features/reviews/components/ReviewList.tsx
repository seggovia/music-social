import { useReviewsStore } from '../stores/reviewsStore';
import { useAuthStore } from '@/features/auth/stores/authStore';

export function ReviewList() {
  const { reviews, isLoading, remove } = useReviewsStore();
  const user = useAuthStore((state) => state.user);

  if (isLoading) return <p>Loading reviews...</p>;
  if (reviews.length === 0) return <p>No reviews yet. Be the first!</p>;

  return (
    <section style={{ marginTop: '2rem' }}>
      <h3>Reviews ({reviews.length})</h3>
      {reviews.map((review) => (
        <article
          key={review.id}
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: '1rem',
            marginBottom: '1rem',
            maxWidth: 600,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{review.users?.username ?? 'Unknown user'}</strong>
            <span style={{ fontSize: '1.2rem' }}>⭐ {review.rating} / 5</span>
          </div>
          <p style={{ marginTop: '0.5rem' }}>{review.content}</p>
          <small style={{ color: '#888' }}>
            {new Date(review.created_at).toLocaleDateString()}
          </small>
          {user?.id === review.user_id && (
            <div style={{ marginTop: '0.5rem' }}>
              <button
                onClick={() => remove(review.id)}
                style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
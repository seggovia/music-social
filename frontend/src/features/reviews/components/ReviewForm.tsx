import { useState } from 'react';
import { useReviewsStore } from '../stores/reviewsStore';

interface Props {
  albumId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ albumId, onSuccess }: Props) {
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState('');
  const { create, isLoading, error } = useReviewsStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create({ albumId, rating, content });
      setContent('');
      setRating(5);
      onSuccess?.();
    } catch {
      // error ya está en el store
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
      <h3>Write a review</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="rating">
          Rating (0.5 – 5):&nbsp;
          <input
            id="rating"
            type="number"
            min={0.5}
            max={5}
            step={0.5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            style={{ width: 60 }}
          />
        </label>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <textarea
          placeholder="Write your review..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          style={{ width: '100%', maxWidth: 600 }}
          required
        />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  );
}
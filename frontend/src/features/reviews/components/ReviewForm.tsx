import { useState } from 'react';
import { useReviewsStore } from '../stores/reviewsStore';
import styles from './ReviewForm.module.css';

interface Props {
  albumId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ albumId, onSuccess }: Props) {
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState('');
  const { create, isLoading } = useReviewsStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create({ albumId, rating, content });
      setContent('');
      setRating(5);
      onSuccess?.();
    } catch {
      // The global toast shows the error.
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h3 className={styles.heading}>Write a review</h3>
      <div className={styles.field}>
        <label htmlFor="rating" className={styles.label}>
          Rating (0.5 - 5):
          <input
            id="rating"
            type="number"
            min={0.5}
            max={5}
            step={0.5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className={styles.ratingInput}
          />
        </label>
      </div>
      <div className={styles.field}>
        <textarea
          placeholder="Write your review..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className={styles.textarea}
          required
        />
      </div>
      <button type="submit" disabled={isLoading} className={styles.submitButton}>
        {isLoading ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  );
}

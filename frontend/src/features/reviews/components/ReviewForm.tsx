import { useState } from 'react';
import { Button, Card, Input } from '@/shared/components/ui';
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
    <Card className={styles.card}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h3 className={styles.heading}>Escribe una review</h3>
        <label htmlFor="rating" className={styles.label}>
          Calificación
          <Input
            id="rating"
            type="number"
            min={0.5}
            max={5}
            step={0.5}
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
            className={styles.ratingInput}
          />
        </label>
        <label htmlFor="review-content" className={styles.visuallyHidden}>Review</label>
        <textarea
          id="review-content"
          placeholder="Comparte qué te pareció este álbum…"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={5}
          className={styles.textarea}
          required
        />
        <Button type="submit" disabled={isLoading} className={styles.submitButton}>
          {isLoading ? 'Publicando…' : 'Publicar review'}
        </Button>
      </form>
    </Card>
  );
}

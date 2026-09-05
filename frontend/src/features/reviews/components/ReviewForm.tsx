import { useEffect, useState } from 'react';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Button, Card, Input } from '@/shared/components/ui';
import { useReviewsStore } from '../stores/reviewsStore';
import type { Review } from '../types';
import styles from './ReviewForm.module.css';

interface Props {
  albumId: string;
  existingReview?: Review | null;
}

const DEFAULT_RATING = 5;

export function ReviewForm({ albumId, existingReview: reviewFromAlbum }: Props) {
  const [rating, setRating] = useState<number>(DEFAULT_RATING);
  const [content, setContent] = useState('');
  const [existingReview, setExistingReview] = useState<Review | null>(reviewFromAlbum ?? null);
  const [isResolvingReview, setIsResolvingReview] = useState(!reviewFromAlbum);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { create, update, remove, getMineByAlbum, isLoading } = useReviewsStore();

  useEffect(() => {
    let isCurrent = true;

    if (reviewFromAlbum) {
      setExistingReview(reviewFromAlbum);
      setRating(Number(reviewFromAlbum.rating));
      setContent(reviewFromAlbum.content);
      setIsResolvingReview(false);
      return () => {
        isCurrent = false;
      };
    }

    setExistingReview(null);
    setRating(DEFAULT_RATING);
    setContent('');
    setIsResolvingReview(true);

    void getMineByAlbum(albumId)
      .then((review) => {
        if (!isCurrent || !review) return;
        setExistingReview(review);
        setRating(Number(review.rating));
        setContent(review.content);
      })
      .catch(() => {
        // The global toast shows the error.
      })
      .finally(() => {
        if (isCurrent) setIsResolvingReview(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [albumId, getMineByAlbum, reviewFromAlbum?.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      if (existingReview) {
        const updatedReview = await update(existingReview.id, { rating, content });
        setExistingReview(updatedReview);
      } else {
        const createdReview = await create({ albumId, rating, content });
        setExistingReview(createdReview);
      }
    } catch {
      // The global toast shows the error.
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;

    setIsDeleting(true);
    try {
      await remove(existingReview.id, albumId);
      setExistingReview(null);
      setRating(DEFAULT_RATING);
      setContent('');
      setIsDeleteDialogOpen(false);
    } catch {
      // The global toast shows the error.
    } finally {
      setIsDeleting(false);
    }
  };

  const isBusy = isLoading || isResolvingReview || isDeleting;
  const submitLabel = isResolvingReview
    ? 'Cargando reseña…'
    : isLoading
      ? existingReview ? 'Actualizando reseña…' : 'Publicando reseña…'
      : existingReview ? 'Actualizar reseña' : 'Publicar reseña';

  return (
    <>
      <Card className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h3 className={styles.heading}>{existingReview ? 'Edita tu reseña' : 'Escribe una reseña'}</h3>
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
              disabled={isBusy}
            />
          </label>
          <label htmlFor="review-content" className={styles.visuallyHidden}>Reseña</label>
          <textarea
            id="review-content"
            placeholder="Comparte qué te pareció este álbum…"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={5}
            className={styles.textarea}
            required
            disabled={isBusy}
          />
          <div className={styles.actions}>
            <Button type="submit" disabled={isBusy} className={styles.submitButton}>
              {submitLabel}
            </Button>
            {existingReview ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isBusy}
                className={styles.deleteButton}
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Borrar reseña
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="¿Borrar esta reseña?"
        description="Esta acción no se puede deshacer. Tu calificación y el texto de la reseña se eliminarán."
        confirmLabel="Borrar reseña"
        tone="destructive"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </>
  );
}

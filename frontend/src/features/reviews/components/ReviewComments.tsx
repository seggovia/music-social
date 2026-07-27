import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ROUTES } from '@/shared/lib/constants';
import {
  EMPTY_BUCKET,
  useReviewCommentsStore,
} from '../stores/reviewCommentsStore';
import styles from './ReviewComments.module.css';

interface ReviewCommentsProps {
  reviewId: string;
  initialCount?: number;
}

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function commentLabel(count: number) {
  return `${count} ${count === 1 ? 'comentario' : 'comentarios'}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha desconocida' : dateFormatter.format(date);
}

export function ReviewComments({ reviewId, initialCount = 0 }: ReviewCommentsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const bucket = useReviewCommentsStore((state) => state.byReview[reviewId] ?? EMPTY_BUCKET);
  const fetchComments = useReviewCommentsStore((state) => state.fetchComments);
  const loadMore = useReviewCommentsStore((state) => state.loadMore);
  const createComment = useReviewCommentsStore((state) => state.createComment);
  const deleteComment = useReviewCommentsStore((state) => state.deleteComment);
  const visibleCount = bucket.loaded ? bucket.total : initialCount;

  function toggleComments() {
    const willExpand = !isExpanded;
    setIsExpanded(willExpand);
    if (willExpand && !bucket.loaded && !bucket.isLoading) {
      void fetchComments(reviewId);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim() || bucket.isSubmitting) return;

    try {
      await createComment(reviewId, content);
      setContent('');
    } catch {
      // El toast global y el mensaje inline muestran el error.
    }
  }

  async function handleDelete(commentId: string) {
    await deleteComment(reviewId, commentId);
    setConfirmingDeleteId(null);
  }

  return (
    <section className={styles.comments}>
      <button
        type="button"
        className={styles.toggle}
        onClick={toggleComments}
        aria-expanded={isExpanded}
        aria-controls={`review-comments-${reviewId}`}
      >
        <span className={styles.toggleLabel}>
          <span className={styles.commentIcon} aria-hidden="true" />
          {commentLabel(visibleCount)}
        </span>
        <span className={isExpanded ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron} aria-hidden="true" />
      </button>

      {isExpanded ? (
        <div id={`review-comments-${reviewId}`} className={styles.panel}>
          {bucket.isLoading ? <p className={styles.status}>Cargando comentarios…</p> : null}

          {!bucket.isLoading && bucket.error && !bucket.loaded ? (
            <div className={styles.errorState}>
              <p>{bucket.error}</p>
              <button type="button" className={styles.retryButton} onClick={() => void fetchComments(reviewId)}>
                Reintentar
              </button>
            </div>
          ) : null}

          {!bucket.isLoading && bucket.loaded && bucket.items.length === 0 ? (
            <p className={styles.empty}>Todavía no hay comentarios. Sé la primera persona en responder.</p>
          ) : null}

          {bucket.items.length > 0 ? (
            <div className={styles.list}>
              {bucket.items.map((comment) => {
                const isOwner = user?.id === comment.userId;
                const isDeleting = bucket.deletingIds.includes(comment.id);
                const userPath = `${ROUTES.USERS}/${encodeURIComponent(comment.author.username)}`;
                const initial = comment.author.username.charAt(0).toUpperCase() || '?';

                return (
                  <article key={comment.id} className={styles.comment}>
                    <Link to={userPath} className={styles.avatarLink} aria-label={`Ver perfil de ${comment.author.username}`}>
                      {comment.author.avatarUrl ? (
                        <img src={comment.author.avatarUrl} alt="" className={styles.avatar} loading="lazy" />
                      ) : (
                        <span className={styles.avatarFallback} aria-hidden="true">{initial}</span>
                      )}
                    </Link>

                    <div className={styles.commentBody}>
                      <header className={styles.commentHeader}>
                        <Link to={userPath} className={styles.username}>{comment.author.username}</Link>
                        <time className={styles.date} dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
                      </header>
                      <p className={styles.content}>{comment.content}</p>

                      {isOwner ? (
                        confirmingDeleteId === comment.id ? (
                          <div className={styles.confirmDelete} role="group" aria-label="Confirmar borrado">
                            <span>¿Borrar comentario?</span>
                            <button
                              type="button"
                              className={styles.cancelButton}
                              onClick={() => setConfirmingDeleteId(null)}
                              disabled={isDeleting}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className={styles.confirmButton}
                              onClick={() => void handleDelete(comment.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? 'Borrando…' : 'Sí, borrar'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => setConfirmingDeleteId(comment.id)}
                          >
                            Borrar
                          </button>
                        )
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          {bucket.hasMore ? (
            <button
              type="button"
              className={styles.loadMoreButton}
              onClick={() => void loadMore(reviewId)}
              disabled={bucket.isLoadingMore}
            >
              {bucket.isLoadingMore ? 'Cargando…' : 'Ver más comentarios'}
            </button>
          ) : null}

          {user ? (
            <form className={styles.form} onSubmit={handleSubmit}>
              <label htmlFor={`review-comment-${reviewId}`} className={styles.formLabel}>
                Comentar como <strong>{user.username}</strong>
              </label>
              <textarea
                id={`review-comment-${reviewId}`}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className={styles.textarea}
                rows={3}
                maxLength={2000}
                placeholder="Escribe una respuesta…"
                disabled={bucket.isSubmitting || bucket.isLoading}
                required
              />
              <div className={styles.formFooter}>
                <span className={styles.characterCount}>{content.length}/2000</span>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={bucket.isSubmitting || bucket.isLoading || !content.trim()}
                >
                  {bucket.isSubmitting ? 'Publicando…' : 'Publicar comentario'}
                </button>
              </div>
            </form>
          ) : (
            <p className={styles.loginPrompt}>
              <Link to={ROUTES.LOGIN}>Inicia sesión</Link> para comentar esta review.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

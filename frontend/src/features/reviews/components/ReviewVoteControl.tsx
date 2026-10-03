import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Button } from '@/shared/components/ui';
import { ROUTES } from '@/shared/lib/constants';
import {
  EMPTY_VOTES_BUCKET,
  useReviewVotesStore,
} from '../stores/reviewVotesStore';
import type { ReviewVoteValue } from '../types';
import styles from './ReviewVoteControl.module.css';

interface ReviewVoteControlProps {
  reviewId: string;
}

function VoteIcon({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      {direction === 'up'
        ? <path d="M3.5 9.5 8 5l4.5 4.5" />
        : <path d="M3.5 6.5 8 11l4.5-4.5" />}
    </svg>
  );
}

export function ReviewVoteControl({ reviewId }: ReviewVoteControlProps) {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const bucket = useReviewVotesStore((state) => state.byReview[reviewId] ?? EMPTY_VOTES_BUCKET);
  const fetchSummary = useReviewVotesStore((state) => state.fetchSummary);
  const vote = useReviewVotesStore((state) => state.vote);

  useEffect(() => {
    void fetchSummary(reviewId, userId);
  }, [fetchSummary, reviewId, userId]);

  useEffect(() => {
    if (userId) setShowLoginPrompt(false);
  }, [userId]);

  function handleVote(value: ReviewVoteValue) {
    if (!userId) {
      setShowLoginPrompt(true);
      return;
    }

    void vote(reviewId, value, userId).catch(() => {
      // El store revierte el cambio y el toast global explica el error.
    });
  }

  const netLabel = bucket.net > 0 ? `+${bucket.net}` : String(bucket.net);

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.control}
        role="group"
        aria-label={`Votos de la reseña: ${bucket.positive} positivos, ${bucket.negative} negativos`}
        aria-busy={bucket.isLoading || bucket.isVoting}
      >
        <Button
          type="button"
          variant="secondary"
          className={`${styles.voteButton} ${bucket.currentVote === 1 ? styles.active : ''}`}
          onClick={() => handleVote(1)}
          disabled={bucket.isVoting}
          aria-label="Votar positivo"
          aria-pressed={bucket.currentVote === 1}
          title={`${bucket.positive} votos positivos`}
        >
          <VoteIcon direction="up" />
        </Button>

        <output className={styles.net} aria-label={`${bucket.net} votos netos`}>
          {netLabel}
        </output>

        <Button
          type="button"
          variant="secondary"
          className={`${styles.voteButton} ${bucket.currentVote === -1 ? styles.active : ''}`}
          onClick={() => handleVote(-1)}
          disabled={bucket.isVoting}
          aria-label="Votar negativo"
          aria-pressed={bucket.currentVote === -1}
          title={`${bucket.negative} votos negativos`}
        >
          <VoteIcon direction="down" />
        </Button>
      </div>

      {showLoginPrompt ? (
        <p className={styles.loginPrompt} role="status">
          <Link to={ROUTES.LOGIN}>Inicia sesión</Link> para votar esta reseña.
        </p>
      ) : null}
    </div>
  );
}

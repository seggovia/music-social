import { useEffect, useState } from 'react';
import { useFollowsStore } from '../stores/followsStore';
import styles from './FollowButton.module.css';

interface Props {
  userId: string;
}

export function FollowButton({ userId }: Props) {
  const { stats, fetchStats, follow, unfollow } = useFollowsStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void fetchStats(userId);
  }, [fetchStats, userId]);

  async function handleClick() {
    setIsLoading(true);
    try {
      if (stats?.isFollowing) {
        await unfollow(userId);
      } else {
        await follow(userId);
      }
    } catch {
      // El error queda en el store
    } finally {
      setIsLoading(false);
    }
  }

  if (!stats) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={stats.isFollowing ? `${styles.button} ${styles.buttonFollowing}` : styles.button}
    >
      {isLoading ? '…' : stats.isFollowing ? 'Siguiendo' : 'Seguir'}
    </button>
  );
}

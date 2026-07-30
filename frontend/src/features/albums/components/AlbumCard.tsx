import { Link } from 'react-router-dom';
import { Badge, Card } from '@/shared/components/ui';
import { ROUTES } from '@/shared/lib/constants';
import styles from './AlbumCard.module.css';

export interface AlbumCardData {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string | null;
  year?: number | null;
  avgRating: number;
  reviewCount: number;
}

interface AlbumCardProps {
  album: AlbumCardData;
  categoryLabel?: string;
}

function formatReviewCount(count: number) {
  return `${count} ${count === 1 ? 'calificación' : 'calificaciones'}`;
}

export function AlbumCard({ album, categoryLabel = 'Top All Time' }: AlbumCardProps) {
  return (
    <Link to={`${ROUTES.ALBUMS}/${album.id}`} className={styles.cardLink}>
      <Card padding="none" className={styles.card}>
        <div className={styles.coverWrap}>
          <img
            src={album.coverUrl ?? 'https://placehold.co/400x400?text=No+Cover'}
            alt={album.title}
            className={styles.cover}
            loading="lazy"
          />
          {album.year ? (
            <Badge variant="neutral" numeric className={styles.yearBadge}>
              {album.year}
            </Badge>
          ) : null}
        </div>
        <div className={styles.info}>
          <p className={styles.category}>{categoryLabel}</p>
          <h3 className={styles.title}>{album.title}</h3>
          <p className={styles.artist}>{album.artist}</p>
          <Badge variant="rating" numeric className={styles.ratingBadge}>
            <span aria-hidden="true">★</span>
            <span>{album.avgRating.toFixed(1)}</span>
            <span className={styles.ratingDivider} aria-hidden="true">·</span>
            <span>{formatReviewCount(album.reviewCount)}</span>
          </Badge>
        </div>
      </Card>
    </Link>
  );
}

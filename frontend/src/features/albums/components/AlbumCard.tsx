import { Link } from 'react-router-dom';
import type { Album } from '../types';
import { ROUTES } from '@/shared/lib/constants';
import styles from './AlbumCard.module.css';

interface AlbumCardProps {
  album: Album;
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link to={`${ROUTES.ALBUMS}/${album.mbid}`} className={styles.card}>
      <div className={styles.coverWrap}>
        <img
          src={album.coverUrl ?? 'https://placehold.co/300x300?text=No+Cover'}
          alt={album.title}
          className={styles.cover}
          loading="lazy"
        />
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{album.title}</h3>
        <p className={styles.artist}>{album.artist}</p>
        <p className={styles.year}>{album.year ?? 'Year unknown'}</p>
      </div>
    </Link>
  );
}
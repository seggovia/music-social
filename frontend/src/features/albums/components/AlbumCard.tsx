import { Link } from 'react-router-dom';
import type { Album } from '../types';
import { ROUTES } from '@/shared/lib/constants';

interface AlbumCardProps {
  album: Album;
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <article style={{ border: '1px solid #ddd', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      <img
        src={album.coverUrl ?? 'https://placehold.co/300x300?text=No+Cover'}
        alt={album.title}
        style={{ width: '100%', height: 220, objectFit: 'cover' }}
      />
      <div style={{ padding: '0.75rem' }}>
        <h3 style={{ margin: '0 0 0.25rem' }}>{album.title}</h3>
        <p style={{ margin: '0 0 0.25rem', color: '#555' }}>{album.artist}</p>
        <p style={{ margin: '0 0 0.75rem', color: '#666' }}>{album.year ?? 'Year unknown'}</p>
        <Link to={`${ROUTES.ALBUMS}/${album.mbid}`}>View details</Link>
      </div>
    </article>
  );
}

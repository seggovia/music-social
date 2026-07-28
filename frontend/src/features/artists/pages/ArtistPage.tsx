import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ROUTES } from '@/shared/lib/constants';
import { useArtistsStore } from '../stores/artistsStore';
import type { ArtistAlbum } from '../types';
import styles from './ArtistPage.module.css';

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';
}

function AlbumCard({ album }: { album: ArtistAlbum }) {
  return (
    <Link to={`${ROUTES.ALBUMS}/${album.id}`} className={styles.albumCard}>
      <img
        src={album.coverUrl ?? 'https://placehold.co/320x320?text=No+Cover'}
        alt={album.title}
        className={styles.albumCover}
        loading="lazy"
      />
      <div className={styles.albumCopy}>
        <h3 className={styles.albumTitle}>{album.title}</h3>
        <p className={styles.albumYear}>{album.year ?? 'Unknown year'}</p>
      </div>
    </Link>
  );
}

export function ArtistPage() {
  const { mbid } = useParams();
  const { currentArtist, isLoading, fetchArtist } = useArtistsStore();

  useEffect(() => {
    if (!mbid) return;
    void fetchArtist(mbid);
  }, [fetchArtist, mbid]);

  if (!mbid) return <p className={styles.status}>Artist not found.</p>;
  if (isLoading) return <p className={styles.status}>Loading artist...</p>;
  if (!currentArtist) return <p className={styles.status}>No artist details available.</p>;

  return (
    <article className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.portraitFrame}>
          {currentArtist.imageUrl ? (
            <img src={currentArtist.imageUrl} alt={currentArtist.name} className={styles.portrait} />
          ) : (
            <div className={styles.portraitFallback} aria-hidden="true">
              {initialsFor(currentArtist.name)}
            </div>
          )}
        </div>

        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Artist profile</p>
          <h1 className={styles.title}>{currentArtist.name}</h1>

          <div className={styles.metadata} aria-label="Artist details">
            {currentArtist.country ? <span>{currentArtist.country}</span> : null}
            {currentArtist.formedYear ? <span>Active since {currentArtist.formedYear}</span> : null}
            <span>{currentArtist.albums.length} cached albums</span>
          </div>

          {currentArtist.bio ? (
            <p className={styles.bio}>{currentArtist.bio}</p>
          ) : (
            <p className={`${styles.bio} ${styles.bioMuted}`}>
              Artist information will appear here as the catalog grows.
            </p>
          )}
        </div>
      </section>

      <section className={styles.discography}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Cached releases</p>
            <h2 className={styles.sectionTitle}>Discography</h2>
          </div>
          <span className={styles.albumCount}>
            {currentArtist.albums.length} {currentArtist.albums.length === 1 ? 'album' : 'albums'}
          </span>
        </header>

        {currentArtist.albums.length === 0 ? (
          <div className={styles.empty}>
            <h3>No cached albums yet</h3>
            <p>Search for an album by this artist to start populating their discography.</p>
            <Link to={ROUTES.ALBUMS} className={styles.exploreLink}>Explore albums</Link>
          </div>
        ) : (
          <div className={styles.albumGrid}>
            {currentArtist.albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </section>
    </article>
  );
}

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SkeletonAlbumCard } from '@/shared/components/Skeleton';
import { useChartsStore } from '../stores/chartsStore';
import type { ChartTab } from '../types';
import styles from './ChartsPage.module.css';

const TABS: { key: ChartTab; label: string }[] = [
  { key: 'most-reviewed', label: 'Most Reviewed' },
  { key: 'top-all-time', label: 'Top All Time' },
  { key: 'top-by-year', label: 'Top by Year' },
  { key: 'top-by-genre', label: 'Top by Genre' },
];

export function ChartsPage() {
  const {
    activeTab, albums, genres, selectedYear, selectedGenreSlug,
    isLoading, error, fetchTab, fetchGenres, setYear, setGenre,
  } = useChartsStore();

  useEffect(() => {
    void fetchTab('most-reviewed');
    void fetchGenres();
  }, [fetchTab, fetchGenres]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Charts</h1>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={t.key === activeTab ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => fetchTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'top-by-year' && (
        <div className={styles.subFilters}>
          <label htmlFor="yearInput">Year:</label>
          <input
            id="yearInput"
            type="number"
            value={selectedYear}
            onChange={(e) => setYear(Number(e.target.value))}
            className={styles.yearInput}
          />
        </div>
      )}

      {activeTab === 'top-by-genre' && (
        <div className={styles.subFilters}>
          <label htmlFor="genreSelect">Genre:</label>
          <select
            id="genreSelect"
            value={selectedGenreSlug ?? ''}
            onChange={(e) => setGenre(e.target.value)}
            className={styles.select}
          >
            {genres.map((g) => (
              <option key={g.slug} value={g.slug}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      {isLoading && (
        <div className={styles.list}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonAlbumCard key={i} />
          ))}
        </div>
      )}
      {error && <p className={styles.empty} role="alert">{error}</p>}

      {!isLoading && !error && albums.length === 0 && (
        <p className={styles.empty}>No albums found for this chart yet.</p>
      )}

      {!isLoading && !error && albums.length > 0 && (
        <div className={styles.list}>
          {albums.map((album, index) => (
            <Link key={album.id} to={`/albums/${album.id}`} className={styles.row}>
              <span className={styles.rank}>#{index + 1}</span>
              <img
                src={album.coverUrl ?? 'https://placehold.co/56x56?text=No+Cover'}
                alt={album.title}
                className={styles.cover}
              />
              <div className={styles.info}>
                <p className={styles.albumTitle}>{album.title}</p>
                <p className={styles.artistName}>{album.artist} {album.year ? `· ${album.year}` : ''}</p>
              </div>
              <div className={styles.stats}>
                <p className={styles.rating}>⭐ {album.avgRating}</p>
                <p className={styles.reviewCount}>{album.reviewCount} review{album.reviewCount !== 1 ? 's' : ''}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SkeletonAlbumCard } from '@/shared/components/Skeleton';
import { useChartsStore } from '../stores/chartsStore';
import type { ChartTab } from '../types';
import styles from './ChartsPage.module.css';

const TABS: { key: ChartTab; label: string; description: string }[] = [
  { key: 'most-reviewed', label: 'Most Reviewed', description: 'Albums driving the most discussion.' },
  { key: 'top-all-time', label: 'Top All Time', description: 'Highest rated records across the community.' },
  { key: 'top-by-year', label: 'Top by Year', description: 'Standout releases from a specific year.' },
  { key: 'top-by-genre', label: 'Top by Genre', description: 'Top rated albums inside a genre.' },
];

export function ChartsPage() {
  const {
    activeTab, albums, genres, selectedYear, selectedGenreSlug,
    isLoading, isLoadingMore, hasMore, error, fetchTab, loadMore, fetchGenres, setYear, setGenre,
  } = useChartsStore();
  const activeTabConfig = TABS.find((tab) => tab.key === activeTab) ?? TABS[0];

  useEffect(() => {
    void fetchTab('most-reviewed');
    void fetchGenres();
  }, [fetchTab, fetchGenres]);

  return (
    <div className={styles.page}>
      <header className={styles.headerPanel}>
        <p className={styles.eyebrow}>Community rankings</p>
        <h1 className={styles.title}>Charts</h1>
        <p className={styles.subtitle}>{activeTabConfig.description}</p>
      </header>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={tab.key === activeTab ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => fetchTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'top-by-year' && (
        <div className={styles.subFilters}>
          <label htmlFor="yearInput" className={styles.filterLabel}>Year</label>
          <input
            id="yearInput"
            type="number"
            value={selectedYear}
            onChange={(event) => setYear(Number(event.target.value))}
            className={styles.yearInput}
          />
        </div>
      )}

      {activeTab === 'top-by-genre' && (
        <div className={styles.subFilters}>
          <label htmlFor="genreSelect" className={styles.filterLabel}>Genre</label>
          <select
            id="genreSelect"
            value={selectedGenreSlug ?? ''}
            onChange={(event) => setGenre(event.target.value)}
            className={styles.select}
          >
            {genres.map((genre) => (
              <option key={genre.slug} value={genre.slug}>{genre.name}</option>
            ))}
          </select>
        </div>
      )}

      {isLoading && (
        <div className={styles.list}>
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonAlbumCard key={index} />
          ))}
        </div>
      )}

      {!isLoading && !error && albums.length === 0 && (
        <div className={styles.empty}>No albums found for this chart yet.</div>
      )}

      {!isLoading && !error && albums.length > 0 && (
        <>
          <div className={styles.resultsHeader}>
            <div>
              <p className={styles.resultsEyebrow}>Now showing</p>
              <h2 className={styles.resultsTitle}>{activeTabConfig.label}</h2>
            </div>
            <p className={styles.resultsCount}>{albums.length}{hasMore ? '+' : ''} ranked albums</p>
          </div>

          <div className={styles.list}>
            {albums.map((album, index) => {
              const rowClassName = [
                styles.row,
                index < 3 ? styles.topRow : '',
                index === 0 ? styles.firstRow : '',
              ].filter(Boolean).join(' ');

              return (
                <Link key={album.id} to={`/albums/${album.id}`} className={rowClassName}>
                  <span className={styles.rank}>{index + 1}</span>
                  <img
                    src={album.coverUrl ?? 'https://placehold.co/56x56?text=No+Cover'}
                    alt={album.title}
                    className={styles.cover}
                  />
                  <div className={styles.info}>
                    <p className={styles.albumTitle}>{album.title}</p>
                    <p className={styles.artistName}>{album.artist}{album.year ? ` - ${album.year}` : ''}</p>
                  </div>
                  <div className={styles.stats}>
                    <p className={styles.rating}>{album.avgRating}</p>
                    <p className={styles.reviewCount}>{album.reviewCount} review{album.reviewCount !== 1 ? 's' : ''}</p>
                  </div>
                </Link>
              );
            })}
            {isLoadingMore && Array.from({ length: 4 }).map((_, index) => (
              <SkeletonAlbumCard key={`more-${index}`} />
            ))}
          </div>
        </>
      )}

      {!isLoading && !error && hasMore && (
        <div className={styles.loadMoreRow}>
          <button type="button" className={styles.loadMoreButton} onClick={() => void loadMore()} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}

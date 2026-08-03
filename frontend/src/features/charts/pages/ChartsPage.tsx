import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Input } from '@/shared/components/ui';
import { Skeleton } from '@/shared/components/Skeleton';
import { ROUTES } from '@/shared/lib/constants';
import { useChartsStore } from '../stores/chartsStore';
import type { ChartAlbum, ChartTab } from '../types';
import styles from './ChartsPage.module.css';

const TABS: { key: ChartTab; label: string; description: string }[] = [
  { key: 'most-reviewed', label: 'Most Reviewed', description: 'Los álbumes que más conversación generan en la comunidad.' },
  { key: 'top-all-time', label: 'Top All Time', description: 'Los discos mejor calificados de todos los tiempos.' },
  { key: 'top-by-year', label: 'Top by Year', description: 'Los lanzamientos más destacados del año seleccionado.' },
  { key: 'top-by-genre', label: 'Top by Genre', description: 'Los favoritos de la comunidad dentro de cada género.' },
];

function formatRating(rating: number) {
  return Number.isFinite(rating) ? rating.toFixed(1) : '0.0';
}

function reviewLabel(count: number) {
  return `${count} ${count === 1 ? 'reseña' : 'reseñas'}`;
}

function RatingStars({ rating }: { rating: number }) {
  const filledStars = Math.round(Math.min(5, Math.max(0, rating)));

  return (
    <span className={styles.stars} aria-label={`${formatRating(rating)} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={index < filledStars ? styles.starFilled : styles.starEmpty}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}

function PodiumCard({ album, rank }: { album: ChartAlbum; rank: number }) {
  const isFirst = rank === 1;

  return (
    <Link
      to={`${ROUTES.ALBUMS}/${album.id}`}
      className={`${styles.topLink} ${isFirst ? styles.firstTopLink : ''}`}
      aria-label={`Posición ${rank}: ${album.title}, de ${album.artist}`}
    >
      <Card
        padding="none"
        className={`${styles.topCard} ${isFirst ? styles.firstTopCard : ''}`}
      >
        <div className={styles.topCoverWrap}>
          <img
            src={album.coverUrl ?? 'https://placehold.co/640x640?text=No+Cover'}
            alt={`Portada de ${album.title}`}
            className={styles.topCover}
          />
          <span className={styles.topRank} aria-hidden="true">#{rank}</span>
          {album.year ? (
            <Badge variant="neutral" numeric className={styles.yearBadge}>{album.year}</Badge>
          ) : null}
        </div>

        <div className={styles.topBody}>
          <div>
            <p className={styles.topKicker}>{isFirst ? 'Community favorite' : `Top ${rank}`}</p>
            <h3 className={styles.topTitle}>{album.title}</h3>
            <p className={styles.topArtist}>{album.artist}</p>
          </div>

          <div className={styles.topFooter}>
            <div className={styles.topRating}>
              <RatingStars rating={album.avgRating} />
              <span className={styles.ratingNumber}>{formatRating(album.avgRating)}</span>
            </div>
            <Badge variant="neutral" numeric>{reviewLabel(album.reviewCount)}</Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function CompactRankingRow({ album, rank }: { album: ChartAlbum; rank: number }) {
  return (
    <Link
      to={`${ROUTES.ALBUMS}/${album.id}`}
      className={styles.compactRow}
      aria-label={`Posición ${rank}: ${album.title}, de ${album.artist}`}
    >
      <span className={styles.compactRank}>#{rank}</span>
      <img
        src={album.coverUrl ?? 'https://placehold.co/128x128?text=No+Cover'}
        alt=""
        className={styles.compactCover}
        loading="lazy"
      />
      <div className={styles.compactInfo}>
        <h3 className={styles.compactTitle}>{album.title}</h3>
        <p className={styles.compactArtist}>
          {album.artist}{album.year ? <span> · {album.year}</span> : null}
        </p>
      </div>
      <div className={styles.compactStats}>
        <div className={styles.compactScore}>
          <RatingStars rating={album.avgRating} />
          <span>{formatRating(album.avgRating)}</span>
        </div>
        <span className={styles.compactReviews}>{reviewLabel(album.reviewCount)}</span>
      </div>
    </Link>
  );
}

function RankingSkeleton() {
  return (
    <div className={styles.loadingState} aria-label="Cargando ranking">
      <div className={styles.loadingPodium}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} padding="none" className={styles.loadingTopCard} aria-hidden="true">
            <Skeleton height="auto" borderRadius="0" style={{ aspectRatio: '1' }} />
            <div className={styles.loadingTopCopy}>
              <Skeleton width="32%" height="0.7rem" />
              <Skeleton height="1.25rem" />
              <Skeleton width="68%" height="0.85rem" />
            </div>
          </Card>
        ))}
      </div>
      <div className={styles.loadingRows}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className={styles.loadingRow} aria-hidden="true">
            <Skeleton width="2rem" height="1rem" />
            <Skeleton width="3.5rem" height="3.5rem" borderRadius="var(--radius-md)" />
            <div className={styles.loadingRowCopy}>
              <Skeleton height="1rem" />
              <Skeleton width="56%" height="0.75rem" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ChartsPage() {
  const {
    activeTab,
    albums,
    genres,
    selectedYear,
    selectedGenreSlug,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    error,
    fetchTab,
    loadMore,
    fetchGenres,
    setYear,
    setGenre,
  } = useChartsStore();
  const activeTabConfig = TABS.find((tab) => tab.key === activeTab) ?? TABS[0];
  const podiumAlbums = albums.slice(0, 3);
  const remainingAlbums = albums.slice(3);

  useEffect(() => {
    void fetchTab('most-reviewed');
    void fetchGenres();
  }, [fetchTab, fetchGenres]);

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Community Rankings</p>
        <h1 className={styles.title}>Charts</h1>
        <p className={styles.subtitle}>
          Descubre los álbumes que la comunidad escucha, reseña y recomienda una y otra vez.
        </p>
      </header>

      <section className={styles.controls} aria-label="Filtros del ranking">
        <div className={styles.tabs} role="group" aria-label="Tipo de ranking">
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <Button
                key={tab.key}
                variant={isActive ? 'primary' : 'secondary'}
                className={styles.tab}
                aria-pressed={isActive}
                onClick={() => void fetchTab(tab.key)}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        {activeTab === 'top-by-year' ? (
          <div className={styles.filterControl}>
            <label htmlFor="yearInput" className={styles.filterLabel}>Año</label>
            <Input
              id="yearInput"
              type="number"
              value={selectedYear}
              onChange={(event) => setYear(Number(event.target.value))}
              className={styles.yearInput}
              inputMode="numeric"
            />
          </div>
        ) : null}

        {activeTab === 'top-by-genre' ? (
          <div className={styles.filterControl}>
            <label htmlFor="genreSelect" className={styles.filterLabel}>Género</label>
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
        ) : null}
      </section>

      {isLoading ? <RankingSkeleton /> : null}

      {!isLoading && error ? (
        <Card className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>No pudimos cargar este ranking</h2>
          <p className={styles.emptyText}>{error}</p>
        </Card>
      ) : null}

      {!isLoading && !error && albums.length === 0 ? (
        <Card className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Todavía no hay álbumes en este ranking</h2>
          <p className={styles.emptyText}>
            Prueba con otro año, género o tipo de chart para descubrir más resultados.
          </p>
        </Card>
      ) : null}

      {!isLoading && !error && albums.length > 0 ? (
        <section className={styles.ranking} aria-labelledby="ranking-title">
          <header className={styles.resultsHeader}>
            <div>
              <p className={styles.resultsEyebrow}>Now showing</p>
              <h2 id="ranking-title" className={styles.resultsTitle}>{activeTabConfig.label}</h2>
              <p className={styles.resultsDescription}>{activeTabConfig.description}</p>
            </div>
            <p className={styles.resultsCount}>
              {total || albums.length} álbum{(total || albums.length) === 1 ? '' : 'es'}
            </p>
          </header>

          <div className={styles.podium}>
            {podiumAlbums.map((album, index) => (
              <PodiumCard key={album.id} album={album} rank={index + 1} />
            ))}
          </div>

          {remainingAlbums.length > 0 ? (
            <div className={styles.compactList}>
              {remainingAlbums.map((album, index) => (
                <CompactRankingRow key={album.id} album={album} rank={index + 4} />
              ))}
            </div>
          ) : null}

          {isLoadingMore ? (
            <div className={styles.loadingMore} aria-label="Cargando más resultados">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} height="5rem" borderRadius="var(--radius-lg)" />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {!isLoading && !error && hasMore ? (
        <div className={styles.loadMoreRow}>
          <Button variant="secondary" onClick={() => void loadMore()} disabled={isLoadingMore}>
            {isLoadingMore ? 'Cargando…' : 'Cargar más'}
          </Button>
        </div>
      ) : null}
    </main>
  );
}

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { Badge, ButtonLink, Card } from '@/shared/components/ui';
import { Skeleton } from '@/shared/components/Skeleton';
import { ROUTES } from '@/shared/lib/constants';
import { AlbumCard } from '../components/AlbumCard';
import styles from './SearchPage.module.css';

function formatRating(rating: number) {
  return Number.isFinite(rating) ? rating.toFixed(1) : '0.0';
}

function formatReviewCount(count: number) {
  return `${count} ${count === 1 ? 'calificación' : 'calificaciones'}`;
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

export function SearchPage() {
  const {
    albums,
    isLoading,
    error,
    fetchTab,
  } = useChartsStore((state) => state);
  const spotlightAlbum = albums[0];
  const featuredAlbums = albums.slice(1, 9);

  useEffect(() => {
    void fetchTab('top-all-time');
  }, [fetchTab]);

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="discover-title">
        <div className={styles.heroCopy}>
          <Badge variant="accent" className={styles.heroBadge}>
            <span aria-hidden="true">↗</span>
            Lo mejor calificado esta semana
          </Badge>
          <h1 id="discover-title" className={styles.title}>
            Descubre tu próximo <span>álbum favorito</span>
          </h1>
          <p className={styles.subtitle}>
            Explora los discos mejor valorados por la comunidad, encuentra nuevas obsesiones
            y comparte lo que estás escuchando.
          </p>
          <div className={styles.heroActions}>
            <ButtonLink to={ROUTES.REVIEWS}>
              Explorar el feed <span aria-hidden="true">→</span>
            </ButtonLink>
            <ButtonLink
              to={spotlightAlbum ? `${ROUTES.ALBUMS}/${spotlightAlbum.id}` : ROUTES.CHARTS}
              variant="secondary"
            >
              Álbum del día
            </ButtonLink>
          </div>
        </div>

        <div className={styles.spotlightSlot}>
          {isLoading && !spotlightAlbum ? (
            <Card padding="none" className={styles.spotlightSkeleton} aria-hidden="true">
              <Skeleton height="100%" borderRadius="0" />
            </Card>
          ) : null}

          {!isLoading && spotlightAlbum ? (
            <Link to={`${ROUTES.ALBUMS}/${spotlightAlbum.id}`} className={styles.spotlightLink}>
              <Card padding="none" className={styles.spotlightCard}>
                <div className={styles.spotlightCoverWrap}>
                  <img
                    src={spotlightAlbum.coverUrl ?? 'https://placehold.co/480x480?text=No+Cover'}
                    alt={spotlightAlbum.title}
                    className={styles.spotlightCover}
                  />
                </div>
                <div className={styles.spotlightCopy}>
                  <Badge className={styles.spotlightBadge}>Destacado</Badge>
                  <h2 className={styles.spotlightTitle}>{spotlightAlbum.title}</h2>
                  <p className={styles.spotlightArtist}>{spotlightAlbum.artist}</p>
                  <div className={styles.spotlightRating}>
                    <RatingStars rating={spotlightAlbum.avgRating} />
                    <span className={styles.ratingNumber}>
                      {formatRating(spotlightAlbum.avgRating)}
                    </span>
                  </div>
                  <p className={styles.spotlightReviews}>
                    {formatReviewCount(spotlightAlbum.reviewCount)}
                  </p>
                  <span className={styles.spotlightCta}>Ver álbum →</span>
                </div>
              </Card>
            </Link>
          ) : null}

          {!isLoading && !spotlightAlbum ? (
            <Card className={styles.emptySpotlight}>
              <h2 className={styles.emptyTitle}>Todavía no hay álbum destacado</h2>
              <p className={styles.emptyText}>
                Los discos aparecerán aquí cuando la comunidad publique sus calificaciones.
              </p>
            </Card>
          ) : null}
        </div>
      </section>

      <section className={styles.featuredSection} aria-labelledby="featured-title">
        <header className={styles.sectionHeader}>
          <div>
            <h2 id="featured-title" className={styles.sectionTitle}>Álbumes destacados</h2>
            <p className={styles.sectionSubtitle}>
              Los favoritos históricos mejor valorados por la comunidad.
            </p>
          </div>
          <Link to={ROUTES.CHARTS} className={styles.seeAllLink}>
            Ver todo <span aria-hidden="true">→</span>
          </Link>
        </header>

        {error ? (
          <Card className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>No pudimos cargar los álbumes</h3>
            <p className={styles.emptyText}>{error}</p>
          </Card>
        ) : null}

        {isLoading && !error ? (
          <div className={styles.albumGrid}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} padding="none" className={styles.skeletonCard} aria-hidden="true">
                <Skeleton height="auto" borderRadius="0" style={{ aspectRatio: '1' }} />
                <div className={styles.skeletonCopy}>
                  <Skeleton height="0.7rem" width="42%" />
                  <Skeleton height="1rem" />
                  <Skeleton height="0.8rem" width="72%" />
                  <Skeleton height="1.25rem" width="84%" />
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {!isLoading && !error && featuredAlbums.length > 0 ? (
          <div className={styles.albumGrid}>
            {featuredAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

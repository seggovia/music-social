import { Card } from '@/shared/components/ui';
import type { SocialLinks as SocialLinksType } from '../types';
import styles from './SocialLinks.module.css';

const PLATFORMS: { key: keyof SocialLinksType; label: string; mark: string }[] = [
  { key: 'spotify_url', label: 'Spotify', mark: 'SP' },
  { key: 'lastfm_url', label: 'Last.fm', mark: 'FM' },
  { key: 'instagram_url', label: 'Instagram', mark: 'IG' },
  { key: 'twitter_url', label: 'Twitter / X', mark: 'X' },
  { key: 'youtube_url', label: 'YouTube', mark: 'YT' },
  { key: 'bandcamp_url', label: 'Bandcamp', mark: 'BC' },
];

interface Props {
  links: SocialLinksType;
}

export function SocialLinks({ links }: Props) {
  const active = PLATFORMS.filter((platform) => links[platform.key]);

  return (
    <section className={styles.section} aria-labelledby="connections-title">
      <header className={styles.sectionHeader}>
        <h2 id="connections-title">Conexiones</h2>
      </header>
      {active.length === 0 ? (
        <Card className={styles.empty}>Todavía no hay enlaces sociales.</Card>
      ) : (
        <div className={styles.grid}>
          {active.map((platform) => (
            <a
              key={platform.key}
              href={links[platform.key]!}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              <span className={styles.iconWrap} aria-hidden="true">{platform.mark}</span>
              {platform.label}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

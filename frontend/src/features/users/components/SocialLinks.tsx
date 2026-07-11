import type { CSSProperties } from 'react';
import type { SocialLinks as SocialLinksType } from '../types';
import styles from './SocialLinks.module.css';

const PLATFORMS: { key: keyof SocialLinksType; label: string; color: string; mark: string }[] = [
  { key: 'spotify_url', label: 'Spotify', color: '#1DB954', mark: 'SP' },
  { key: 'lastfm_url', label: 'Last.fm', color: '#D51007', mark: 'FM' },
  { key: 'instagram_url', label: 'Instagram', color: '#E1306C', mark: 'IG' },
  { key: 'twitter_url', label: 'Twitter / X', color: '#FFFFFF', mark: 'X' },
  { key: 'youtube_url', label: 'YouTube', color: '#FF0000', mark: 'YT' },
  { key: 'bandcamp_url', label: 'Bandcamp', color: '#1DA0C3', mark: 'BC' },
];

interface Props {
  links: SocialLinksType;
}

export function SocialLinks({ links }: Props) {
  const active = PLATFORMS.filter((p) => links[p.key]);

  return (
    <section className={styles.section} aria-label="Connections">
      <div className={styles.sectionHeader}>
        <p className={styles.eyebrow}>Connections</p>
        <h2>Links</h2>
      </div>
      {active.length === 0 ? (
        <p className={styles.empty}>No connections added yet.</p>
      ) : (
        <div className={styles.grid}>
          {active.map((p) => (
            <a
              key={p.key}
              href={links[p.key]!}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.badge}
              style={{ '--platform-color': p.color } as CSSProperties}
            >
              <span className={styles.iconWrap} aria-hidden="true">{p.mark}</span>
              {p.label}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

import type { ReactElement } from 'react';
import type { SocialLinks as SocialLinksType } from '../types';
import styles from './SocialLinks.module.css';

const PLATFORMS: { key: keyof SocialLinksType; label: string; color: string; icon: ReactElement }[] = [  {
    key: 'spotify_url',
    label: 'Spotify',
    color: '#1DB954',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.36-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.32-1.32 9.66-.66 13.32 1.621.42.18.6.84.42 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.301.421-1.021.599-1.561.3z" />
      </svg>
    ),
  },
  {
    key: 'lastfm_url',
    label: 'Last.fm',
    color: '#D51007',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M10.584 17.21l-.88-2.392s-1.43 1.594-3.573 1.594c-1.897 0-3.244-1.649-3.244-4.288 0-3.382 1.704-4.591 3.381-4.591 2.42 0 3.189 1.567 3.85 3.574l.88 2.749c.88 2.667 2.529 4.81 7.285 4.81 3.409 0 5.717-1.044 5.717-3.793 0-2.227-1.265-3.382-3.62-3.932l-1.758-.385c-1.21-.275-1.567-.77-1.567-1.595 0-.934.742-1.484 1.953-1.484 1.32 0 2.034.495 2.144 1.677l2.749-.33c-.22-2.475-1.87-3.492-4.728-3.492-2.529 0-4.893 1.018-4.893 3.932 0 1.842 1.018 3.107 3.382 3.657l1.87.44c1.32.302 1.677.853 1.677 1.622 0 1.015-.99 1.43-2.86 1.43-2.776 0-3.932-1.457-4.564-3.464l-.907-2.749c-1.155-3.574-2.969-4.838-6.378-4.838C2.034 5.418 0 7.836 0 12.31c0 4.31 2.034 6.59 5.992 6.59 3.107 0 4.592-1.43 4.592-1.43z" />
      </svg>
    ),
  },
  {
    key: 'instagram_url',
    label: 'Instagram',
    color: '#E1306C',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    key: 'twitter_url',
    label: 'Twitter / X',
    color: '#FFFFFF',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: 'youtube_url',
    label: 'YouTube',
    color: '#FF0000',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z" />
      </svg>
    ),
  },
  {
    key: 'bandcamp_url',
    label: 'Bandcamp',
    color: '#1DA0C3',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" />
      </svg>
    ),
  },
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
      <p className={styles.intro}>Show your socials so people can find you elsewhere 🎶</p>
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
              style={{ '--platform-color': p.color } as React.CSSProperties}
            >
              <span className={styles.iconWrap} style={{ color: p.color }}>{p.icon}</span>
              {p.label}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

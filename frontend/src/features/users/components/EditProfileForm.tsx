import { useState } from 'react';
import { useThemeStore, type ThemePreference } from '@/shared/stores/themeStore';
import { useUsersStore } from '../stores/usersStore';
import type { SocialLinks, UpdateProfileInput, UserProfile } from '../types';
import styles from './EditProfileForm.module.css';

const PLATFORMS: { key: keyof SocialLinks; label: string; mark: string; placeholder: string }[] = [
  { key: 'spotify_url', label: 'Spotify', mark: 'SP', placeholder: 'https://open.spotify.com/user/...' },
  { key: 'lastfm_url', label: 'Last.fm', mark: 'FM', placeholder: 'https://www.last.fm/user/...' },
  { key: 'instagram_url', label: 'Instagram', mark: 'IG', placeholder: 'https://instagram.com/...' },
  { key: 'twitter_url', label: 'Twitter / X', mark: 'X', placeholder: 'https://x.com/...' },
  { key: 'youtube_url', label: 'YouTube', mark: 'YT', placeholder: 'https://youtube.com/@...' },
  { key: 'bandcamp_url', label: 'Bandcamp', mark: 'BC', placeholder: 'https://yourname.bandcamp.com' },
];

interface Props {
  profile: UserProfile;
  onCancel: () => void;
  onSaved: () => void;
}

export function EditProfileForm({ profile, onCancel, onSaved }: Props) {
  const { updateProfile, isLoading } = useUsersStore();
  const setTheme = useThemeStore((state) => state.setTheme);

  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const originalTheme = profile.theme_preference ?? 'light';
  const [themePreference, setThemePreference] = useState<ThemePreference>(originalTheme);
  const [links, setLinks] = useState<SocialLinks>({
    spotify_url: profile.spotify_url ?? '',
    lastfm_url: profile.lastfm_url ?? '',
    instagram_url: profile.instagram_url ?? '',
    twitter_url: profile.twitter_url ?? '',
    youtube_url: profile.youtube_url ?? '',
    bandcamp_url: profile.bandcamp_url ?? '',
  } as SocialLinks);

  function updateLink(key: keyof SocialLinks, value: string) {
    setLinks((prev) => ({ ...prev, [key]: value }));
  }

  function handleThemeChange(theme: ThemePreference) {
    setThemePreference(theme);
    setTheme(theme, false);
  }

  function handleCancel() {
    setTheme(originalTheme, false);
    onCancel();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: UpdateProfileInput = {
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      spotify_url: links.spotify_url?.trim() || null,
      lastfm_url: links.lastfm_url?.trim() || null,
      instagram_url: links.instagram_url?.trim() || null,
      twitter_url: links.twitter_url?.trim() || null,
      youtube_url: links.youtube_url?.trim() || null,
      bandcamp_url: links.bandcamp_url?.trim() || null,
      theme_preference: themePreference,
    };

    try {
      await updateProfile(profile.username, payload);
      onSaved();
    } catch {
      // The global toast displays the error.
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="displayName">Display name</label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={styles.input}
          placeholder="Your name"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="avatarUrl">Avatar URL</label>
        <input
          id="avatarUrl"
          type="text"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className={styles.input}
          placeholder="https://example.com/your-photo.jpg"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className={styles.textarea}
          rows={3}
          placeholder="Tell people about your music taste..."
        />
      </div>

      <h3 className={styles.sectionTitle}>Connections</h3>
      <div className={styles.platformList}>
        {PLATFORMS.map((p) => (
          <div key={p.key} className={styles.platformRow}>
            <span className={styles.platformMark} aria-hidden="true">{p.mark}</span>
            <input
              type="text"
              value={links[p.key] ?? ''}
              onChange={(e) => updateLink(p.key, e.target.value)}
              className={styles.input}
              placeholder={p.placeholder}
              aria-label={p.label}
            />
          </div>
        ))}
      </div>

      <h3 className={styles.sectionTitle}>Preferencias</h3>
      <div className={styles.preferenceCard}>
        <div className={styles.preferenceCopy}>
          <span id="theme-preference-label" className={styles.preferenceLabel}>Tema</span>
          <span className={styles.preferenceValue}>
            {themePreference === 'light' ? 'Claro' : 'Oscuro'}
          </span>
        </div>
        <label className={styles.switch}>
          <input
            type="checkbox"
            role="switch"
            checked={themePreference === 'dark'}
            onChange={(event) => handleThemeChange(event.target.checked ? 'dark' : 'light')}
            className={styles.switchInput}
            aria-labelledby="theme-preference-label"
          />
          <span className={styles.switchTrack} aria-hidden="true">
            <span className={styles.switchThumb} />
          </span>
        </label>
      </div>

      <div className={styles.actions}>
        <button type="submit" disabled={isLoading} className={styles.saveButton}>
          {isLoading ? 'Saving...' : 'Save profile'}
        </button>
        <button type="button" onClick={handleCancel} className={styles.cancelButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}

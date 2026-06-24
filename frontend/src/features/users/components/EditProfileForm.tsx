import { useState } from 'react';
import { useUsersStore } from '../stores/usersStore';
import type { SocialLinks, UpdateProfileInput, UserProfile } from '../types';
import styles from './EditProfileForm.module.css';

const PLATFORMS: { key: keyof SocialLinks; label: string; emoji: string; placeholder: string }[] = [
  { key: 'spotify_url', label: 'Spotify', emoji: '🎧', placeholder: 'https://open.spotify.com/user/...' },
  { key: 'lastfm_url', label: 'Last.fm', emoji: '📻', placeholder: 'https://www.last.fm/user/...' },
  { key: 'instagram_url', label: 'Instagram', emoji: '📷', placeholder: 'https://instagram.com/...' },
  { key: 'twitter_url', label: 'Twitter / X', emoji: '🐦', placeholder: 'https://x.com/...' },
  { key: 'youtube_url', label: 'YouTube', emoji: '▶️', placeholder: 'https://youtube.com/@...' },
  { key: 'bandcamp_url', label: 'Bandcamp', emoji: '🎵', placeholder: 'https://yourname.bandcamp.com' },
];

interface Props {
  profile: UserProfile;
  onCancel: () => void;
  onSaved: () => void;
}

export function EditProfileForm({ profile, onCancel, onSaved }: Props) {
  const { updateProfile, isLoading, error } = useUsersStore();

  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
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
    };

    try {
      await updateProfile(profile.username, payload);
      onSaved();
    } catch {
      // El error ya queda guardado en el store
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <p className={styles.error}>{error}</p>}

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
      {PLATFORMS.map((p) => (
        <div key={p.key} className={styles.platformRow}>
          <span className={styles.platformEmoji}>{p.emoji}</span>
          <input
            type="text"
            value={links[p.key] ?? ''}
            onChange={(e) => updateLink(p.key, e.target.value)}
            className={styles.input}
            placeholder={p.placeholder}
          />
        </div>
      ))}

      <div className={styles.actions}>
        <button type="submit" disabled={isLoading} className={styles.saveButton}>
          {isLoading ? 'Saving...' : 'Save profile'}
        </button>
        <button type="button" onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}
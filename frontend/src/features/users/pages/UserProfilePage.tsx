import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { EditProfileForm } from '../components/EditProfileForm';
import { SocialLinks } from '../components/SocialLinks';
import { useUsersStore } from '../stores/usersStore';
import styles from './UserProfilePage.module.css';

export function UserProfilePage() {
  const { username } = useParams();
  const { currentProfile, isLoading, error, fetchProfile } = useUsersStore();
  const me = useAuthStore((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!username) return;
    void fetchProfile(username);
  }, [fetchProfile, username]);

  if (!username) return <p className={styles.page}>User not found.</p>;
  if (isLoading) return <p className={styles.page}>Loading profile...</p>;
  if (error) return <p className={styles.page} role="alert">{error}</p>;
  if (!currentProfile) return <p className={styles.page}>No profile data available.</p>;

  const initial = currentProfile.username.charAt(0).toUpperCase();
  const isOwnProfile = me?.username === currentProfile.username;

  if (isEditing) {
    return (
      <div className={styles.page}>
        <h1 className={styles.username}>Edit profile</h1>
        <EditProfileForm
          profile={currentProfile}
          onCancel={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false);
            void fetchProfile(username);
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        {currentProfile.avatar_url ? (
          <img src={currentProfile.avatar_url} alt={currentProfile.username} className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder}>{initial}</div>
        )}
        <div>
          <h1 className={styles.username}>{currentProfile.username}</h1>
          {currentProfile.display_name && (
            <p className={styles.displayName}>{currentProfile.display_name}</p>
          )}
          <div className={styles.stats}>
            <span><span className={styles.statValue}>{currentProfile.reviewCount}</span> reviews</span>
            {currentProfile.avgRating !== null && (
              <span><span className={styles.statValue}>{currentProfile.avgRating.toFixed(1)}</span> avg rating</span>
            )}
          </div>
          {currentProfile.bio && <p className={styles.bio}>{currentProfile.bio}</p>}
          {isOwnProfile && (
            <button type="button" onClick={() => setIsEditing(true)} className={styles.editButton}>
              Edit profile
            </button>
          )}
        </div>
      </div>

      <SocialLinks links={currentProfile} />

      <h2 className={styles.sectionTitle}>Reviews ({currentProfile.reviewCount})</h2>
      {currentProfile.reviews.length === 0 ? (
        <p className={styles.empty}>No reviews yet.</p>
      ) : (
        <div className={styles.reviewGrid}>
          {currentProfile.reviews.map((review) => (
            <article key={review.id} className={styles.reviewCard}>
              <img
                src={review.albums?.cover_url ?? 'https://placehold.co/64x64?text=No+Cover'}
                alt={review.albums?.title ?? 'Album'}
                className={styles.reviewCover}
              />
              <div className={styles.reviewInfo}>
                <p className={styles.reviewAlbumTitle}>{review.albums?.title ?? 'Unknown album'}</p>
                <p className={styles.reviewArtist}>{review.albums?.artists?.[0]?.name ?? 'Unknown artist'}</p>
                <p className={styles.reviewRating}>⭐ {review.rating} / 5</p>
                <p className={styles.reviewContent}>{review.content}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
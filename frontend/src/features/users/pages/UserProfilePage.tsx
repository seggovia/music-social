import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Skeleton } from '@/shared/components/Skeleton';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { FollowButton } from '@/features/follows';
import { useMessagesStore } from '@/features/messages/stores/messagesStore';
import { useFollowsStore } from '@/features/follows/stores/followsStore';
import { EditProfileForm } from '../components/EditProfileForm';
import { SocialLinks } from '../components/SocialLinks';
import { useUsersStore } from '../stores/usersStore';
import styles from './UserProfilePage.module.css';

export function UserProfilePage() {
  const { username } = useParams();
  const { currentProfile, isLoading, error, fetchProfile } = useUsersStore();
  const { stats } = useFollowsStore();
  const me = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const messagesStore = useMessagesStore();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!username) return;
    void fetchProfile(username);
  }, [fetchProfile, username]);

  if (!username) return <p className={styles.page}>User not found.</p>;
  if (isLoading) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Skeleton width="96px" height="96px" borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton width="200px" height="16px" />
            <Skeleton width="150px" height="16px" style={{ marginTop: '0.75rem' }} />
            <Skeleton width="100px" height="16px" style={{ marginTop: '0.75rem' }} />
          </div>
        </div>
      </div>
    );
  }
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
            {stats && (
              <>
                <span><span className={styles.statValue}>{stats.followerCount}</span> followers</span>
                <span><span className={styles.statValue}>{stats.followingCount}</span> following</span>
              </>
            )}
          </div>
          {currentProfile.bio && <p className={styles.bio}>{currentProfile.bio}</p>}
          {isOwnProfile ? (
            <button type="button" onClick={() => setIsEditing(true)} className={styles.editButton}>
              Edit profile
            </button>
          ) : (
            <>
              <FollowButton userId={currentProfile.id} />
              <button
                type="button"
                className={styles.editButton}
                onClick={async () => {
                  await messagesStore.startConversation(currentProfile.id);
                  const conversation = useMessagesStore.getState().currentConversation;
                  if (conversation) {
                    navigate('/messages', { state: { conversationId: conversation.id } });
                  }
                }}
                style={{ marginTop: '0.5rem', marginLeft: '0.5rem' }}
              >
                Message
              </button>
            </>
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
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
  const { currentProfile, isLoading, fetchProfile } = useUsersStore();
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
        <section className={styles.loadingHeader}>
          <Skeleton width="128px" height="128px" borderRadius="999px" />
          <div className={styles.loadingCopy}>
            <Skeleton width="220px" height="20px" />
            <Skeleton width="340px" height="48px" />
            <div className={styles.loadingStats}>
              <Skeleton height="74px" borderRadius="8px" />
              <Skeleton height="74px" borderRadius="8px" />
              <Skeleton height="74px" borderRadius="8px" />
            </div>
          </div>
        </section>
      </div>
    );
  }
  if (!currentProfile) return <p className={styles.page}>No profile data available.</p>;

  const initial = currentProfile.username.charAt(0).toUpperCase();
  const isOwnProfile = me?.username === currentProfile.username;
  const profileStats = [
    { label: 'Reviews', value: currentProfile.reviewCount },
    ...(currentProfile.avgRating !== null
      ? [{ label: 'Avg rating', value: currentProfile.avgRating.toFixed(1) }]
      : [{ label: 'Avg rating', value: 'N/A' }]),
    ...(stats
      ? [
          { label: 'Followers', value: stats.followerCount },
          { label: 'Following', value: stats.followingCount },
        ]
      : []),
  ];

  if (isEditing) {
    return (
      <div className={styles.page}>
        <section className={styles.editHeader}>
          <p className={styles.eyebrow}>Profile settings</p>
          <h1 className={styles.username}>Edit profile</h1>
        </section>
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
      <section className={styles.profileHeader}>
        <div className={styles.avatarFrame}>
          {currentProfile.avatar_url ? (
            <img src={currentProfile.avatar_url} alt={currentProfile.username} className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>{initial}</div>
          )}
        </div>

        <div className={styles.profileMain}>
          <p className={styles.eyebrow}>Listener profile</p>
          <div className={styles.titleRow}>
            <div className={styles.identity}>
              <h1 className={styles.username}>{currentProfile.username}</h1>
              {currentProfile.display_name && (
                <p className={styles.displayName}>{currentProfile.display_name}</p>
              )}
            </div>

            <div className={styles.actionRow}>
              {isOwnProfile ? (
                <button type="button" onClick={() => setIsEditing(true)} className={styles.editButton}>
                  Edit profile
                </button>
              ) : (
                <>
                  <FollowButton userId={currentProfile.id} />
                  <button
                    type="button"
                    className={styles.messageButton}
                    onClick={async () => {
                      await messagesStore.startConversation(currentProfile.id);
                      const conversation = useMessagesStore.getState().currentConversation;
                      if (conversation) {
                        navigate('/messages', { state: { conversationId: conversation.id } });
                      }
                    }}
                  >
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          {currentProfile.bio && <p className={styles.bio}>{currentProfile.bio}</p>}
        </div>

        <div className={styles.statsGrid}>
          {profileStats.map((stat) => (
            <div key={stat.label} className={styles.statCard}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.profileBody}>
        <SocialLinks links={currentProfile} />

        <section className={styles.reviewsSection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Recent listening notes</p>
              <h2 className={styles.sectionTitle}>Reviews</h2>
            </div>
            <span className={styles.reviewTotal}>{currentProfile.reviewCount} total</span>
          </div>

          {currentProfile.reviews.length === 0 ? (
            <p className={styles.empty}>No reviews yet.</p>
          ) : (
            <div className={styles.reviewGrid}>
              {currentProfile.reviews.map((review) => {
                const reviewDate = new Date(review.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <article key={review.id} className={styles.reviewCard}>
                    <img
                      src={review.albums?.cover_url ?? 'https://placehold.co/96x96?text=No+Cover'}
                      alt={review.albums?.title ?? 'Album'}
                      className={styles.reviewCover}
                    />
                    <div className={styles.reviewInfo}>
                      <div className={styles.reviewTopLine}>
                        <p className={styles.reviewAlbumTitle}>{review.albums?.title ?? 'Unknown album'}</p>
                        <span className={styles.reviewRating}>{review.rating} / 5</span>
                      </div>
                      <p className={styles.reviewArtist}>{review.albums?.artists?.[0]?.name ?? 'Unknown artist'}</p>
                      <p className={styles.reviewContent}>{review.content}</p>
                      <time className={styles.reviewDate} dateTime={review.created_at}>{reviewDate}</time>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

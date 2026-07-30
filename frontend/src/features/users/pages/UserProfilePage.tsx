import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlbumCard } from '@/features/albums/components/AlbumCard';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { FollowButton } from '@/features/follows';
import { useFollowsStore } from '@/features/follows/stores/followsStore';
import { useMessagesStore } from '@/features/messages/stores/messagesStore';
import { Skeleton } from '@/shared/components/Skeleton';
import { Badge, Button, Card } from '@/shared/components/ui';
import { EditProfileForm } from '../components/EditProfileForm';
import { SocialLinks } from '../components/SocialLinks';
import { useUsersStore } from '../stores/usersStore';
import styles from './UserProfilePage.module.css';

const joinedDateFormatter = new Intl.DateTimeFormat('es-CL', {
  month: 'long',
  year: 'numeric',
});

function formatJoinedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha desconocida'
    : joinedDateFormatter.format(date);
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.94 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.53-1H3v-4h.08A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.53V3h4v.08A1.7 1.7 0 0 0 15.06 4.6a1.7 1.7 0 0 0 1.88-.34L17 4.2 19.83 7l-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.93 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M8 3.5v4M16 3.5v4M3.5 10h17" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 15a3 3 0 0 1-3 3H8l-4 3V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3Z" />
    </svg>
  );
}

export function UserProfilePage() {
  const { username } = useParams();
  const { currentProfile, isLoading, fetchProfile } = useUsersStore();
  const stats = useFollowsStore((state) => state.stats);
  const fetchStats = useFollowsStore((state) => state.fetchStats);
  const me = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const messagesStore = useMessagesStore();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!username) return;
    void fetchProfile(username);
  }, [fetchProfile, username]);

  useEffect(() => {
    if (!currentProfile) return;
    void fetchStats(currentProfile.id);
  }, [currentProfile, fetchStats]);

  if (!username) return <p className={styles.page}>Usuario no encontrado.</p>;
  if (isLoading) {
    return (
      <div className={styles.page}>
        <section className={styles.loadingHeader}>
          <Skeleton width="128px" height="128px" borderRadius="999px" />
          <div className={styles.loadingCopy}>
            <Skeleton width="min(360px, 100%)" height="48px" />
            <Skeleton width="180px" height="18px" />
            <Skeleton width="min(620px, 100%)" height="44px" />
          </div>
        </section>
        <div className={styles.loadingStats}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} height="96px" borderRadius="17px" />
          ))}
        </div>
      </div>
    );
  }
  if (!currentProfile) return <p className={styles.page}>No hay datos disponibles para este perfil.</p>;

  const initial = currentProfile.username.charAt(0).toUpperCase();
  const isOwnProfile = me?.username === currentProfile.username;
  const displayName = currentProfile.display_name || currentProfile.username;
  const profileStats = [
    { label: 'Reseñas', value: currentProfile.reviewCount },
    { label: 'Rating medio', value: currentProfile.avgRating?.toFixed(1) ?? '—' },
    { label: 'Seguidores', value: stats?.followerCount ?? '—' },
    { label: 'Siguiendo', value: stats?.followingCount ?? '—' },
  ];

  if (isEditing) {
    return (
      <div className={styles.page}>
        <section className={styles.editHeader}>
          <p className={styles.editEyebrow}>Preferencias del perfil</p>
          <h1 className={styles.editTitle}>Editar perfil</h1>
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
      <header className={styles.profileHeader}>
        <div className={styles.avatarFrame}>
          {currentProfile.avatar_url ? (
            <img src={currentProfile.avatar_url} alt="" className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder} aria-hidden="true">{initial}</div>
          )}
        </div>

        <div className={styles.profileMain}>
          <h1 className={styles.displayName}>{displayName}</h1>
          <p className={styles.handle}>@{currentProfile.username}</p>
          {currentProfile.bio ? <p className={styles.bio}>{currentProfile.bio}</p> : null}
          <div className={styles.profileMeta}>
            <span className={styles.metaItem}>
              <CalendarIcon />
              Se unió en {formatJoinedDate(currentProfile.created_at)}
            </span>
          </div>
        </div>

        <div className={styles.actionRow}>
          {isOwnProfile ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditing(true)}
              className={styles.settingsButton}
              aria-label="Editar perfil"
              title="Editar perfil"
            >
              <SettingsIcon />
            </Button>
          ) : (
            <>
              <FollowButton userId={currentProfile.id} />
              <Button
                type="button"
                variant="secondary"
                className={styles.messageButton}
                onClick={async () => {
                  await messagesStore.startConversation(currentProfile.id);
                  const conversation = useMessagesStore.getState().currentConversation;
                  if (conversation) {
                    navigate('/messages', { state: { conversationId: conversation.id } });
                  }
                }}
              >
                <MessageIcon />
                Mensaje
              </Button>
            </>
          )}
        </div>
      </header>

      <section className={styles.statsGrid} aria-label="Estadísticas del perfil">
        {profileStats.map((stat) => (
          <Card key={stat.label} className={styles.statCard}>
            <strong className={styles.statValue}>{stat.value}</strong>
            <span className={styles.statLabel}>{stat.label}</span>
          </Card>
        ))}
      </section>

      <div className={styles.profileBody}>
        <SocialLinks links={currentProfile} />

        <section className={styles.reviewsSection} aria-labelledby="reviewed-albums-title">
          <header className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 id="reviewed-albums-title">Álbumes reseñados</h2>
              <Badge variant="neutral" numeric className={styles.reviewCount}>
                {currentProfile.reviewCount}
              </Badge>
            </div>
          </header>

          {currentProfile.reviews.length === 0 ? (
            <Card className={styles.empty}>Todavía no hay álbumes reseñados.</Card>
          ) : (
            <div className={styles.albumGrid}>
              {currentProfile.reviews.map((review) => (
                <AlbumCard
                  key={review.id}
                  categoryLabel="Reseñado"
                  album={{
                    id: review.album_id,
                    title: review.albums?.title ?? 'Álbum desconocido',
                    artist: review.albums?.artists?.[0]?.name ?? 'Artista desconocido',
                    coverUrl: review.albums?.cover_url,
                    avgRating: Number(review.rating),
                    reviewCount: 1,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

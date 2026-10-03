import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Button } from '@/shared/components/ui';
import { EMPTY_ALBUM_STATE, useCatalogStore } from '../stores/catalogStore';
import styles from './ListenedButton.module.css';

interface ListenedButtonProps {
  albumId: string;
  className?: string;
}

function ListenedIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle className={filled ? styles.iconFill : undefined} cx="10" cy="10" r="7.25" />
      <path className={styles.iconCheck} d="m6.8 10 2.1 2.2 4.5-4.7" />
    </svg>
  );
}

export function ListenedButton({ albumId, className }: ListenedButtonProps) {
  const userId = useAuthStore((state) => state.user?.id);
  const albumState = useCatalogStore((state) => state.albumStates[albumId] ?? EMPTY_ALBUM_STATE);
  const fetchAlbumState = useCatalogStore((state) => state.fetchAlbumState);
  const toggleAlbum = useCatalogStore((state) => state.toggleAlbum);

  useEffect(() => {
    if (!userId) return;
    void fetchAlbumState(albumId, userId);
  }, [albumId, fetchAlbumState, userId]);

  if (!userId) return null;

  const classes = [
    styles.button,
    albumState.listened ? styles.active : null,
    className,
  ].filter(Boolean).join(' ');
  const title = albumState.inferredFromReview
    ? 'Este álbum cuenta como escuchado porque escribiste una review.'
    : albumState.listened
      ? 'Quitar de tus álbumes escuchados'
      : 'Marcar como escuchado';

  return (
    <Button
      type="button"
      variant="secondary"
      className={classes}
      onClick={() => void toggleAlbum(albumId, userId).catch(() => {
        // El toast global muestra el error.
      })}
      disabled={albumState.isLoading || albumState.isToggling || albumState.inferredFromReview}
      aria-pressed={albumState.listened}
      aria-busy={albumState.isLoading || albumState.isToggling}
      title={title}
    >
      <ListenedIcon filled={albumState.listened} />
      Escuchado
    </Button>
  );
}

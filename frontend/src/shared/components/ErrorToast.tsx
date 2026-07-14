import { useErrorToastStore } from '@/shared/stores/errorToastStore';
import styles from './ErrorToast.module.css';

export function ErrorToast() {
  const toast = useErrorToastStore((state) => state.toast);
  const dismiss = useErrorToastStore((state) => state.dismiss);
  const retry = useErrorToastStore((state) => state.retry);

  if (!toast) return null;

  return (
    <div className={styles.viewport} aria-live="assertive" aria-atomic="true">
      <section key={toast.id} className={styles.toast} role="alert">
        <div className={styles.icon} aria-hidden="true">!</div>
        <div className={styles.content}>
          <p className={styles.title}>No pudimos completar la acci&oacute;n</p>
          <p className={styles.message}>{toast.message}</p>
        </div>
        <div className={styles.actions}>
          {toast.onRetry ? (
            <button type="button" className={styles.retryButton} onClick={() => void retry()}>
              Reintentar
            </button>
          ) : null}
          <button type="button" className={styles.closeButton} onClick={dismiss} aria-label="Cerrar mensaje de error">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </section>
    </div>
  );
}

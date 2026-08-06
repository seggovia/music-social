import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/shared/components/ui';
import { ROUTES } from '@/shared/lib/constants';
import styles from './AuthForm.module.css';

interface AuthFormLayoutProps {
  title: string;
  subtitle: string;
  error?: string | null;
  alternatePrompt: string;
  alternateLabel: string;
  alternateTo: string;
  children: ReactNode;
}

export function AuthFormLayout({
  title,
  subtitle,
  error,
  alternatePrompt,
  alternateLabel,
  alternateTo,
  children,
}: AuthFormLayoutProps) {
  return (
    <div className={styles.page}>
      <Card padding="none" className={styles.card}>
        <div className={styles.cardInner}>
          <Link to={ROUTES.HOME} className={styles.brand} aria-label="Ir al inicio de music-social">
            <span className={styles.brandMark} aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M9 17.5A3.5 3.5 0 1 1 6.5 14.15V6.8L17.5 4v10.5a3.5 3.5 0 1 1-2-3.15V7.2L9 8.85v8.65Z" />
              </svg>
            </span>
            <span className={styles.brandText}>music<span>social</span></span>
          </Link>

          <header className={styles.heading}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </header>

          {error ? (
            <div className={styles.errorAlert} role="alert">
              <span className={styles.errorIcon} aria-hidden="true">!</span>
              <p>{error}</p>
            </div>
          ) : null}

          {children}

          <p className={styles.footer}>
            {alternatePrompt}{' '}
            <Link to={alternateTo}>{alternateLabel}</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

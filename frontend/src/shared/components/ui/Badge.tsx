import type { HTMLAttributes } from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'accent' | 'neutral' | 'rating';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  numeric?: boolean;
}

export function Badge({
  variant = 'accent',
  numeric = false,
  className,
  ...props
}: BadgeProps) {
  const classes = [
    styles.badge,
    styles[variant],
    numeric ? styles.numeric : null,
    className,
  ].filter(Boolean).join(' ');

  return <span className={classes} {...props} />;
}

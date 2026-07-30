import type { HTMLAttributes } from 'react';
import styles from './Card.module.css';

export type CardPadding = 'none' | 'default';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
}

export function Card({ padding = 'default', className, ...props }: CardProps) {
  const classes = [
    styles.card,
    padding === 'none' ? styles.noPadding : styles.defaultPadding,
    className,
  ].filter(Boolean).join(' ');

  return <div className={classes} {...props} />;
}

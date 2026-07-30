import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = [
    styles.button,
    variant === 'primary' ? styles.primary : styles.secondary,
    className,
  ].filter(Boolean).join(' ');

  return <button type={type} className={classes} {...props} />;
}

import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

export type InputSurface = 'card' | 'secondary';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  surface?: InputSurface;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { surface = 'card', className, ...props },
  ref,
) {
  const classes = [
    styles.input,
    surface === 'secondary' ? styles.secondary : styles.card,
    className,
  ].filter(Boolean).join(' ');

  return <input ref={ref} className={classes} {...props} />;
});

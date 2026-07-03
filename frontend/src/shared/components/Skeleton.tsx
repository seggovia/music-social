import { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function Skeleton({ width = '100%', height = '1rem', borderRadius = '0.25rem' }: SkeletonProps) {
  const customStyle: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
  };

  return <div className={styles.skeleton} style={customStyle} />;
}

export function SkeletonAlbumCard() {
  return (
    <div className={styles.skeletonAlbumCard}>
      <div className={styles.skeletonImage} />
      <div className={styles.skeletonTextLine} />
      <div className={styles.skeletonTextLine} />
    </div>
  );
}

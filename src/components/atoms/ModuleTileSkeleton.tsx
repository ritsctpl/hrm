'use client';

import React from 'react';
import type { ModuleTileSkeletonProps } from '@modules/hrmAccess/types/ui.types';
import styles from './ModuleTileSkeleton.module.css';

const ModuleTileSkeleton: React.FC<ModuleTileSkeletonProps> = ({ count = 8 }) => {
  return (
    <div className={styles.skeletonGrid} data-testid="module-tile-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={styles.skeletonTile}
          data-testid={`skeleton-tile-${index}`}
        />
      ))}
    </div>
  );
};

export default ModuleTileSkeleton;

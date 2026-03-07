'use client';

import React from 'react';
import { Skeleton } from 'antd';
import styles from '../styles/HrmShared.module.css';

interface HrmLoadingSkeletonProps {
  type: 'card' | 'table' | 'form';
  rows?: number;
}

/**
 * HrmLoadingSkeleton
 *
 * Loading placeholder that renders different Skeleton layouts
 * depending on the content type being loaded.
 *
 * @param type - Layout type: 'card', 'table', or 'form'
 * @param rows - Number of rows/items to render (default varies by type)
 */
const HrmLoadingSkeleton: React.FC<HrmLoadingSkeletonProps> = ({
  type,
  rows,
}) => {
  switch (type) {
    case 'card': {
      const cardCount = rows ?? 3;
      return (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {Array.from({ length: cardCount }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} style={{ flex: '1 1 280px' }}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </div>
          ))}
        </div>
      );
    }

    case 'table': {
      const tableRows = rows ?? 5;
      return (
        <div className={styles.skeletonTable}>
          {/* Header row */}
          <div className={styles.skeletonTableRow}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton.Input
                key={`header-${i}`}
                active
                size="small"
                style={{ width: '25%' }}
              />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: tableRows }).map((_, rowIdx) => (
            <div key={rowIdx} className={styles.skeletonTableRow}>
              {Array.from({ length: 4 }).map((_, colIdx) => (
                <Skeleton.Input
                  key={`${rowIdx}-${colIdx}`}
                  active
                  size="small"
                  style={{ width: '25%' }}
                />
              ))}
            </div>
          ))}
        </div>
      );
    }

    case 'form': {
      const formRows = rows ?? 4;
      return (
        <div className={styles.skeletonForm}>
          {Array.from({ length: formRows }).map((_, i) => (
            <div key={i}>
              <Skeleton.Input active size="small" style={{ width: 120, marginBottom: 8 }} />
              <Skeleton.Input active style={{ width: '100%' }} />
            </div>
          ))}
        </div>
      );
    }

    default:
      return <Skeleton active />;
  }
};

export default HrmLoadingSkeleton;

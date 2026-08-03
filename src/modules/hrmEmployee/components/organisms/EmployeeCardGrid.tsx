/**
 * EmployeeCardGrid - Grid layout of employee cards for card view mode
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { Spin, Empty, Button, Typography } from 'antd';
import EmpBasicCard from '../molecules/EmpBasicCard';
import type { EmployeeCardGridProps } from '../../types/ui.types';
import styles from '../../styles/HrmEmployee.module.css';

const { Text } = Typography;

/**
 * Card view pages by scrolling, not by page numbers.
 *
 * The directory returns 20 employees at a time. The table view spends a
 * pagination bar on that; a grid of cards has nowhere sensible to put one, so
 * reaching the bottom fetches the next page and appends it. The button below
 * the grid does the same on demand — it is what a reader reaches for when the
 * observer cannot help (no IntersectionObserver, or a grid too short to
 * scroll), and it makes "there is more" visible rather than implied.
 */
const EmployeeCardGrid: React.FC<EmployeeCardGridProps> = ({
  data,
  loading,
  onCardClick,
  totalCount = 0,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !onLoadMore || !hasMore || loading) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !loadingMore) onLoadMore();
      },
      // Against the viewport, deliberately. The page nests scroll containers
      // (the grid inside the module wrapper), and rooting on the grid makes a
      // sentinel that is never clipped read as permanently visible — which
      // would chain-load every page at once. Clipping by any ancestor is
      // already accounted for here. rootMargin starts the fetch a screenful
      // early, so the next page usually arrives before the reader hits the end.
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loading, loadingMore, data.length]);

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={styles.emptyState}>
        <Empty description="No employees found" />
      </div>
    );
  }

  return (
    <div className={styles.cardGrid}>
      {data.map((emp) => (
        <EmpBasicCard key={emp.handle} employee={emp} onClick={onCardClick} />
      ))}

      {/* Spans the grid so it sits under the cards, not in a column. */}
      <div className={styles.cardGridFooter} ref={sentinelRef}>
        {loadingMore ? (
          <Spin size="small" />
        ) : hasMore ? (
          <Button size="small" onClick={onLoadMore}>
            Load more
          </Button>
        ) : null}
        {totalCount > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Showing {data.length} of {totalCount}
          </Text>
        )}
      </div>
    </div>
  );
};

export default EmployeeCardGrid;

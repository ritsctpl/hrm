'use client';

import React from 'react';
import { Empty } from 'antd';
import styles from '../styles/HrmShared.module.css';

interface HrmEmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

/**
 * HrmEmptyState
 *
 * Centered placeholder shown when a list or view has no data.
 * Renders an Ant Design Empty illustration with a title, description,
 * and an optional action element (typically a button).
 *
 * @param title       - Headline text (e.g. "No Leave Requests")
 * @param description - Supporting description text
 * @param action      - Optional React node rendered below the description
 */
const HrmEmptyState: React.FC<HrmEmptyStateProps> = ({
  title,
  description,
  action,
}) => {
  return (
    <div className={styles.emptyState}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={null}
      />
      <h4 className={styles.emptyStateTitle}>{title}</h4>
      <p className={styles.emptyStateDescription}>{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default HrmEmptyState;

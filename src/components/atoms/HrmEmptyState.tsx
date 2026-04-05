'use client';

import React from 'react';
import { InboxOutlined } from '@ant-design/icons';
import type { HrmEmptyStateProps } from '@modules/hrmAccess/types/ui.types';
import styles from './HrmEmptyState.module.css';

const HrmEmptyState: React.FC<HrmEmptyStateProps> = ({
  title,
  subtext,
  icon,
}) => {
  return (
    <div className={styles.emptyState} data-testid="hrm-empty-state">
      <div className={styles.icon}>
        {icon ?? <InboxOutlined />}
      </div>
      <h3 className={styles.title}>{title}</h3>
      {subtext && <p className={styles.subtext}>{subtext}</p>}
    </div>
  );
};

export default HrmEmptyState;

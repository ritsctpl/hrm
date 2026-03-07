'use client';

import React from 'react';
import { Empty } from 'antd';
import type { RbacEmptyStateProps } from '../../types/ui.types';
import styles from '../../styles/HrmAccess.module.css';

const RbacEmptyState: React.FC<RbacEmptyStateProps> = ({ icon, title, description }) => {
  return (
    <div className={styles.emptyState}>
      {icon && <div className={styles.emptyIcon}>{icon}</div>}
      <Empty
        description={
          <span>
            <strong>{title}</strong>
            {description && <><br />{description}</>}
          </span>
        }
      />
    </div>
  );
};

export default RbacEmptyState;

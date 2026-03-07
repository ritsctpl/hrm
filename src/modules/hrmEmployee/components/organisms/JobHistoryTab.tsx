/**
 * JobHistoryTab - Timeline of internal role/department changes
 */

'use client';

import React from 'react';
import { Timeline, Empty } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { formatDate } from '../../utils/transformations';
import type { ProfileTabProps } from '../../types/ui.types';
import styles from '../../styles/HrmEmployeeTable.module.css';

const JobHistoryTab: React.FC<ProfileTabProps> = ({ profile }) => {
  const { jobHistory } = profile;

  if (!jobHistory.length) {
    return (
      <div className={styles.tabContent}>
        <Empty description="No job history recorded" />
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      <Timeline
        items={jobHistory.map((entry, idx) => ({
          key: idx,
          dot: <SwapOutlined style={{ fontSize: 14, color: '#1a237e' }} />,
          children: (
            <div className={styles.timelineItem}>
              <div className={styles.timelineTitle}>
                {entry.fromRole} &rarr; {entry.toRole}
              </div>
              <div className={styles.timelineSub}>
                {entry.fromDept} &rarr; {entry.toDept}
              </div>
              <div className={styles.timelineSub}>
                {formatDate(entry.date)} &middot; {entry.reason}
              </div>
            </div>
          ),
        }))}
      />
    </div>
  );
};

export default JobHistoryTab;

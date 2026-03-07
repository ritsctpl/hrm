'use client';

import { Spin, Empty, Alert } from 'antd';
import HolidayGroupCard from '../molecules/HolidayGroupCard';
import type { HolidayGroupsTableProps } from '../../types/ui.types';
import type { HolidayGroup } from '../../types/domain.types';
import styles from '../../styles/HolidayGroupsTable.module.css';

export default function HolidayGroupsTable({
  groups,
  loading,
  error,
  selectedHandle,
  onRowClick,
}: HolidayGroupsTableProps) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.spinWrapper}>
          <Spin tip="Loading groups..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Alert message={error} type="error" showIcon style={{ margin: 16 }} />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className={styles.container}>
        <Empty description="No holiday groups found" style={{ marginTop: 48 }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span>Holiday Groups</span>
        <span className={styles.count}>{groups.length}</span>
      </div>
      <div className={styles.list}>
        {groups.map((group: HolidayGroup) => (
          <HolidayGroupCard
            key={group.handle}
            group={group}
            isSelected={group.handle === selectedHandle}
            onClick={onRowClick}
          />
        ))}
      </div>
    </div>
  );
}

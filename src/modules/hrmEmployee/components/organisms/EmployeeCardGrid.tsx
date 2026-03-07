/**
 * EmployeeCardGrid - Grid layout of employee cards for card view mode
 */

'use client';

import React from 'react';
import { Spin, Empty } from 'antd';
import EmpBasicCard from '../molecules/EmpBasicCard';
import type { EmployeeCardGridProps } from '../../types/ui.types';
import styles from '../../styles/HrmEmployee.module.css';

const EmployeeCardGrid: React.FC<EmployeeCardGridProps> = ({
  data,
  loading,
  onCardClick,
}) => {
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
    </div>
  );
};

export default EmployeeCardGrid;

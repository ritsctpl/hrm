'use client';

import React from 'react';
import { Tag, Typography } from 'antd';
import type { GradeListRowProps } from '../../types/ui.types';
import { TRACK_COLOR_MAP, CURRENCY_SYMBOL_MAP } from '../../utils/gradeConstants';
import GradeLevelBadge from '../atoms/GradeLevelBadge';
import styles from '../../styles/Grade.module.css';

const fmt = (n: number): string => {
  if (n == null || Number.isNaN(n)) return '-';
  return n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n.toLocaleString();
};

const GradeListRow: React.FC<GradeListRowProps> = ({ grade, selected, onClick }) => {
  const symbol = CURRENCY_SYMBOL_MAP[grade.salaryBand?.currency] ?? '';
  return (
    <div
      className={`${styles.listRow} ${selected ? styles.listRowSelected : ''}`}
      onClick={onClick}
    >
      <div className={styles.listRowMain}>
        <GradeLevelBadge level={grade.level} />
        <div style={{ minWidth: 0 }}>
          <div className={styles.listRowTitle}>
            {grade.gradeName}
            {!grade.active && (
              <Tag color="default" style={{ marginLeft: 6, fontSize: 10 }}>
                Inactive
              </Tag>
            )}
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {grade.gradeCode}
          </Typography.Text>
        </div>
      </div>
      <div className={styles.listRowMeta}>
        <Tag color={TRACK_COLOR_MAP[grade.track] ?? 'default'} style={{ margin: 0, fontSize: 10 }}>
          {grade.track}
        </Tag>
        {grade.salaryBand && (
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {symbol}
            {fmt(grade.salaryBand.minSalary)} – {symbol}
            {fmt(grade.salaryBand.maxSalary)}
          </Typography.Text>
        )}
      </div>
    </div>
  );
};

export default GradeListRow;

'use client';

import React from 'react';
import { Card, Statistic } from 'antd';
import type { PayrollSummaryCardProps } from '../../types/ui.types';
import { formatINR } from '../../utils/payrollFormatters';
import { VARIANCE_THRESHOLD_WARNING } from '../../utils/payrollConstants';
import styles from '../../styles/PayrollDashboard.module.css';

const COLOR_MAP: Record<string, string> = {
  green: '#52c41a',
  red: '#ff4d4f',
  blue: '#1677ff',
  default: '#000000d9',
};

const PayrollSummaryCard: React.FC<PayrollSummaryCardProps> = ({
  title,
  value,
  prefix,
  variance,
  valueColor = 'default',
  icon,
}) => {
  const displayValue = typeof value === 'number' ? formatINR(value) : value;
  const varColor =
    variance !== undefined
      ? Math.abs(variance) >= VARIANCE_THRESHOLD_WARNING
        ? '#ff4d4f'
        : variance >= 0
        ? '#52c41a'
        : '#ff4d4f'
      : undefined;

  return (
    <Card className={styles.summaryCard} bodyStyle={{ padding: '14px 16px' }}>
      {icon && <div className={styles.cardIcon}>{icon}</div>}
      <Statistic
        title={title}
        value={displayValue}
        prefix={prefix}
        valueStyle={{ color: COLOR_MAP[valueColor] ?? COLOR_MAP.default, fontSize: 22 }}
        suffix={
          variance !== undefined ? (
            <span style={{ fontSize: 12, color: varColor, marginLeft: 6 }}>
              {variance >= 0 ? '+' : ''}
              {variance.toFixed(1)}%
            </span>
          ) : undefined
        }
      />
    </Card>
  );
};

export default PayrollSummaryCard;

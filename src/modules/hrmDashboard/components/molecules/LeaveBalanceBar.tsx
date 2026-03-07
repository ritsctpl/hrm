'use client';

import { Tooltip } from 'antd';
import { LeaveBalance } from '../../types/domain.types';
import styles from '../../styles/Dashboard.module.css';

interface LeaveBalanceBarProps {
  item: LeaveBalance;
}

export default function LeaveBalanceBar({ item }: LeaveBalanceBarProps) {
  const pct = item.total > 0 ? Math.round((item.used / item.total) * 100) : 0;
  const color = item.color ?? '#1890ff';

  return (
    <div className={styles.leaveBalanceBar}>
      <div className={styles.leaveBarHeader}>
        <span className={styles.leaveBarLabel}>{item.leaveType}</span>
        <span className={styles.leaveBarCount}>
          {item.available} <span className={styles.leaveBarTotal}>/ {item.total}</span>
        </span>
      </div>
      <Tooltip title={`Used: ${item.used} | Available: ${item.available}`}>
        <div className={styles.leaveBarTrack}>
          <div
            className={styles.leaveBarFill}
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </Tooltip>
    </div>
  );
}

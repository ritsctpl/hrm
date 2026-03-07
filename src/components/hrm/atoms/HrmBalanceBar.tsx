'use client';

import React, { useMemo } from 'react';
import { Progress } from 'antd';
import styles from '../styles/HrmShared.module.css';

interface HrmBalanceBarProps {
  used: number;
  total: number;
  label: string;
  thresholds?: number[];
}

/**
 * HrmBalanceBar
 *
 * A progress bar that visualises used / total quantities.
 * Color transitions through green, yellow, and red based on
 * configurable thresholds (defaults: 50%, 80%).
 *
 * @param used       - Amount consumed
 * @param total      - Maximum capacity
 * @param label      - Descriptive label shown above the bar
 * @param thresholds - Two-element array [warnAt, dangerAt] as percentages
 */
const HrmBalanceBar: React.FC<HrmBalanceBarProps> = ({
  used,
  total,
  label,
  thresholds = [50, 80],
}) => {
  const percent = useMemo(() => {
    if (total <= 0) return 0;
    return Math.min(Math.round((used / total) * 100), 100);
  }, [used, total]);

  const strokeColor = useMemo(() => {
    const [warnAt, dangerAt] = thresholds;
    if (percent >= dangerAt) return '#ff4d4f';
    if (percent >= warnAt) return '#faad14';
    return '#52c41a';
  }, [percent, thresholds]);

  return (
    <div className={styles.balanceBar}>
      <div className={styles.balanceBarLabel}>
        <span>{label}</span>
        <span className={styles.balanceBarCount}>
          {used} / {total}
        </span>
      </div>
      <Progress
        percent={percent}
        strokeColor={strokeColor}
        showInfo={false}
        size="small"
      />
    </div>
  );
};

export default HrmBalanceBar;

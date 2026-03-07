'use client';

import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { KpiCardProps } from '../../types/ui.types';
import styles from '../../styles/Dashboard.module.css';

export default function KpiCard({ title, value, unit, trend, trendLabel, color, icon }: KpiCardProps) {
  const trendUp = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;

  return (
    <div className={styles.kpiCard} style={{ borderTop: color ? `3px solid ${color}` : undefined }}>
      <div className={styles.kpiHeader}>
        <span className={styles.kpiTitle}>{title}</span>
        {icon && <span className={styles.kpiIcon}>{icon}</span>}
      </div>
      <div className={styles.kpiValue}>
        {value}
        {unit && <span className={styles.kpiUnit}>{unit}</span>}
      </div>
      {trend !== undefined && (
        <div className={`${styles.kpiTrend} ${trendUp ? styles.trendUp : trendDown ? styles.trendDown : styles.trendFlat}`}>
          {trendUp && <ArrowUpOutlined />}
          {trendDown && <ArrowDownOutlined />}
          <span>{Math.abs(trend)}% {trendLabel ?? ''}</span>
        </div>
      )}
    </div>
  );
}

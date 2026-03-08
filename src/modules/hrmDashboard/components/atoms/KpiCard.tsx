'use client';

import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { KpiCardProps } from '../../types/ui.types';
import styles from '../../styles/Dashboard.module.css';

export default function KpiCard({ title, value, unit, trend, trendPercentage, trendLabel, color, colorIndicator, icon }: KpiCardProps) {
  const trendUp = trend === 'UP';
  const trendDown = trend === 'DOWN';
  const borderColor = color ?? (colorIndicator === 'GREEN' ? '#52c41a' : colorIndicator === 'YELLOW' ? '#faad14' : colorIndicator === 'RED' ? '#ff4d4f' : undefined);

  return (
    <div className={styles.kpiCard} style={{ borderTop: borderColor ? `3px solid ${borderColor}` : undefined }}>
      <div className={styles.kpiHeader}>
        <span className={styles.kpiTitle}>{title}</span>
        {icon && <span className={styles.kpiIcon}>{icon}</span>}
      </div>
      <div className={styles.kpiValue}>
        {value}
        {unit && <span className={styles.kpiUnit}>{unit}</span>}
      </div>
      {trend && (
        <div className={`${styles.kpiTrend} ${trendUp ? styles.trendUp : trendDown ? styles.trendDown : styles.trendFlat}`}>
          {trendUp && <ArrowUpOutlined />}
          {trendDown && <ArrowDownOutlined />}
          <span>{trendPercentage != null ? `${Math.abs(trendPercentage)}%` : ''} {trendLabel ?? ''}</span>
        </div>
      )}
    </div>
  );
}

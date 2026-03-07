'use client';

import type { ReactNode } from 'react';
import { TeamOutlined, UserAddOutlined, UserDeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import KpiCard from '../../atoms/KpiCard';
import styles from '../../../styles/Dashboard.module.css';

const ICON_MAP: Record<number, ReactNode> = {
  0: <TeamOutlined />,
  1: <UserAddOutlined />,
  2: <UserDeleteOutlined />,
  3: <ClockCircleOutlined />,
};

const COLOR_MAP: Record<number, string> = {
  0: '#1890ff',
  1: '#52c41a',
  2: '#ff4d4f',
  3: '#faad14',
};

export default function HrKpiRow() {
  const { hrKpis, loadingHrData } = useHrmDashboardStore();

  if (loadingHrData) {
    return (
      <div className={styles.hrKpiRow}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={styles.kpiCard}>
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} style={{ width: '60%' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.hrKpiRow}>
      {hrKpis.map((kpi, i) => (
        <KpiCard
          key={kpi.title}
          title={kpi.title}
          value={kpi.value}
          unit={kpi.unit}
          trend={kpi.trend}
          trendLabel={kpi.trendLabel}
          color={kpi.color ?? COLOR_MAP[i] ?? '#1890ff'}
          icon={ICON_MAP[i]}
        />
      ))}
    </div>
  );
}

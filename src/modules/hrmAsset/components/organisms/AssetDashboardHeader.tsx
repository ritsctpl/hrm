'use client';

import { Skeleton } from 'antd';
import AssetSummaryCard from '../molecules/AssetSummaryCard';
import type { AssetDashboardHeaderProps } from '../../types/ui.types';
import styles from '../../styles/AssetDashboard.module.css';

export default function AssetDashboardHeader({ dashboard, loading }: AssetDashboardHeaderProps) {
  if (loading) return <Skeleton active paragraph={{ rows: 1 }} style={{ padding: '12px 16px' }} />;
  if (!dashboard) return null;

  const cards = [
    { label: 'Total Assets', value: dashboard.totalAssets, colorVariant: 'default' as const },
    { label: 'In Store', value: dashboard.inStore, colorVariant: 'info' as const },
    { label: 'Working', value: dashboard.assigned, colorVariant: 'success' as const },
    { label: 'Under Repair', value: dashboard.underRepair, colorVariant: 'warning' as const },
    { label: 'Warranty Expiring', value: dashboard.warrantyExpiringIn30Days, colorVariant: 'danger' as const },
    { label: 'Pending Requests', value: dashboard.pendingRequests, colorVariant: 'warning' as const },
  ];

  return (
    <div className={styles.dashboardRow}>
      {cards.map((card) => (
        <AssetSummaryCard key={card.label} {...card} />
      ))}
    </div>
  );
}

'use client';

import React from 'react';
import { Card } from 'antd';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import TrendingDownOutlined from '@mui/icons-material/TrendingDownOutlined';
import styles from '../styles/HrmShared.module.css';

interface HrmDashboardCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
  color?: string;
}

/**
 * HrmDashboardCard
 *
 * A KPI stat card for HRM dashboards showing an icon, large value,
 * title label, and an optional trend indicator (up/down arrow with
 * percentage).
 *
 * @param title - Descriptive label (e.g. "Total Employees")
 * @param value - The KPI value to display prominently
 * @param trend - Percentage change; positive = green up, negative = red down
 * @param icon  - React node rendered in the icon area
 * @param color - Accent color for the left border and icon background
 */
const HrmDashboardCard: React.FC<HrmDashboardCardProps> = ({
  title,
  value,
  trend,
  icon,
  color = '#1890ff',
}) => {
  const accentStyle = {
    '--hrm-card-accent': color,
  } as React.CSSProperties;

  return (
    <Card
      size="small"
      className={styles.dashboardCard}
      style={accentStyle}
      bordered
    >
      <div className={styles.dashboardCardHeader}>
        <div
          className={styles.dashboardCardIcon}
          style={{ backgroundColor: `${color}14`, color }}
        >
          {icon}
        </div>
        {trend !== undefined && trend !== 0 && (
          <span
            className={`${styles.dashboardCardTrend} ${
              trend > 0 ? styles.trendUp : styles.trendDown
            }`}
          >
            {trend > 0 ? (
              <TrendingUpOutlined style={{ fontSize: 14 }} />
            ) : (
              <TrendingDownOutlined style={{ fontSize: 14 }} />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className={styles.dashboardCardValue}>{value}</div>
      <p className={styles.dashboardCardTitle}>{title}</p>
    </Card>
  );
};

export default HrmDashboardCard;

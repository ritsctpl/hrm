'use client';

import { Card, Typography } from 'antd';
import type { AssetSummaryCardProps } from '../../types/ui.types';
import styles from '../../styles/AssetDashboard.module.css';

const COLOR_MAP = {
  default: '#595959',
  success: '#52c41a',
  warning: '#faad14',
  danger: '#ff4d4f',
  info: '#1890ff',
};

export default function AssetSummaryCard({ label, value, colorVariant, onClick }: AssetSummaryCardProps) {
  const color = COLOR_MAP[colorVariant];
  return (
    <Card
      className={styles.summaryCard}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', borderTop: `3px solid ${color}` }}
      size="small"
    >
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{label}</Typography.Text>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
    </Card>
  );
}

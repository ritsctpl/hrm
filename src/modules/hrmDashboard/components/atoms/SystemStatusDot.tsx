'use client';

import { SystemStatusDotProps } from '../../types/ui.types';
import styles from '../../styles/Dashboard.module.css';

const STATUS_COLOR: Record<string, string> = {
  OK: '#52c41a',
  WARNING: '#faad14',
  ERROR: '#ff4d4f',
};

export default function SystemStatusDot({ status, size = 8 }: SystemStatusDotProps) {
  return (
    <span
      className={styles.statusDot}
      style={{ width: size, height: size, background: STATUS_COLOR[status] ?? '#d9d9d9' }}
      title={status}
    />
  );
}

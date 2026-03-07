'use client';

import { AlertSeverityDotProps } from '../../types/ui.types';
import styles from '../../styles/Dashboard.module.css';

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#ff4d4f',
  WARNING: '#faad14',
  INFO: '#1890ff',
};

export default function AlertSeverityDot({ severity, size = 8 }: AlertSeverityDotProps) {
  return (
    <span
      className={styles.severityDot}
      style={{ width: size, height: size, background: SEVERITY_COLOR[severity] ?? '#d9d9d9' }}
      title={severity}
    />
  );
}

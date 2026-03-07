import type { ReactNode } from 'react';

export interface WidgetCardProps {
  title: string;
  loading?: boolean;
  children: ReactNode;
  footerAction?: ReactNode;
  className?: string;
}

export interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  color?: string;
  icon?: ReactNode;
}

export interface AlertSeverityDotProps {
  severity: "CRITICAL" | "WARNING" | "INFO";
  size?: number;
}

export interface SystemStatusDotProps {
  status: "OK" | "WARNING" | "ERROR";
  size?: number;
}

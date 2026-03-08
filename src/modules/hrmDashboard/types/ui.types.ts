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
  trend?: "UP" | "DOWN" | "STABLE" | string | null;
  trendPercentage?: number | null;
  trendLabel?: string | null;
  color?: string;
  colorIndicator?: "GREEN" | "YELLOW" | "RED" | string | null;
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

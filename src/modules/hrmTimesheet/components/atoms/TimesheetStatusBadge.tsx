'use client';
import { Tag } from 'antd';
import { TIMESHEET_STATUS_COLORS } from '../../utils/timesheetConstants';
import type { TimesheetStatusBadgeProps } from '../../types/ui.types';

export default function TimesheetStatusBadge({ status }: TimesheetStatusBadgeProps) {
  return <Tag color={TIMESHEET_STATUS_COLORS[status] ?? 'default'}>{status}</Tag>;
}

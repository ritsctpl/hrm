'use client';

import { Calendar, Badge } from 'antd';
import type { Dayjs } from 'dayjs';
import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import WidgetCard from '../WidgetCard';

export default function TeamLeaveCalendarWidget() {
  const { teamMembers, loadingTeamOverview } = useHrmDashboardStore();
  const onLeaveCount = teamMembers.filter((m) => m.status === 'ON_LEAVE').length;

  function dateCellRender(value: Dayjs) {
    const today = new Date();
    const isToday =
      value.date() === today.getDate() &&
      value.month() === today.getMonth() &&
      value.year() === today.getFullYear();

    if (isToday && onLeaveCount > 0) {
      return <Badge count={onLeaveCount} size="small" color="#faad14" />;
    }
    return null;
  }

  return (
    <WidgetCard title="Team Leave Calendar" loading={loadingTeamOverview}>
      <Calendar
        fullscreen={false}
        cellRender={dateCellRender}
        style={{ fontSize: 12 }}
      />
    </WidgetCard>
  );
}

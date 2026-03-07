'use client';

import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import HolidayListItem from '../../molecules/HolidayListItem';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

export default function UpcomingHolidaysWidget() {
  const { upcomingHolidays, loadingHolidays } = useHrmDashboardStore();

  return (
    <WidgetCard title="Upcoming Holidays" loading={loadingHolidays}>
      {upcomingHolidays.length === 0 ? (
        <div className={styles.emptyState}>No upcoming holidays</div>
      ) : (
        upcomingHolidays.map((h, i) => (
          <HolidayListItem key={`${h.date}-${i}`} item={h} />
        ))
      )}
    </WidgetCard>
  );
}

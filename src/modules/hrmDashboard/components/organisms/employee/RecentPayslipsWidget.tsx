'use client';

import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import PayslipListItem from '../../molecules/PayslipListItem';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

export default function RecentPayslipsWidget() {
  const { recentPayslips, loadingPayslips } = useHrmDashboardStore();

  return (
    <WidgetCard title="Recent Payslips" loading={loadingPayslips}>
      {recentPayslips.length === 0 ? (
        <div className={styles.emptyState}>No payslips available</div>
      ) : (
        recentPayslips.map((p) => (
          <PayslipListItem key={`${p.month}-${p.year}`} item={p} />
        ))
      )}
    </WidgetCard>
  );
}

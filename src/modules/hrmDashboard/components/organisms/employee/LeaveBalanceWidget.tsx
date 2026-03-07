'use client';

import { Button } from 'antd';
import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import LeaveBalanceBar from '../../molecules/LeaveBalanceBar';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

export default function LeaveBalanceWidget() {
  const { leaveBalances, loadingLeaveBalances } = useHrmDashboardStore();

  return (
    <WidgetCard
      title="Leave Balance"
      loading={loadingLeaveBalances}
      footerAction={
        <Button type="link" size="small" style={{ padding: 0 }}>
          Apply Leave
        </Button>
      }
    >
      {leaveBalances.length === 0 ? (
        <div className={styles.emptyState}>No leave data</div>
      ) : (
        leaveBalances.map((lb) => (
          <LeaveBalanceBar key={lb.leaveTypeCode} item={lb} />
        ))
      )}
    </WidgetCard>
  );
}

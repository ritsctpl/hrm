'use client';

import { Button } from 'antd';
import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import PendingRequestItem from '../../molecules/PendingRequestItem';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

export default function PendingRequestsWidget() {
  const { pendingRequests, loadingPendingRequests } = useHrmDashboardStore();

  return (
    <WidgetCard
      title="My Pending Requests"
      loading={loadingPendingRequests}
      footerAction={
        <Button type="link" size="small" style={{ padding: 0 }}>
          View All
        </Button>
      }
    >
      {pendingRequests.length === 0 ? (
        <div className={styles.emptyState}>No pending requests</div>
      ) : (
        pendingRequests.map((req) => (
          <PendingRequestItem key={req.id} item={req} />
        ))
      )}
    </WidgetCard>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import ApprovalCountRow from '../../molecules/ApprovalCountRow';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

export default function PendingApprovalsWidget() {
  const { pendingApprovals, loadingApprovals } = useHrmDashboardStore();
  const router = useRouter();

  const totalPending = pendingApprovals.reduce((sum, a) => sum + a.count, 0);

  return (
    <WidgetCard
      title={`Pending Approvals${totalPending > 0 ? ` (${totalPending})` : ''}`}
      loading={loadingApprovals}
    >
      {pendingApprovals.length === 0 ? (
        <div className={styles.emptyState}>No pending approvals</div>
      ) : (
        pendingApprovals.map((item) => (
          <ApprovalCountRow
            key={item.module}
            item={item}
            onNavigate={(route) => router.push(route)}
          />
        ))
      )}
    </WidgetCard>
  );
}

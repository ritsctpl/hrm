'use client';
import { useEffect } from 'react';
import { Spin, Tabs, Empty, message } from 'antd';
import { parseCookies } from 'nookies';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectData } from '../../hooks/useProjectData';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import AllocationRow from '../molecules/AllocationRow';
import AllocationApprovalActionBar from '../molecules/AllocationApprovalActionBar';
import styles from '../../styles/ProjectDetail.module.css';

export default function AllocationApprovalInbox() {
  const {
    pendingAllocations,
    selectedAllocation,
    setSelectedAllocation,
    loadingApprovals,
    approvingAllocation,
  } = useHrmProjectStore();
  const { loadPendingAllocations } = useProjectData();
  const { approveAllocation } = useProjectMutations();
  const { employeeCode, isReady } = useEmployeeIdentity();

  useEffect(() => {
    loadPendingAllocations();
  }, []);

  const submitted = pendingAllocations.filter((a) => a.status === 'SUBMITTED');

  const resolveActor = () => {
    const cookies = parseCookies();
    const actor =
      employeeCode ||
      cookies.employeeCode ||
      cookies.employeeId ||
      cookies.userId ||
      cookies.user ||
      cookies.rl_user_id ||
      '';
    if (!actor) {
      message.error('Could not identify the signed-in user — please sign in again');
      return '';
    }
    if (actor.includes('@')) {
      console.warn('[AllocationApprovalInbox] sending email-shaped actor; backend may reject', { actor, isReady });
    }
    return actor;
  };

  const handleApprove = (remarks: string) => {
    if (!selectedAllocation) return;
    const actor = resolveActor();
    if (!actor) return;
    approveAllocation(selectedAllocation.handle, 'APPROVED', remarks, actor);
  };

  const handleReject = (remarks: string) => {
    if (!selectedAllocation) return;
    const actor = resolveActor();
    if (!actor) return;
    approveAllocation(selectedAllocation.handle, 'REJECTED', remarks, actor);
  };

  return (
    <div className={styles.approvalInbox}>
      {loadingApprovals ? (
        <Spin />
      ) : (
        <div className={styles.inboxLayout}>
          <div className={styles.inboxList}>
            <Tabs items={[{ key: 'pending', label: `Pending (${submitted.length})`, children: (
              submitted.length === 0 ? <Empty description="No pending allocations" /> : (
                submitted.map((a) => (
                  <AllocationRow
                    key={a.handle}
                    allocation={a}
                    onEdit={() => setSelectedAllocation(a)}
                  />
                ))
              )
            )}]} />
          </div>
          {selectedAllocation && (
            <div className={styles.inboxDetail}>
              <div><strong>Project:</strong> {selectedAllocation.projectCode}</div>
              <div><strong>Employee:</strong> {selectedAllocation.employeeName}</div>
              <div><strong>Hours/Day:</strong> {selectedAllocation.hoursPerDay}</div>
              <div><strong>Period:</strong> {selectedAllocation.startDate} — {selectedAllocation.endDate}</div>
              <div><strong>Pattern:</strong> {selectedAllocation.recurrencePattern ?? 'N/A'}</div>
              <AllocationApprovalActionBar
                onApprove={handleApprove}
                onReject={handleReject}
                loading={approvingAllocation}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

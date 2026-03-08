'use client';
import { useEffect } from 'react';
import { Spin, Tabs, Empty } from 'antd';
import { parseCookies } from 'nookies';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectData } from '../../hooks/useProjectData';
import { useProjectMutations } from '../../hooks/useProjectMutations';
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

  useEffect(() => {
    loadPendingAllocations();
  }, []);

  const submitted = pendingAllocations.filter((a) => a.status === 'SUBMITTED');

  const handleApprove = (remarks: string) => {
    if (selectedAllocation) {
      const userId = parseCookies().userId ?? parseCookies().user ?? '';
      approveAllocation(selectedAllocation.handle, 'APPROVED', remarks, userId);
    }
  };

  const handleReject = (remarks: string) => {
    if (selectedAllocation) {
      const userId = parseCookies().userId ?? parseCookies().user ?? '';
      approveAllocation(selectedAllocation.handle, 'REJECTED', remarks, userId);
    }
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

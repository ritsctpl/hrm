'use client';
import { useEffect } from 'react';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { useHrmTimesheetData } from '../../hooks/useHrmTimesheetData';
import { useHrmTimesheetUI } from '../../hooks/useHrmTimesheetUI';
import ApprovalInbox from '../organisms/ApprovalInbox';

export default function TimesheetSupervisorTemplate() {
  const { selectedWeekStart } = useHrmTimesheetStore();
  const { loadPendingApprovals } = useHrmTimesheetData();
  const { approveTimesheet, bulkApproveTimesheets, reopenTimesheet } = useHrmTimesheetUI();

  useEffect(() => {
    void loadPendingApprovals();
  }, [selectedWeekStart]);

  return (
    <div style={{ padding: '12px 16px' }}>
      <ApprovalInbox
        onApprove={approveTimesheet}
        onBulkApprove={bulkApproveTimesheets}
        onReopen={reopenTimesheet}
      />
    </div>
  );
}

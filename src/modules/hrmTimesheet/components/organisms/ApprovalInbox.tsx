'use client';
import { Badge, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import TimesheetStatusBadge from '../atoms/TimesheetStatusBadge';
import TimesheetApprovalDetail from './TimesheetApprovalDetail';
import styles from '../../styles/HrmTimesheet.module.css';

const { Text } = Typography;

interface Props {
  onApprove: (handle: string, action: 'APPROVED' | 'REJECTED', remarks: string) => Promise<void>;
}

export default function ApprovalInbox({ onApprove }: Props) {
  const { pendingApprovals, selectedTimesheetHandle, setSelectedTimesheetHandle, loadingApprovals } =
    useHrmTimesheetStore();

  return (
    <div className={styles.approvalLayout}>
      <div className={styles.approvalList}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
          <Text strong>Pending Approvals</Text>
          {' '}
          <Badge count={pendingApprovals.length} />
        </div>
        {loadingApprovals ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin size="small" />
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#bfbfbf' }}>
            No pending approvals
          </div>
        ) : (
          pendingApprovals.map((ts) => (
            <div
              key={ts.handle}
              className={`${styles.approvalListItem} ${ts.handle === selectedTimesheetHandle ? styles.approvalListItemSelected : ''}`}
              onClick={() => setSelectedTimesheetHandle(ts.handle)}
            >
              <Text strong style={{ fontSize: 13 }}>{ts.employeeName}</Text>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {dayjs(ts.date).format('DD MMM YYYY')}
                </Text>
                <TimesheetStatusBadge status={ts.status} />
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>{ts.department}</Text>
            </div>
          ))
        )}
      </div>

      <div className={styles.approvalDetail}>
        <TimesheetApprovalDetail onApprove={onApprove} />
      </div>
    </div>
  );
}

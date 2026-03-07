'use client';
import { Button, Input, Space, Spin, Tag, Typography } from 'antd';
import { useState } from 'react';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import TimesheetStatusBadge from '../atoms/TimesheetStatusBadge';
import TimesheetLinesTable from './TimesheetLinesTable';
import styles from '../../styles/HrmTimesheet.module.css';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface Props {
  onApprove: (handle: string, action: 'APPROVED' | 'REJECTED', remarks: string) => Promise<void>;
}

export default function TimesheetApprovalDetail({ onApprove }: Props) {
  const { selectedTimesheetHandle, pendingApprovals, unplannedCategories, approvingTimesheet } =
    useHrmTimesheetStore();
  const [remarks, setRemarks] = useState('');

  const ts = pendingApprovals.find((t) => t.handle === selectedTimesheetHandle);

  if (!selectedTimesheetHandle) {
    return (
      <div className={styles.emptyState}>
        <Text type="secondary">Select a timesheet to review</Text>
      </div>
    );
  }

  if (!ts) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spin />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space direction="vertical" size={2}>
          <Title level={5} style={{ margin: 0 }}>{ts.employeeName}</Title>
          <Text type="secondary">{ts.department}</Text>
        </Space>
        <Space>
          <Text strong>{dayjs(ts.date).format('dddd, DD MMM YYYY')}</Text>
          <TimesheetStatusBadge status={ts.status} />
        </Space>
      </div>

      {ts.isHoliday && <Tag color="blue">Holiday</Tag>}
      {ts.isLeaveDay && <Tag color="orange">Leave{ts.leaveType ? `: ${ts.leaveType}` : ''}</Tag>}

      <TimesheetLinesTable
        lines={ts.lines}
        allocations={[]}
        categories={unplannedCategories}
        readOnly
      />

      {ts.notes && (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Employee notes</Text>
          <div style={{ marginTop: 4, padding: '6px 10px', background: '#fafafa', borderRadius: 6, fontSize: 13 }}>
            {ts.notes}
          </div>
        </div>
      )}

      <div className={styles.approvalActions}>
        <TextArea
          rows={2}
          placeholder="Remarks (required for rejection)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          style={{ flex: 1 }}
        />
        <Space direction="vertical">
          <Button
            type="primary"
            size="small"
            loading={approvingTimesheet}
            onClick={() => onApprove(ts.handle, 'APPROVED', remarks)}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            loading={approvingTimesheet}
            disabled={!remarks.trim()}
            onClick={() => onApprove(ts.handle, 'REJECTED', remarks)}
          >
            Reject
          </Button>
        </Space>
      </div>
    </div>
  );
}

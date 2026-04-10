'use client';
import { Button, Input, Space, Spin, Tag, Typography } from 'antd';
import { useState } from 'react';
import { UndoOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import TimesheetStatusBadge from '../atoms/TimesheetStatusBadge';
import HoursDisplay from '../atoms/HoursDisplay';
import TimesheetLinesTable from './TimesheetLinesTable';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/HrmTimesheet.module.css';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface Props {
  onApprove: (handle: string, action: 'APPROVED' | 'REJECTED', remarks: string) => Promise<void>;
  onReopen: (handle: string, reason: string) => Promise<void>;
}

export default function TimesheetApprovalDetail({ onApprove, onReopen }: Props) {
  const { selectedTimesheetHandle, pendingApprovals, unplannedCategories, approvingTimesheet } =
    useHrmTimesheetStore();
  const [remarks, setRemarks] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenForm, setShowReopenForm] = useState(false);

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

  const canReopen = ts.status === 'APPROVED' || ts.status === 'REJECTED';
  const canApproveReject = ts.status === 'SUBMITTED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space direction="vertical" size={2}>
          <Title level={5} style={{ margin: 0 }}>{ts.employeeName}</Title>
          <Text type="secondary">{ts.department}</Text>
        </Space>
        <Space direction="vertical" align="end" size={2}>
          <Space>
            <Text strong>{dayjs(ts.date).format('dddd, DD MMM YYYY')}</Text>
            <TimesheetStatusBadge status={ts.status} />
          </Space>
          <HoursDisplay hours={ts.totalHours} colorCode={ts.colorCode} bold />
        </Space>
      </div>

      {ts.holiday && <Tag color="blue">Holiday</Tag>}
      {ts.leaveDay && <Tag color="orange">Leave{ts.leaveType ? `: ${ts.leaveType}` : ''}</Tag>}

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

      {/* Approve / Reject actions */}
      {canApproveReject && (
        <div className={styles.approvalActions}>
          <TextArea
            rows={2}
            placeholder="Remarks (required for rejection)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            style={{ flex: 1 }}
          />
          <Space direction="vertical">
            <Can I="edit">
              <Button
                type="primary"
                size="small"
                loading={approvingTimesheet}
                onClick={() => onApprove(ts.handle, 'APPROVED', remarks)}
              >
                Approve
              </Button>
            </Can>
            <Can I="edit">
              <Button
                danger
                size="small"
                loading={approvingTimesheet}
                disabled={!remarks.trim()}
                onClick={() => onApprove(ts.handle, 'REJECTED', remarks)}
              >
                Reject
              </Button>
            </Can>
          </Space>
        </div>
      )}

      {/* Reopen action for approved/rejected timesheets */}
      {canReopen && (
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginTop: 4 }}>
          {!showReopenForm ? (
            <Can I="edit">
              <Button
                icon={<UndoOutlined />}
                size="small"
                onClick={() => setShowReopenForm(true)}
              >
                Reopen Timesheet
              </Button>
            </Can>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Reopening will set the timesheet status to REOPENED and allow the employee to edit and resubmit.
              </Text>
              <TextArea
                rows={2}
                placeholder="Reason for reopening (required)"
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
              />
              <Space>
                <Can I="edit">
                  <Button
                    type="primary"
                    size="small"
                    loading={approvingTimesheet}
                    disabled={!reopenReason.trim()}
                    onClick={async () => {
                      await onReopen(ts.handle, reopenReason);
                      setShowReopenForm(false);
                      setReopenReason('');
                    }}
                  >
                    Confirm Reopen
                  </Button>
                </Can>
                <Button
                  size="small"
                  onClick={() => {
                    setShowReopenForm(false);
                    setReopenReason('');
                  }}
                >
                  Cancel
                </Button>
              </Space>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

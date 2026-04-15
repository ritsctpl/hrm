'use client';
import { useState, useCallback } from 'react';
import { Badge, Button, Checkbox, Input, Space, Spin, Typography } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import TimesheetStatusBadge from '../atoms/TimesheetStatusBadge';
import DayColorIndicator from '../atoms/DayColorIndicator';
import TimesheetApprovalDetail from './TimesheetApprovalDetail';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/HrmTimesheet.module.css';

const { Text } = Typography;

interface Props {
  onApprove: (handle: string, action: 'APPROVED' | 'REJECTED', remarks: string) => Promise<void>;
  onBulkApprove: (handles: string[], action: 'APPROVED' | 'REJECTED', remarks: string) => Promise<void>;
  onReopen: (handle: string, reason: string) => Promise<void>;
}

export default function ApprovalInbox({ onApprove, onBulkApprove, onReopen }: Props) {
  const { pendingApprovals, selectedTimesheetHandle, setSelectedTimesheetHandle, loadingApprovals, approvingTimesheet } =
    useHrmTimesheetStore();

  const [selectedHandles, setSelectedHandles] = useState<string[]>([]);
  const [bulkRemarks, setBulkRemarks] = useState('');

  const toggleHandle = useCallback((handle: string) => {
    setSelectedHandles((prev) =>
      prev.includes(handle) ? prev.filter((h) => h !== handle) : [...prev, handle]
    );
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedHandles.length === pendingApprovals.length) {
      setSelectedHandles([]);
    } else {
      setSelectedHandles(pendingApprovals.map((ts) => ts.handle));
    }
  }, [selectedHandles.length, pendingApprovals]);

  const handleBulkApprove = useCallback(async () => {
    await onBulkApprove(selectedHandles, 'APPROVED', bulkRemarks.trim());
    setSelectedHandles([]);
    setBulkRemarks('');
  }, [selectedHandles, bulkRemarks, onBulkApprove]);

  const handleBulkReject = useCallback(async () => {
    const trimmed = bulkRemarks.trim();
    if (!trimmed) {
      return;
    }
    await onBulkApprove(selectedHandles, 'REJECTED', trimmed);
    setSelectedHandles([]);
    setBulkRemarks('');
  }, [selectedHandles, bulkRemarks, onBulkApprove]);

  return (
    <div className={styles.approvalLayout}>
      <div className={styles.approvalList}>
        {/* Header with badge and bulk actions */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Space>
              <Text strong>Pending Approvals</Text>
              <Badge count={pendingApprovals.length} />
            </Space>
            {pendingApprovals.length > 0 && (
              <Checkbox
                checked={selectedHandles.length === pendingApprovals.length && pendingApprovals.length > 0}
                indeterminate={selectedHandles.length > 0 && selectedHandles.length < pendingApprovals.length}
                onChange={toggleAll}
              >
                <Text style={{ fontSize: 12 }}>Select All</Text>
              </Checkbox>
            )}
          </div>

          {/* Bulk action bar */}
          {selectedHandles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selectedHandles.length} selected
              </Text>
              <Input.TextArea
                rows={1}
                placeholder="Bulk remarks (required for reject)"
                value={bulkRemarks}
                onChange={(e) => setBulkRemarks(e.target.value)}
                size="small"
              />
              <Space size={4}>
                <Can I="edit">
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={approvingTimesheet}
                    onClick={handleBulkApprove}
                  >
                    Bulk Approve
                  </Button>
                </Can>
                <Can I="edit">
                  <Button
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    loading={approvingTimesheet}
                    disabled={!bulkRemarks.trim()}
                    onClick={handleBulkReject}
                  >
                    Bulk Reject
                  </Button>
                </Can>
              </Space>
            </div>
          )}
        </div>

        {/* List items */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Checkbox
                  checked={selectedHandles.includes(ts.handle)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleHandle(ts.handle)}
                />
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 13 }}>{ts.employeeName}</Text>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <Space size={4}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {dayjs(ts.date).format('DD MMM YYYY')}
                      </Text>
                      <DayColorIndicator colorCode={ts.colorCode} size="sm" />
                    </Space>
                    <TimesheetStatusBadge status={ts.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>{ts.department}</Text>
                    <Text style={{ fontSize: 11, fontWeight: 600 }}>{ts.totalHours.toFixed(1)} h</Text>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.approvalDetail}>
        <TimesheetApprovalDetail onApprove={onApprove} onReopen={onReopen} />
      </div>
    </div>
  );
}

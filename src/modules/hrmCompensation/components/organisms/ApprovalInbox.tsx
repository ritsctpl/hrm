'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button, Spin, Typography, Input, Modal } from 'antd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import type { EmployeeCompensationResponse } from '../../types/domain.types';
import { formatINRPlain } from '../../utils/compensationFormatters';
import CompensationStatusTag from '../atoms/CompensationStatusTag';
import styles from '../../styles/Compensation.module.css';

const ApprovalInbox: React.FC = () => {
  const {
    pendingApprovals,
    approvalsLoading,
    fetchPendingApprovals,
    approveCompensation,
    rejectCompensation,
  } = useHrmCompensationStore();

  const [rejectTarget, setRejectTarget] = useState<EmployeeCompensationResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, [fetchPendingApprovals]);

  const handleApprove = useCallback(
    async (item: EmployeeCompensationResponse) => {
      setActionLoading(item.handle);
      try {
        await approveCompensation(item.handle, 'Approved');
      } finally {
        setActionLoading(null);
      }
    },
    [approveCompensation],
  );

  const handleRejectConfirm = useCallback(async () => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.handle);
    try {
      await rejectCompensation(rejectTarget.handle, rejectReason);
      setRejectTarget(null);
      setRejectReason('');
    } finally {
      setActionLoading(null);
    }
  }, [rejectTarget, rejectReason, rejectCompensation]);

  if (approvalsLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 24px' }}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Pending Approvals</span>
        <Button
          size="small"
          icon={<RefreshIcon style={{ fontSize: 14 }} />}
          onClick={() => fetchPendingApprovals()}
        />
      </div>

      {pendingApprovals.length === 0 ? (
        <div className={styles.emptyContainer}>
          <Typography.Text type="secondary">No pending approvals</Typography.Text>
        </div>
      ) : (
        pendingApprovals.map((item) => (
          <div key={item.handle} className={styles.approvalCard}>
            <div className={styles.approvalCardHeader}>
              <div>
                <Typography.Text strong style={{ fontSize: 14 }}>
                  {item.employeeName}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                  {item.employeeId}
                </Typography.Text>
              </div>
              <CompensationStatusTag status={item.status} />
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#8c8c8c', textTransform: 'uppercase' }}>
                  Department
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.department}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8c8c8c', textTransform: 'uppercase' }}>
                  Effective From
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.effectiveFrom}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8c8c8c', textTransform: 'uppercase' }}>
                  Net Pay
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1677ff' }}>
                  {formatINRPlain(item.netPay)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8c8c8c', textTransform: 'uppercase' }}>
                  Gross
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {formatINRPlain(item.grossEarnings)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8c8c8c', textTransform: 'uppercase' }}>
                  Rev #
                </div>
                <div style={{ fontSize: 13 }}>{item.revisionNumber}</div>
              </div>
            </div>

            {item.remarks && (
              <div style={{ fontSize: 12, color: '#595959', marginBottom: 10, fontStyle: 'italic' }}>
                "{item.remarks}"
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleIcon style={{ fontSize: 13 }} />}
                loading={actionLoading === item.handle}
                onClick={() => handleApprove(item)}
              >
                Approve
              </Button>
              <Button
                size="small"
                danger
                icon={<CancelIcon style={{ fontSize: 13 }} />}
                onClick={() => setRejectTarget(item)}
                disabled={actionLoading === item.handle}
              >
                Reject
              </Button>
            </div>
          </div>
        ))
      )}

      <Modal
        title="Reject Compensation"
        open={!!rejectTarget}
        onOk={handleRejectConfirm}
        onCancel={() => {
          setRejectTarget(null);
          setRejectReason('');
        }}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true, loading: actionLoading === rejectTarget?.handle }}
      >
        <div style={{ marginBottom: 8, fontSize: 13 }}>
          Rejecting compensation for <strong>{rejectTarget?.employeeName}</strong>
        </div>
        <Input.TextArea
          rows={3}
          placeholder="Reason for rejection (required)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default ApprovalInbox;

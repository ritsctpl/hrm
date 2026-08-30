'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button, Spin, Typography, Input, Modal, message } from 'antd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import type { EmployeeCompensationResponse } from '../../types/domain.types';
import { formatINRPlain } from '../../utils/compensationFormatters';
import CompensationStatusTag from '../atoms/CompensationStatusTag';
import Can from '../../../hrmAccess/components/Can';
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
  const [rejectTouched, setRejectTouched] = useState(false);
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

  const reasonIsEmpty = rejectReason.trim().length === 0;

  const handleRejectConfirm = useCallback(async () => {
    if (!rejectTarget) return;
    // Reject MUST carry a reason — block empty/whitespace and tell the approver why.
    if (rejectReason.trim().length === 0) {
      setRejectTouched(true);
      message.error('A reason is required to reject this compensation.');
      return;
    }
    setActionLoading(rejectTarget.handle);
    try {
      await rejectCompensation(rejectTarget.handle, rejectReason.trim());
      setRejectTarget(null);
      setRejectReason('');
      setRejectTouched(false);
    } finally {
      setActionLoading(null);
    }
  }, [rejectTarget, rejectReason, rejectCompensation]);

  const closeReject = useCallback(() => {
    setRejectTarget(null);
    setRejectReason('');
    setRejectTouched(false);
  }, []);

  if (approvalsLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin />
      </div>
    );
  }

  return (
    <div className={styles.approvalsPage}>
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
                <span className={styles.approvalName}>{item.employeeName}</span>
                <span className={styles.approvalEmpId}>{item.employeeId}</span>
              </div>
              <CompensationStatusTag status={item.status} />
            </div>

            <div className={styles.approvalFigures}>
              <div className={styles.figure}>
                <span className={styles.figureLabel}>Department</span>
                <span className={styles.figureValue}>{item.department}</span>
              </div>
              <div className={styles.figure}>
                <span className={styles.figureLabel}>Effective From</span>
                <span className={styles.figureValue}>{item.effectiveFrom}</span>
              </div>
              <div className={styles.figure}>
                <span className={styles.figureLabel}>Annual CTC</span>
                <span className={`${styles.figureMoney} ${styles.figureCtc}`}>
                  {formatINRPlain(item.annualCTC)}
                </span>
              </div>
              <div className={styles.figure}>
                <span className={styles.figureLabel}>Net Pay</span>
                <span className={`${styles.figureMoney} ${styles.figureNet}`}>
                  {formatINRPlain(item.netPay)}
                </span>
              </div>
              <div className={styles.figure}>
                <span className={styles.figureLabel}>Gross</span>
                <span className={styles.figureMoney}>{formatINRPlain(item.grossEarnings)}</span>
              </div>
              <div className={styles.figure}>
                <span className={styles.figureLabel}>Rev #</span>
                <span className={styles.figureMoney}>{item.revisionNumber}</span>
              </div>
            </div>

            {item.remarks && (
              <div className={styles.approvalRemarks}>&ldquo;{item.remarks}&rdquo;</div>
            )}

            <div className={styles.approvalActions}>
              <Can I="edit">
                <Button
                  size="small"
                  type="primary"
                  className={styles.approveBtn}
                  icon={<CheckCircleIcon style={{ fontSize: 13 }} />}
                  loading={actionLoading === item.handle}
                  onClick={() => handleApprove(item)}
                >
                  Approve &amp; sign
                </Button>
              </Can>
              <Can I="edit">
                <Button
                  size="small"
                  danger
                  icon={<CancelIcon style={{ fontSize: 13 }} />}
                  onClick={() => setRejectTarget(item)}
                  disabled={actionLoading === item.handle}
                >
                  Reject
                </Button>
              </Can>
            </div>
          </div>
        ))
      )}

      <Modal
        title="Reject Compensation"
        open={!!rejectTarget}
        onOk={handleRejectConfirm}
        onCancel={closeReject}
        okText="Confirm Rejection"
        okButtonProps={{
          danger: true,
          loading: actionLoading === rejectTarget?.handle,
          // OK stays disabled until a non-empty reason is entered.
          disabled: reasonIsEmpty,
        }}
      >
        <div className={styles.rejectPrompt}>
          Rejecting compensation for{' '}
          <span className={styles.rejectHintName}>{rejectTarget?.employeeName}</span>
        </div>
        <Input.TextArea
          rows={3}
          placeholder="Reason for rejection (required)"
          value={rejectReason}
          status={rejectTouched && reasonIsEmpty ? 'error' : undefined}
          onChange={(e) => {
            setRejectReason(e.target.value);
            if (!rejectTouched) setRejectTouched(true);
          }}
        />
        {rejectTouched && reasonIsEmpty && (
          <div className={styles.rejectError}>A reason is required to reject.</div>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalInbox;

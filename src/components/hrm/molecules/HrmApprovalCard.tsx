'use client';

import React from 'react';
import { Button, Card } from 'antd';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import HrmStatusBadge from '../atoms/HrmStatusBadge';
import styles from '../styles/HrmShared.module.css';

interface ApprovalRequest {
  handle: string;
  requestType: string;
  requesterName: string;
  submittedDate: string;
  status: string;
  description?: string;
}

interface HrmApprovalCardProps {
  request: ApprovalRequest;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * HrmApprovalCard
 *
 * Displays an approval request with requester details, a status badge,
 * optional description, and Approve / Reject action buttons.
 *
 * @param request   - The approval request data
 * @param onApprove - Called when the Approve button is clicked
 * @param onReject  - Called when the Reject button is clicked
 */
const HrmApprovalCard: React.FC<HrmApprovalCardProps> = ({
  request,
  onApprove,
  onReject,
}) => {
  return (
    <Card size="small" className={styles.approvalCard} hoverable>
      <div className={styles.approvalCardHeader}>
        <div>
          <p className={styles.approvalCardRequester}>
            {request.requesterName}
          </p>
          <p className={styles.approvalCardType}>{request.requestType}</p>
        </div>
        <HrmStatusBadge status={request.status} size="sm" />
      </div>

      <p className={styles.approvalCardDate}>{request.submittedDate}</p>

      {request.description && (
        <div className={styles.approvalCardDescription}>
          {request.description}
        </div>
      )}

      <div className={styles.approvalCardActions}>
        <Button
          danger
          size="small"
          icon={<CancelOutlined style={{ fontSize: 14 }} />}
          onClick={onReject}
        >
          Reject
        </Button>
        <Button
          type="primary"
          size="small"
          icon={<CheckCircleOutlined style={{ fontSize: 14 }} />}
          onClick={onApprove}
        >
          Approve
        </Button>
      </div>
    </Card>
  );
};

export default HrmApprovalCard;

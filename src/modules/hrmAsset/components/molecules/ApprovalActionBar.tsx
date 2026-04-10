'use client';

import { useState } from 'react';
import { Button, Input, Space, Typography } from 'antd';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import type { ApprovalActionBarProps } from '../../types/ui.types';
import Can from '../../../hrmAccess/components/Can';

export default function ApprovalActionBar({
  request,
  onApprove,
  onReject,
}: ApprovalActionBarProps) {
  const [remarks, setRemarks] = useState('');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    try { await onApprove(request.requestId, remarks); }
    finally { setApproving(false); setRemarks(''); }
  };

  const handleReject = async () => {
    if (!remarks.trim()) return;
    setRejecting(true);
    try { await onReject(request.requestId, remarks); }
    finally { setRejecting(false); setRemarks(''); }
  };

  return (
    <div style={{ padding: '12px 0' }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>Remarks</Typography.Text>
      <Input.TextArea
        rows={2}
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        placeholder="Optional remarks for approval, required for rejection..."
        style={{ marginTop: 4, marginBottom: 8 }}
      />
      {!remarks.trim() && (
        <Typography.Text type="danger" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
          Remarks are required to reject a request
        </Typography.Text>
      )}
      <Space>
        <Can I="edit">
          <Button
            danger
            icon={<CancelIcon style={{ fontSize: 16 }} />}
            loading={rejecting}
            onClick={handleReject}
            disabled={!remarks.trim()}
          >
            Reject
          </Button>
        </Can>
        <Can I="edit">
          <Button
            type="primary"
            icon={<CheckCircleOutlineIcon style={{ fontSize: 16 }} />}
            loading={approving}
            onClick={handleApprove}
          >
            Approve
          </Button>
        </Can>
      </Space>
    </div>
  );
}

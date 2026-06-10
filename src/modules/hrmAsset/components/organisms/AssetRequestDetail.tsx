'use client';

import { useState } from 'react';
import { Alert, Button, Descriptions, Divider, Input, Modal, Space, Spin, Typography, message } from 'antd';
import { EditOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getOrganizationId } from '@/utils/cookieUtils';
import AssetRequestStatusBadge from '../atoms/AssetRequestStatusBadge';
import AssetActionHistoryTimeline from '../molecules/AssetActionHistoryTimeline';
import AssetRequestApprovalPanel from './AssetRequestApprovalPanel';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useEmployeeIdentity } from '../../../hrmAccess/hooks/useEmployeeIdentity';
import { formatDate, formatDateTime } from '../../utils/assetHelpers';
import type { AssetRequest } from '../../types/domain.types';

const { Title, Text } = Typography;

interface AssetRequestDetailProps {
  request: AssetRequest;
  loading?: boolean;
  isSupervisor: boolean;
  isAdmin: boolean;
  /** Refresh queues + detail after any state-changing action. */
  onActionComplete: () => void;
  /** Open the edit drawer for the request creator. */
  onEdit: (request: AssetRequest) => void;
  /** Open the allocation drawer (admin, PENDING_ALLOCATION). */
  onAllocate: (request: AssetRequest) => void;
  /** Close the detail panel after an Approve/Reject decision. */
  onDecided?: () => void;
}

// Statuses where the creator may still revise the request (mirrors Leave amend).
const EDITABLE_STATUSES = ['PENDING_SUPERVISOR', 'PENDING_ADMIN'];
// Statuses where the creator may still withdraw the request.
const CANCELLABLE_STATUSES = ['DRAFT', 'PENDING_SUPERVISOR', 'PENDING_ADMIN', 'APPROVED', 'PENDING_ALLOCATION'];

export default function AssetRequestDetail({
  request,
  loading,
  isSupervisor,
  isAdmin,
  onActionComplete,
  onEdit,
  onAllocate,
  onDecided,
}: AssetRequestDetailProps) {
  const identity = useEmployeeIdentity();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // The creator owns the request. createAssetRequest stores employeeId as the
  // bare employeeCode, so match on that (defensively allow the composite too).
  const isOwner =
    !!identity.employeeCode &&
    (request.employeeId === identity.employeeCode ||
      request.employeeId === identity.employeeIdWithName ||
      (request.employeeId ?? '').startsWith(identity.employeeCode));

  const canEdit = isOwner && EDITABLE_STATUSES.includes(request.status);
  const canCancel = isOwner && CANCELLABLE_STATUSES.includes(request.status);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      message.warning('Please provide a reason for cancellation');
      return;
    }
    if (!identity.isReady) {
      message.error('Your employee profile is still loading — please try again in a moment');
      return;
    }
    setCancelling(true);
    try {
      await HrmAssetService.cancelAssetRequest(
        getOrganizationId(),
        request.requestId,
        identity.employeeCode,
        cancelReason.trim(),
      );
      message.success('Request cancelled');
      setCancelOpen(false);
      setCancelReason('');
      onActionComplete();
    } catch {
      message.error('Failed to cancel request');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div style={{ padding: 20, position: 'relative' }}>
      {loading && (
        <div style={{ position: 'absolute', top: 12, right: 16 }}>
          <Spin size="small" />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <Title level={5} style={{ margin: 0 }}>{request.categoryName}</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>{request.requestId}</Text>
        </div>
        <Space size={8} wrap style={{ justifyContent: 'flex-end' }}>
          <AssetRequestStatusBadge status={request.status} escalated={request.escalated} />
          {canEdit && (
            <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(request)}>
              Edit
            </Button>
          )}
          {canCancel && (
            <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => setCancelOpen(true)}>
              Cancel
            </Button>
          )}
        </Space>
      </div>

      {/* Cancellation summary — shown once the request has been withdrawn so
          the creator (and approvers) can see why/when/by-whom, like Leave. */}
      {request.status === 'CANCELLED' && (request.cancellationReason || request.cancelledByName || request.cancelledBy) && (
        <Alert
          type="error"
          showIcon
          style={{ marginTop: 12 }}
          message="Request cancelled"
          description={
            <div style={{ fontSize: 12 }}>
              {request.cancellationReason && <div>Reason: {request.cancellationReason}</div>}
              {(request.cancelledByName || request.cancelledBy) && (
                <div>
                  By: {request.cancelledByName || request.cancelledBy}
                  {request.cancelledAt ? ` · ${formatDateTime(request.cancelledAt)}` : ''}
                </div>
              )}
            </div>
          }
        />
      )}

      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
        Submitted: {formatDateTime(request.createdDateTime)}
      </Text>

      <Divider style={{ margin: '12px 0' }} />

      <Descriptions size="small" column={1} bordered>
        <Descriptions.Item label="Requester">
          {request.employeeName} ({request.employeeId})
        </Descriptions.Item>
        {request.requestType === 'RETURN' && (
          <Descriptions.Item label="Type">
            <Text strong style={{ color: '#fa8c16' }}>Asset Return</Text>
            {request.linkedAssetId ? ` · ${request.linkedAssetId}` : ''}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Category">{request.categoryName}</Descriptions.Item>
        <Descriptions.Item label="Quantity">{request.quantity}</Descriptions.Item>
        <Descriptions.Item label="Purpose">{request.purpose}</Descriptions.Item>
        {request.remarks && (
          <Descriptions.Item label="Remarks">{request.remarks}</Descriptions.Item>
        )}
        <Descriptions.Item label="Reporting Manager">
          {request.supervisorName
            ? `${request.supervisorName}${request.supervisorId ? ` (${request.supervisorId})` : ''}`
            : request.supervisorId || 'Not assigned'}
        </Descriptions.Item>
        {request.linkedAssetId && (
          <Descriptions.Item label="Allocated Asset">{request.linkedAssetId}</Descriptions.Item>
        )}
        {request.allocationDate && (
          <Descriptions.Item label="Allocation Date">{formatDate(request.allocationDate)}</Descriptions.Item>
        )}
        {request.allocatedBy && (
          <Descriptions.Item label="Allocated By">{request.allocatedBy}</Descriptions.Item>
        )}
      </Descriptions>

      <Divider style={{ margin: '12px 0' }} />
      <Title level={5}>Approval History</Title>
      <AssetActionHistoryTimeline actions={request.approvalHistory ?? []} />

      <Divider style={{ margin: '12px 0' }} />
      <Title level={5}>Actions</Title>
      <AssetRequestApprovalPanel
        request={request}
        isSupervisor={isSupervisor}
        isAdmin={isAdmin}
        onActionComplete={onActionComplete}
        onAllocate={onAllocate}
        onDecided={onDecided}
      />

      <Modal
        title="Cancel Asset Request"
        open={cancelOpen}
        onOk={handleCancel}
        onCancel={() => {
          setCancelOpen(false);
          setCancelReason('');
        }}
        okText="Confirm Cancellation"
        okButtonProps={{ danger: true, loading: cancelling }}
        destroyOnHidden
      >
        <Typography.Text>
          Withdraw this request from the approval workflow? This cannot be undone.
        </Typography.Text>
        <Input.TextArea
          rows={3}
          placeholder="Reason for cancellation (required)"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          maxLength={500}
          showCount
          style={{ marginTop: 12 }}
        />
      </Modal>
    </div>
  );
}

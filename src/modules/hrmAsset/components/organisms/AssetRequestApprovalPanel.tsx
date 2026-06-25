'use client';

import { useState } from 'react';
import { Button, Input, Modal, Popconfirm, Space, Typography, message } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  ArrowUpOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useEmployeeIdentity } from '../../../hrmAccess/hooks/useEmployeeIdentity';
import type { AssetRequest } from '../../types/domain.types';
import type { ApproveRejectAssetRequestPayload } from '../../types/api.types';

const { Text } = Typography;

interface AssetRequestApprovalPanelProps {
  request: AssetRequest;
  isSupervisor: boolean;
  isAdmin: boolean;
  /** Refresh queues + detail after a successful action. */
  onActionComplete: () => void;
  /** Open the allocation drawer for a PENDING_ALLOCATION request. */
  onAllocate: (request: AssetRequest) => void;
  /** Called after a successful Approve/Reject so the parent can close the panel. */
  onDecided?: () => void;
}

export default function AssetRequestApprovalPanel({
  request,
  isSupervisor,
  isAdmin,
  onActionComplete,
  onAllocate,
  onDecided,
}: AssetRequestApprovalPanelProps) {
  const identity = useEmployeeIdentity();
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  const status = request.status;
  const isSupervisorStage = status === 'PENDING_SUPERVISOR';
  const isAdminStage = status === 'PENDING_ADMIN';
  const isAllocationStage = status === 'PENDING_ALLOCATION';

  // Who can act at each stage: supervisor-tier (or admin) on the supervisor
  // stage; admin-only on the admin + allocation stages. Mirrors the queue
  // visibility rules in the approval inbox.
  const canActOnStage =
    (isSupervisorStage && (isSupervisor || isAdmin)) || (isAdminStage && isAdmin);

  const actorRole = isSupervisorStage ? 'SUPERVISOR' : 'ADMIN';
  const approveAction: ApproveRejectAssetRequestPayload['action'] = isSupervisorStage
    ? 'APPROVE_SUPERVISOR'
    : 'APPROVE_ADMIN';
  const rejectAction: ApproveRejectAssetRequestPayload['action'] = isSupervisorStage
    ? 'REJECT_SUPERVISOR'
    : 'REJECT_ADMIN';

  const ensureIdentity = (): boolean => {
    if (!identity.employeeCode) {
      message.error('Your employee profile is still loading — please try again in a moment');
      return false;
    }
    return true;
  };

  const runAction = async (
    fn: () => Promise<unknown>,
    success: string,
    failure: string,
  ): Promise<boolean> => {
    if (!ensureIdentity()) return false;
    setLoading(true);
    try {
      await fn();
      message.success(success);
      onActionComplete();
      return true;
    } catch {
      message.error(failure);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    const ok = await runAction(
      () =>
        HrmAssetService.approveOrRejectRequest({
          organizationId: getOrganizationId(),
          requestId: request.requestId,
          action: approveAction,
          actorEmployeeId: identity.employeeCode,
          actorName: identity.fullName,
          actorRole,
        }),
      'Request approved',
      'Approval failed',
    );
    // Close the detail panel once the decision is made (item: after approve/
    // reject the right panel should close).
    if (ok) onDecided?.();
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    const ok = await runAction(
      () =>
        HrmAssetService.approveOrRejectRequest({
          organizationId: getOrganizationId(),
          requestId: request.requestId,
          action: rejectAction,
          actorEmployeeId: identity.employeeCode,
          actorName: identity.fullName,
          actorRole,
          remarks: rejectReason.trim(),
        }),
      'Request rejected',
      'Rejection failed',
    );
    setRejectVisible(false);
    setRejectReason('');
    if (ok) onDecided?.();
  };

  const handleMoveNext = () =>
    runAction(
      () =>
        HrmAssetService.moveToNextSupervisor({
          organizationId: getOrganizationId(),
          requestId: request.requestId,
          actorEmployeeId: identity.employeeCode,
          actorName: identity.fullName,
          actorRole,
        }),
      'Request forwarded to the next supervisor',
      'Failed to forward request',
    );

  // Allocation stage — only an Allocate action (opens the drawer). Admin tier
  // (asset_all_approval) only.
  if (isAllocationStage) {
    if (!isAdmin) {
      return (
        <div style={{ padding: '12px 0' }}>
          <Text type="secondary">This request is pending allocation by an administrator.</Text>
        </div>
      );
    }
    return (
      <div style={{ padding: '12px 0' }}>
        <Button type="primary" icon={<InboxOutlined />} onClick={() => onAllocate(request)}>
          Allocate Asset
        </Button>
      </div>
    );
  }

  if (!canActOnStage) {
    return (
      <div style={{ padding: '12px 0' }}>
        <Text type="secondary">
          This request is {status.toLowerCase().replace(/_/g, ' ')} — no action required from you.
        </Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 0' }}>
      <Space wrap>
        <Button type="primary" icon={<CheckOutlined />} loading={loading} onClick={handleApprove}>
          Approve
        </Button>

        <Button danger icon={<CloseOutlined />} onClick={() => setRejectVisible(true)}>
          Reject with Reason
        </Button>

        {/* Move to Next Supervisor — forward up the chain. */}
        <Popconfirm
          title="Move to Next Supervisor"
          description="Forward this request to the next-level supervisor for approval?"
          okText="Forward"
          cancelText="Cancel"
          onConfirm={handleMoveNext}
        >
          <Button icon={<ArrowUpOutlined />} loading={loading}>
            Move to Next Supervisor
          </Button>
        </Popconfirm>
      </Space>

      <Modal
        title="Reject Asset Request"
        open={rejectVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectVisible(false);
          setRejectReason('');
        }}
        okText="Reject"
        okButtonProps={{ danger: true, disabled: !rejectReason.trim(), loading }}
        destroyOnHidden
      >
        <Input.TextArea
          rows={4}
          placeholder="Enter rejection reason (mandatory)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}

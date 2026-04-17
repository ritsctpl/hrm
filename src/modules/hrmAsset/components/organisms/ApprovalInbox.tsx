'use client';

import { Tabs, Empty, Spin, Descriptions, Timeline, Typography, message } from 'antd';
import { parseCookies } from 'nookies';
import ApprovalActionBar from '../molecules/ApprovalActionBar';
import AssetRequestStatusBadge from '../atoms/AssetRequestStatusBadge';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { formatDate, formatDateTime } from '../../utils/assetHelpers';
import { APPROVAL_TABS } from '../../utils/assetConstants';
import type { AssetRequest } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/AssetList.module.css';

interface ApprovalInboxProps {
  isSupervisor: boolean;
  isAdmin: boolean;
  loading: boolean;
}

export default function ApprovalInbox({ isSupervisor, isAdmin, loading }: ApprovalInboxProps) {
  const {
    pendingSupervisorRequests,
    pendingAdminRequests,
    pendingAllocationRequests,
    setPendingSupervisorRequests,
    setPendingAdminRequests,
    openAllocationPanel,
    setSelectedRequest,
    approvingRequest,
    setApprovingRequest,
  } = useHrmAssetStore();

  const handleApproveSupervisor = async (requestId: string, remarks: string) => {
    const { organizationId, userId, employeeName } = parseCookies();
    setApprovingRequest(true);
    try {
      await HrmAssetService.approveOrRejectRequest({
        organizationId: organizationId ?? '',
        requestId,
        action: 'APPROVE_SUPERVISOR',
        actorEmployeeId: userId ?? '',
        actorName: employeeName ?? '',
        actorRole: 'SUPERVISOR',
        remarks,
      });
      setPendingSupervisorRequests(pendingSupervisorRequests.filter((r) => r.requestId !== requestId));
      message.success('Request approved');
    } catch {
      message.error('Approval failed');
    } finally {
      setApprovingRequest(false);
    }
  };

  const handleRejectSupervisor = async (requestId: string, remarks: string) => {
    const { organizationId, userId, employeeName } = parseCookies();
    setApprovingRequest(true);
    try {
      await HrmAssetService.approveOrRejectRequest({
        organizationId: organizationId ?? '',
        requestId,
        action: 'REJECT_SUPERVISOR',
        actorEmployeeId: userId ?? '',
        actorName: employeeName ?? '',
        actorRole: 'SUPERVISOR',
        remarks,
      });
      setPendingSupervisorRequests(pendingSupervisorRequests.filter((r) => r.requestId !== requestId));
      message.success('Request rejected');
    } catch {
      message.error('Rejection failed');
    } finally {
      setApprovingRequest(false);
    }
  };

  const handleApproveAdmin = async (requestId: string, remarks: string) => {
    const { organizationId, userId, employeeName } = parseCookies();
    setApprovingRequest(true);
    try {
      await HrmAssetService.approveOrRejectRequest({
        organizationId: organizationId ?? '',
        requestId,
        action: 'APPROVE_ADMIN',
        actorEmployeeId: userId ?? '',
        actorName: employeeName ?? '',
        actorRole: 'ADMIN',
        remarks,
      });
      setPendingAdminRequests(pendingAdminRequests.filter((r) => r.requestId !== requestId));
      message.success('Request approved');
    } catch {
      message.error('Approval failed');
    } finally {
      setApprovingRequest(false);
    }
  };

  const handleRejectAdmin = async (requestId: string, remarks: string) => {
    const { organizationId, userId, employeeName } = parseCookies();
    setApprovingRequest(true);
    try {
      await HrmAssetService.approveOrRejectRequest({
        organizationId: organizationId ?? '',
        requestId,
        action: 'REJECT_ADMIN',
        actorEmployeeId: userId ?? '',
        actorName: employeeName ?? '',
        actorRole: 'ADMIN',
        remarks,
      });
      setPendingAdminRequests(pendingAdminRequests.filter((r) => r.requestId !== requestId));
      message.success('Request rejected');
    } catch {
      message.error('Rejection failed');
    } finally {
      setApprovingRequest(false);
    }
  };

  const handleAllocate = (req: AssetRequest) => {
    setSelectedRequest(req);
    openAllocationPanel();
  };

  const renderRequestCard = (
    req: AssetRequest,
    onApprove: (id: string, remarks: string) => Promise<void>,
    onReject: (id: string, remarks: string) => Promise<void>,
    showAllocate?: boolean
  ) => (
    <div key={req.requestId} className={styles.approvalCard}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Typography.Text strong>{req.requestId}</Typography.Text>
        <AssetRequestStatusBadge status={req.status} escalated={req.escalated} />
      </div>
      <Descriptions size="small" column={2} style={{ marginBottom: 8 }}>
        <Descriptions.Item label="Requester">{req.employeeName} ({req.employeeId})</Descriptions.Item>
        <Descriptions.Item label="Category">{req.categoryName}</Descriptions.Item>
        <Descriptions.Item label="Qty">{req.quantity}</Descriptions.Item>
        <Descriptions.Item label="Submitted">{formatDate(req.createdDateTime)}</Descriptions.Item>
        <Descriptions.Item label="Purpose" span={2}>{req.purpose}</Descriptions.Item>
      </Descriptions>

      {req.approvalHistory?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Approval Trail</Typography.Text>
          <Timeline
            style={{ marginTop: 4 }}
            items={(req.approvalHistory ?? []).map((a) => ({
              children: (
                <Typography.Text style={{ fontSize: 11 }}>
                  {a.actorName} ({a.actorRole}) — {a.action} — {formatDateTime(a.actionAt)}
                  {a.remarks && <span style={{ color: '#8c8c8c' }}> · {a.remarks}</span>}
                </Typography.Text>
              ),
            }))}
          />
        </div>
      )}

      {showAllocate ? (
        <div>
          <ApprovalActionBar request={req} onApprove={onApprove} onReject={onReject} />
        </div>
      ) : (
        <ApprovalActionBar request={req} onApprove={onApprove} onReject={onReject} />
      )}
    </div>
  );

  if (loading) {
    return <div className={styles.spinWrapper}><Spin /></div>;
  }

  const tabItems = [
    ...(isSupervisor ? [{
      key: 'supervisor',
      label: `Pending Supervisor (${pendingSupervisorRequests.length})`,
      children: (
        <div>
          {pendingSupervisorRequests.length === 0 ? (
            <Empty description="No pending supervisor approvals" style={{ marginTop: 32 }} />
          ) : (
            pendingSupervisorRequests.map((req) =>
              renderRequestCard(req, handleApproveSupervisor, handleRejectSupervisor)
            )
          )}
        </div>
      ),
    }] : []),
    ...(isAdmin ? [{
      key: 'admin',
      label: `Pending Admin (${pendingAdminRequests.length})`,
      children: (
        <div>
          {pendingAdminRequests.length === 0 ? (
            <Empty description="No pending admin approvals" style={{ marginTop: 32 }} />
          ) : (
            pendingAdminRequests.map((req) =>
              renderRequestCard(req, handleApproveAdmin, handleRejectAdmin)
            )
          )}
        </div>
      ),
    }] : []),
    ...(isAdmin ? [{
      key: 'allocation',
      label: `Pending Allocation (${pendingAllocationRequests.length})`,
      children: (
        <div>
          {pendingAllocationRequests.length === 0 ? (
            <Empty description="No requests pending allocation" style={{ marginTop: 32 }} />
          ) : (
            pendingAllocationRequests.map((req) => (
              <div key={req.requestId} className={styles.approvalCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Typography.Text strong>{req.requestId}</Typography.Text>
                  <AssetRequestStatusBadge status={req.status} escalated={req.escalated} />
                </div>
                <Descriptions size="small" column={2}>
                  <Descriptions.Item label="Requester">{req.employeeName}</Descriptions.Item>
                  <Descriptions.Item label="Category">{req.categoryName}</Descriptions.Item>
                  <Descriptions.Item label="Purpose" span={2}>{req.purpose}</Descriptions.Item>
                </Descriptions>
                <div style={{ marginTop: 8 }}>
                  <Can I="edit">
                    <button
                      style={{
                        background: '#1890ff', color: '#fff', border: 'none',
                        padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12,
                      }}
                      onClick={() => handleAllocate(req)}
                    >
                      Allocate Asset
                    </button>
                  </Can>
                </div>
              </div>
            ))
          )}
        </div>
      ),
    }] : []),
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <Tabs items={tabItems} size="small" />
    </div>
  );
}

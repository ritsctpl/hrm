"use client";

import React, { useState } from "react";
import { Button, Input, Modal, Popconfirm, Space, Typography } from "antd";
import { CheckOutlined, CloseOutlined, ArrowUpOutlined, SwapOutlined } from "@ant-design/icons";
import { LeavePermissions } from "../../types/ui.types";
import { LeaveRequest } from "../../types/domain.types";
import { useCurrentEmployeeStore } from "../../../hrmAccess/stores/currentEmployeeStore";
import { useEmployeeOptions } from "../../hooks/useEmployeeOptions";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

interface LeaveRequestApprovalPanelProps {
  request: LeaveRequest;
  permissions: LeavePermissions;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onEscalate?: () => void;
  onReassign?: (newApproverId: string) => void;
  onOverride?: (approved: boolean, remarks: string) => void;
  loading?: boolean;
}

const LeaveRequestApprovalPanel: React.FC<LeaveRequestApprovalPanelProps> = ({
  request,
  permissions,
  onApprove,
  onReject,
  onEscalate,
  onReassign,
  onOverride,
  loading,
}) => {
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Resolve the current supervisor's own reporting manager for "Forward to My Manager"
  const currentEmployee = useCurrentEmployeeStore(s => s.data);
  const { employees } = useEmployeeOptions();
  const myManagerHandle = (() => {
    if (!currentEmployee?.handle || !employees.length) return null;
    // Find current user in directory to get their reportingManager
    const me = employees.find(e => e.handle === currentEmployee.handle);
    return me?.reportingManager ?? null;
  })();
  const myManagerName = (() => {
    if (!myManagerHandle) return null;
    const mgr = employees.find(e => e.handle === myManagerHandle);
    return mgr ? `${mgr.fullName} (${mgr.employeeCode})` : null;
  })();

  const isPending =
    request.status === "PENDING_SUPERVISOR" ||
    request.status === "PENDING_NEXT_SUPERIOR" ||
    request.status === "PENDING_HR";

  if (!isPending) {
    return (
      <div className={styles.approvalPanel}>
        <Text type="secondary">
          This request is {request.status.toLowerCase().replace(/_/g, " ")} — no action required.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.approvalPanel}>
      <Space wrap>
        {permissions.canApprove && onApprove && (
          <Can I="edit" object="leave_approval" passIf={true}>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={onApprove}
              loading={loading}
            >
              Approve
            </Button>
          </Can>
        )}

        {permissions.canReject && onReject && (
          <Can I="edit" object="leave_approval" passIf={true}>
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => setRejectVisible(true)}
            >
              Reject with Reason
            </Button>
          </Can>
        )}

        {/* Forward to my manager — supervisor can push request up the chain */}
        {onReassign && myManagerHandle && (
          <Can I="edit" object="leave_approval" passIf={true}>
            <Popconfirm
              title="Forward to Your Manager"
              description={`This request will be forwarded to ${myManagerName || 'your reporting manager'} for approval. Continue?`}
              onConfirm={() => onReassign(myManagerHandle)}
              okText="Forward"
              cancelText="Cancel"
            >
              <Button icon={<ArrowUpOutlined />} loading={loading}>
                Forward to My Manager
                {myManagerName && (
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                    ({myManagerName})
                  </Text>
                )}
              </Button>
            </Popconfirm>
          </Can>
        )}

        {/* HR-only: Escalate (auto-route to next level) */}
        {permissions.canEscalate && onEscalate && (
          <Can I="edit" object="leave_approval" passIf={true}>
            <Button onClick={onEscalate}>Escalate</Button>
          </Can>
        )}

        {permissions.canOverride && onOverride && (
          <Can I="edit" object="leave_approval" passIf={true}>
            <>
              <Button
                type="dashed"
                onClick={() => onOverride(true, "HR Override Approve")}
              >
                Override Approve
              </Button>
              <Button
                type="dashed"
                danger
                onClick={() => onOverride(false, "HR Override Reject")}
              >
                Override Reject
              </Button>
            </>
          </Can>
        )}
      </Space>

      <Modal
        title="Reject Leave Request"
        open={rejectVisible}
        onOk={() => {
          if (rejectReason.trim()) {
            onReject(rejectReason.trim());
            setRejectVisible(false);
            setRejectReason("");
          }
        }}
        onCancel={() => {
          setRejectVisible(false);
          setRejectReason("");
        }}
        okText="Reject"
        okButtonProps={{ danger: true, disabled: !rejectReason.trim() }}
      >
        <Input.TextArea
          rows={4}
          placeholder="Enter rejection reason (mandatory)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      {/* Reassign modal removed — replaced by "Forward to My Manager" Popconfirm above */}
    </div>
  );
};

export default LeaveRequestApprovalPanel;

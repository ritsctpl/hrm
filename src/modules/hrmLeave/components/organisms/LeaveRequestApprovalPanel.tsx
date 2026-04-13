"use client";

import React, { useState } from "react";
import { Button, Input, Modal, Space, Typography } from "antd";
import { CheckOutlined, CloseOutlined, SwapOutlined } from "@ant-design/icons";
import { LeavePermissions } from "../../types/ui.types";
import { LeaveRequest } from "../../types/domain.types";
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
  const [reassignVisible, setReassignVisible] = useState(false);
  const [reassignId, setReassignId] = useState("");

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
        {permissions.canApprove && (
          <Can I="edit" object="leave_approval">
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

        {permissions.canReject && (
          <Can I="edit" object="leave_approval">
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => setRejectVisible(true)}
            >
              Reject with Reason
            </Button>
          </Can>
        )}

        {permissions.canEscalate && onEscalate && (
          <Can I="edit" object="leave_approval">
            <Button onClick={onEscalate}>Escalate</Button>
          </Can>
        )}

        {permissions.canReassign && onReassign && (
          <Can I="edit" object="leave_approval">
            <Button icon={<SwapOutlined />} onClick={() => setReassignVisible(true)}>
              Reassign
            </Button>
          </Can>
        )}

        {permissions.canOverride && onOverride && (
          <Can I="edit" object="leave_approval">
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

      <Modal
        title="Reassign Approver"
        open={reassignVisible}
        onOk={() => {
          if (reassignId.trim() && onReassign) {
            onReassign(reassignId.trim());
            setReassignVisible(false);
            setReassignId("");
          }
        }}
        onCancel={() => {
          setReassignVisible(false);
          setReassignId("");
        }}
        okText="Reassign"
        okButtonProps={{ disabled: !reassignId.trim() }}
      >
        <Input
          placeholder="Enter new approver employee ID"
          value={reassignId}
          onChange={(e) => setReassignId(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default LeaveRequestApprovalPanel;

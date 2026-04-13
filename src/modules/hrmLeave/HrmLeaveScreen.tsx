"use client";

import React from "react";
import { Button, message } from "antd";
import { parseCookies } from "nookies";
import LeaveRequestDetail from "./components/organisms/LeaveRequestDetail";
import LeaveRequestApprovalPanel from "./components/organisms/LeaveRequestApprovalPanel";
import Can from "../hrmAccess/components/Can";
import { useHrmLeaveStore } from "./stores/hrmLeaveStore";
import { HrmLeaveService } from "./services/hrmLeaveService";
import { LeaveRequest } from "./types/domain.types";
import { LeavePermissions } from "./types/ui.types";
import styles from "./styles/HrmLeave.module.css";

interface HrmLeaveScreenProps {
  request: LeaveRequest;
  site: string;
  permissions: LeavePermissions;
  onActionComplete: () => void;
}

const HrmLeaveScreen: React.FC<HrmLeaveScreenProps> = ({
  request,
  site,
  permissions,
  onActionComplete,
}) => {
  const cookies = parseCookies();
  const actorId = cookies.userId ?? "";
  const actorRole = cookies.userRole ?? "";

  const [loading, setLoading] = React.useState(false);
  const { removeFromPending, updateGlobalQueueRequest, updateMyRequest } = useHrmLeaveStore();

  const handleApprove = async () => {
    setLoading(true);
    try {
      await HrmLeaveService.approveRequest({
        site,
        requestId: request.handle,
        actorId,
        actorRole,
      });
      removeFromPending(request.handle);
      updateGlobalQueueRequest(request.handle, { status: "APPROVED" });
      message.success("Leave request approved");
      onActionComplete();
    } catch {
      message.error("Failed to approve request");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (remarks: string) => {
    setLoading(true);
    try {
      await HrmLeaveService.rejectRequest({
        site,
        requestId: request.handle,
        actorId,
        actorRole,
        remarks,
      });
      removeFromPending(request.handle);
      updateGlobalQueueRequest(request.handle, { status: "REJECTED" });
      message.success("Leave request rejected");
      onActionComplete();
    } catch {
      message.error("Failed to reject request");
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    setLoading(true);
    try {
      await HrmLeaveService.escalateRequest({ site, requestId: request.handle });
      updateGlobalQueueRequest(request.handle, { status: "ESCALATED" });
      message.success("Request escalated");
      onActionComplete();
    } catch {
      message.error("Failed to escalate request");
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (newApproverId: string) => {
    setLoading(true);
    try {
      await HrmLeaveService.reassignRequest({
        site,
        requestId: request.handle,
        actorId,
        actorRole,
        reassignToId: newApproverId,
      });
      message.success("Request reassigned");
      onActionComplete();
    } catch {
      message.error("Failed to reassign request");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await HrmLeaveService.cancelLeaveRequest({
        site,
        requestId: request.handle,
        reason: "Cancelled by employee",
        cancelledBy: actorId,
      });
      updateMyRequest(request.handle, { status: "CANCELLED" });
      message.success("Leave request cancelled");
      onActionComplete();
    } catch {
      message.error("Failed to cancel request");
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (approved: boolean, remarks: string) => {
    setLoading(true);
    try {
      await HrmLeaveService.overrideRequest({
        site,
        requestId: request.handle,
        actorId,
        actorRole,
        remarks,
        approved,
      });
      updateGlobalQueueRequest(request.handle, {
        status: approved ? "APPROVED" : "REJECTED",
      });
      message.success(`Request ${approved ? "approved" : "rejected"} via override`);
      onActionComplete();
    } catch {
      message.error("Failed to override request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      <LeaveRequestDetail
        request={request}
        site={site}
        permissions={permissions}
        onApproved={onActionComplete}
        onRejected={onActionComplete}
        onCancelled={onActionComplete}
      />

      <LeaveRequestApprovalPanel
        request={request}
        permissions={permissions}
        onApprove={handleApprove}
        onReject={handleReject}
        onEscalate={permissions.canEscalate ? handleEscalate : undefined}
        onReassign={permissions.canReassign ? handleReassign : undefined}
        onOverride={permissions.canOverride ? handleOverride : undefined}
        loading={loading}
      />

      {permissions.canCancel &&
        request.status === "PENDING_SUPERVISOR" &&
        request.createdBy === actorId && (
          <div style={{ padding: "12px 0" }}>
            <Can I="delete" object="leave_request">
              <Button
                danger
                size="small"
                onClick={handleCancel}
                loading={loading}
              >
                Cancel Request
              </Button>
            </Can>
          </div>
        )}
    </div>
  );
};

export default HrmLeaveScreen;

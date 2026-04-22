"use client";

import React from "react";
import { Button, message, Tooltip } from "antd";
import dayjs from "dayjs";
import { parseCookies } from "nookies";
import { getOrganizationId } from "@/utils/cookieUtils";
import LeaveRequestDetail from "./components/organisms/LeaveRequestDetail";
import LeaveRequestApprovalPanel from "./components/organisms/LeaveRequestApprovalPanel";
import Can from "../hrmAccess/components/Can";
import { useHrmLeaveStore } from "./stores/hrmLeaveStore";
import { HrmLeaveService } from "./services/hrmLeaveService";
import { LeaveRequest } from "./types/domain.types";
import { LeaveApprovalConfig } from "./types/api.types";
import { LeavePermissions } from "./types/ui.types";
import { useCurrentEmployeeStore } from "../hrmAccess/stores/currentEmployeeStore";
import { HR_ROLES } from "./utils/constants";
import styles from "./styles/HrmLeave.module.css";

interface HrmLeaveScreenProps {
  request: LeaveRequest;
  organizationId: string;
  permissions: LeavePermissions;
  onActionComplete: () => void;
}

const HrmLeaveScreen: React.FC<HrmLeaveScreenProps> = ({
  request,
  organizationId,
  permissions,
  onActionComplete,
}) => {
  const cookies = parseCookies();
  const actorId = cookies.userId ?? "";
  const actorRole = (cookies.userRole ?? "").toUpperCase();
  const isHr = HR_ROLES.includes(actorRole);

  // Resolve the logged-in user's employee handle to check if they're the
  // actual current approver. HR can see all requests in Global Queue but
  // can only Approve/Reject if they ARE the currentApprover. Otherwise
  // they must use Override.
  const currentEmployee = useCurrentEmployeeStore(s => s.data);
  const myHandle = currentEmployee?.handle ?? "";
  const isCurrentApprover = Boolean(
    request.currentApproverId &&
    myHandle &&
    (request.currentApproverId === myHandle ||
     request.currentApproverId.endsWith(myHandle)),
  );

  const [loading, setLoading] = React.useState(false);
  const [approvalConfig, setApprovalConfig] = React.useState<LeaveApprovalConfig | null>(null);
  const { removeFromPending, updateGlobalQueueRequest, updateMyRequest } = useHrmLeaveStore();

  // Fetch approval config once on mount to read cancellationWindowHours
  React.useEffect(() => {
    const orgId = organizationId || getOrganizationId();
    if (!orgId) return;
    HrmLeaveService.getApprovalConfig({ organizationId: orgId })
      .then((cfg) => setApprovalConfig(cfg))
      .catch(() => { /* fallback to default 24h window */ });
  }, [organizationId]);

  // ── Cancellation window check ────────────────────────────────────
  const cancellationWindowHours = approvalConfig?.cancellationWindowHours ?? 24;

  const isCancelBlocked = (() => {
    if (!request || request.status !== "APPROVED") return false;
    if (isHr) return false; // HR can always cancel
    const leaveStart = dayjs(request.startDate).startOf("day");
    const hoursUntilLeave = leaveStart.diff(dayjs(), "hour");
    return hoursUntilLeave < cancellationWindowHours;
  })();

  const handleApprove = async () => {
    setLoading(true);
    try {
      await HrmLeaveService.approveRequest({ organizationId,
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
      await HrmLeaveService.rejectRequest({ organizationId,
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
      await HrmLeaveService.escalateRequest({ organizationId, requestId: request.handle });
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
      await HrmLeaveService.reassignRequest({ organizationId,
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
      await HrmLeaveService.cancelLeaveRequest({ organizationId,
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
      await HrmLeaveService.overrideRequest({ organizationId,
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
        organizationId={organizationId}
        permissions={permissions}
        onApproved={onActionComplete}
        onRejected={onActionComplete}
        onCancelled={onActionComplete}
      />

      <LeaveRequestApprovalPanel
        request={request}
        permissions={permissions}
        onApprove={isCurrentApprover ? handleApprove : undefined}
        onReject={isCurrentApprover ? handleReject : undefined}
        onEscalate={isCurrentApprover && permissions.canEscalate ? handleEscalate : undefined}
        onReassign={isCurrentApprover ? handleReassign : undefined}
        onOverride={permissions.canOverride ? handleOverride : undefined}
        loading={loading}
      />

      {permissions.canCancel &&
        (request.status === "PENDING_SUPERVISOR" || request.status === "APPROVED") &&
        (request.createdBy === actorId || isHr) && (
          <div style={{ padding: "12px 0" }}>
            <Can I="delete" object="leave_request" passIf={true}>
              <Tooltip
                title={
                  isCancelBlocked
                    ? `Cancellation not allowed within ${cancellationWindowHours} hours of leave start`
                    : undefined
                }
              >
                <span>
                  <Button
                    danger
                    size="small"
                    onClick={handleCancel}
                    loading={loading}
                    disabled={isCancelBlocked}
                  >
                    Cancel Request
                  </Button>
                </span>
              </Tooltip>
            </Can>
          </div>
        )}
    </div>
  );
};

export default HrmLeaveScreen;

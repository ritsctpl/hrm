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
import { useEmployeeIdentity } from "../hrmAccess/hooks/useEmployeeIdentity";
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
  const identity = useEmployeeIdentity();
  // Leave service expects composite "EMP0012 - John Doe" in actor/cancelled-by
  // fields. Falls back to the login cookie while identity hasn't resolved
  // — callers should avoid triggering actions in that window but this keeps
  // the UI responsive instead of crashing.
  const actorId = identity.employeeIdWithName || cookies.userId || "";
  const actorRole = (cookies.userRole ?? "").toUpperCase();
  const isHr = HR_ROLES.includes(actorRole);

  // Check whether the logged-in user is the named current approver. HR
  // can see every request in the Global Queue, but only the named
  // approver can use the regular Approve / Reject path — others must
  // use Override.
  //
  // currentApproverId is the composite "EMP-3 - suresh s", optionally
  // role-prefixed (e.g. "SUPERVISOR_EMP-3 - suresh s"). Strip the
  // prefix and match against the user's composite or bare code.
  const myCode = identity.employeeCode;
  const myComposite = identity.employeeIdWithName;

  const isCurrentApprover = (() => {
    const raw = request.currentApproverId;
    if (!raw) return false;
    const stripped = raw.includes("_") ? raw.substring(raw.indexOf("_") + 1) : raw;
    const candidateCode = stripped.includes(" - ")
      ? stripped.split(" - ")[0]?.trim() ?? stripped
      : stripped;
    return Boolean(
      (myComposite && stripped === myComposite) ||
      (myCode && candidateCode === myCode),
    );
  })();

  // Self-approval guard. When an employee is configured as their own
  // reporting manager (e.g., a one-person team or a workflow misconfig),
  // the backend may route the request to themselves. The UI must refuse
  // to surface Approve / Reject for that case — otherwise the requester
  // can rubber-stamp their own leave. Match the requester against every
  // form of "self" we know about (composite, plain code, UUID handle)
  // so a mismatch in storage shape can't sneak through.
  const isSelfRequest = (() => {
    if (!request?.employeeId) return false;
    const requesterRaw = request.employeeId;
    const requesterCode = requesterRaw.includes(" - ")
      ? requesterRaw.split(" - ")[0]?.trim() ?? requesterRaw
      : requesterRaw;
    const myIdentities = [
      myComposite,
      myCode,
      identity.handle,
      cookies.userId,
      cookies.employeeCode,
    ].filter((v): v is string => typeof v === "string" && v.length > 0);
    return myIdentities.some(
      (mine) => mine === requesterRaw || mine === requesterCode,
    );
  })();

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
    // Defence in depth: even if the buttons are hidden, refuse to call
    // /approve when the actor IS the requester. Stops anyone driving the
    // store directly or pasting a curl from the network tab.
    if (isSelfRequest) {
      message.error("You cannot approve your own leave request. Please ask another approver.");
      return;
    }
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
    if (isSelfRequest) {
      message.error("You cannot reject your own leave request.");
      return;
    }
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

      {/* Self-approval guard: when the signed-in user is the requester,
          the regular approve/reject path is forbidden. Show a clear
          banner + leave only Escalate / Reassign available so the
          request can still move to a valid approver. canOverride
          (HR-only) is also withheld here — HR users acting on their
          OWN request should not be able to self-override. */}
      {isSelfRequest && isCurrentApprover && (
        <div
          style={{
            padding: "8px 12px",
            background: "#fff7e6",
            border: "1px solid #ffd591",
            borderRadius: 6,
            margin: "8px 0",
            color: "#874d00",
            fontSize: 13,
          }}
        >
          You are the named approver for your own leave request. Self-approval is not allowed —
          please <strong>Reassign</strong> or <strong>Escalate</strong> to another approver.
        </div>
      )}

      <LeaveRequestApprovalPanel
        request={request}
        permissions={permissions}
        onApprove={isCurrentApprover && !isSelfRequest ? handleApprove : undefined}
        onReject={isCurrentApprover && !isSelfRequest ? handleReject : undefined}
        onEscalate={isCurrentApprover && permissions.canEscalate ? handleEscalate : undefined}
        onReassign={isCurrentApprover ? handleReassign : undefined}
        onOverride={permissions.canOverride && !isSelfRequest ? handleOverride : undefined}
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

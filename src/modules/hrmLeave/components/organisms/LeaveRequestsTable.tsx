"use client";

import React, { useMemo, useState } from "react";
import { Empty, Select, Spin, Typography, message } from "antd";
import { getOrganizationId } from '@/utils/cookieUtils';
import LeaveRequestRow from "../molecules/LeaveRequestRow";
import AmendLeavePanel from "./AmendLeavePanel";
import { LeaveRequestsTableProps } from "../../types/ui.types";
import { LeaveRequest } from "../../types/domain.types";
import { buildYearOptions } from "../../utils/transformations";
import { LEAVE_STATUS_LABELS } from "../../utils/constants";
import { useHrmLeaveStore } from "../../stores/hrmLeaveStore";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

const statusFilterOptions = Object.entries(LEAVE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const LeaveRequestsTable: React.FC<LeaveRequestsTableProps> = ({
  requests,
  loading,
  selectedHandle,
  onRowClick,
  onRequestDeleted,
}) => {
  const organizationId = getOrganizationId();
  const identity = useEmployeeIdentity();
  const openLeaveFormForEdit = useHrmLeaveStore((s) => s.openLeaveFormForEdit);
  const updateMyRequest = useHrmLeaveStore((s) => s.updateMyRequest);
  const setSelectedRequest = useHrmLeaveStore((s) => s.setSelectedRequest);

  const [amendOpen, setAmendOpen] = useState(false);
  const [amendTarget, setAmendTarget] = useState<LeaveRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleAmend = (request: LeaveRequest) => {
    setAmendTarget(request);
    setAmendOpen(true);
  };

  const handleEditDraft = (request: LeaveRequest) => {
    openLeaveFormForEdit(request);
  };

  const handleDelete = async (request: LeaveRequest) => {
    if (!identity.employeeIdWithName) {
      message.error("Employee identity not resolved. Please try again.");
      return;
    }

    setDeleting(request.handle);
    try {
      await HrmLeaveService.deleteLeaveRequest({
        organizationId,
        requestId: request.handle,
        employeeId: identity.employeeIdWithName,
        reason: `Deleted by employee: ${request.status} leave request`,
      });
      
      message.success("Leave request deleted successfully");
      onRequestDeleted?.();
    } catch (err: unknown) {
      const apiError = err as { 
        response?: { 
          data?: { 
            message_details?: { error?: string; msg?: string }; 
            message?: string 
          } 
        }; 
        message?: string 
      };
      const backendMsg =
        apiError?.response?.data?.message_details?.error ||
        apiError?.response?.data?.message_details?.msg ||
        apiError?.response?.data?.message ||
        (err instanceof Error ? err.message : null) ||
        "Failed to delete leave request";
      message.error(backendMsg);
    } finally {
      setDeleting(null);
    }
  };

  const handleAmendClose = () => {
    setAmendOpen(false);
    setAmendTarget(null);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter && req.status !== statusFilter) return false;
      const reqYear = new Date(req.startDate).getFullYear();
      if (yearFilter && reqYear !== yearFilter) return false;
      return true;
    });
  }, [requests, statusFilter, yearFilter]);

  if (loading) {
    return (
      <div className={styles.panelLoading}>
        <Spin tip="Loading requests..." />
      </div>
    );
  }

  return (
    <div className={styles.requestsList}>
      <div className={styles.requestsListHeader}>
        <Text strong>My Leave Requests ({filteredRequests.length})</Text>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "8px 12px", borderBottom: "1px solid #f0f0f0" }}>
        <Select
          placeholder="Status"
          allowClear
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          options={statusFilterOptions}
          style={{ width: 170 }}
          size="small"
        />
        <Select
          value={yearFilter}
          onChange={(val) => setYearFilter(val)}
          options={buildYearOptions(new Date().getFullYear())}
          style={{ width: 90 }}
          size="small"
        />
      </div>
      {filteredRequests.length === 0 ? (
        <div className={styles.panelEmpty}>
          <Empty description="No leave requests found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        filteredRequests.map((req) => (
          <LeaveRequestRow
            key={req.handle}
            request={req}
            isSelected={req.handle === selectedHandle}
            onClick={onRowClick}
            onAmend={handleAmend}
            onEditDraft={handleEditDraft}
            onDelete={handleDelete}
          />
        ))
      )}
      <AmendLeavePanel
        open={amendOpen}
        organizationId={organizationId}
        request={amendTarget}
        onClose={handleAmendClose}
        onAmended={(updated) => {
          // Reflect the amended values immediately in the list + right panel,
          // then ask the parent to re-fetch authoritative data so nothing
          // goes stale.
          updateMyRequest(updated.handle, updated);
          setSelectedRequest(updated);
          onRequestDeleted?.();
          handleAmendClose();
        }}
      />
    </div>
  );
};

export default LeaveRequestsTable;

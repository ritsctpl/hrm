"use client";

import React, { useState } from "react";
import { Checkbox, Empty, Spin, Typography, Button, Modal, Input, message } from "antd";
import ApproverRequestRow from "../molecules/ApproverRequestRow";
import Can from "../../../hrmAccess/components/Can";
import { HrGlobalQueueTableProps } from "../../types/ui.types";
import { useHrmLeaveStore } from "../../stores/hrmLeaveStore";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;
const { TextArea } = Input;

const HrGlobalQueueTable: React.FC<HrGlobalQueueTableProps> = ({
  requests,
  loading,
  selectedHandle,
  onRowClick,
  organizationId,
  employeeId,
  role,
  onActionComplete,
}) => {
  const {
    selectedRequestIds,
    toggleRequestSelection,
    selectAllRequests,
    clearSelection,
  } = useHrmLeaveStore();

  const [bulkLoading, setBulkLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");

  const visibleIds = requests.map((r) => r.handle);
  const selectedIds = selectedRequestIds.filter((id) => visibleIds.includes(id));
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      selectAllRequests(selectedRequestIds.filter((id) => !visibleIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedRequestIds, ...visibleIds]));
      selectAllRequests(merged);
    }
  };

  const handleBulkApprove = async () => {
    setBulkLoading(true);
    try {
      const res = await HrmLeaveService.bulkApprove({
        organizationId,
        requestIds: selectedIds,
        actorId: employeeId,
        actorRole: role,
      });
      const successCount = res.approved.length;
      const failCount = res.failed.length;
      if (failCount === 0) {
        message.success(`${successCount} request(s) approved`);
      } else {
        message.warning(`${successCount} approved, ${failCount} failed`);
      }
      clearSelection();
      onActionComplete?.();
    } catch {
      message.error("Bulk approval failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (!rejectRemarks.trim()) {
      message.warning("Please enter rejection remarks");
      return;
    }
    setBulkLoading(true);
    try {
      const res = await HrmLeaveService.bulkReject({
        organizationId,
        requestIds: selectedIds,
        actorId: employeeId,
        actorRole: role,
        remarks: rejectRemarks.trim(),
      });
      const successCount = res.approved.length;
      const failCount = res.failed.length;
      if (failCount === 0) {
        message.success(`${successCount} request(s) rejected`);
      } else {
        message.warning(`${successCount} rejected, ${failCount} failed`);
      }
      clearSelection();
      setRejectModalOpen(false);
      setRejectRemarks("");
      onActionComplete?.();
    } catch {
      message.error("Bulk rejection failed");
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.panelLoading}>
        <Spin tip="Loading queue..." />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className={styles.panelEmpty}>
        <Empty description="No requests in queue" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  const wfhCount = requests.filter((r) => r.leaveTypeCode === "WFH").length;

  return (
    <div className={styles.requestsList}>
      <div className={styles.requestsListHeader}>
        <Text strong>Global Queue ({requests.length})</Text>
        {wfhCount > 0 && (
          <Can I="edit" object="leave_hr_queue" passIf={true}>
            <Button size="small" type="link">
              Batch Approve WFH ({wfhCount})
            </Button>
          </Can>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
            padding: "8px 12px",
            background: "#f0f5ff",
            borderRadius: 6,
          }}
        >
          <Text strong>{selectedIds.length} selected</Text>
          <Button
            type="primary"
            size="small"
            onClick={handleBulkApprove}
            loading={bulkLoading}
          >
            Approve Selected
          </Button>
          <Button
            danger
            size="small"
            onClick={() => setRejectModalOpen(true)}
            loading={bulkLoading}
          >
            Reject Selected
          </Button>
          <Button type="text" size="small" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "4px 12px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={handleSelectAll}
          style={{ marginRight: 8 }}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Select all
        </Text>
      </div>

      {requests.map((req) => (
        <div
          key={req.handle}
          style={{ display: "flex", alignItems: "flex-start" }}
        >
          <Checkbox
            checked={selectedIds.includes(req.handle)}
            onChange={() => toggleRequestSelection(req.handle)}
            style={{ marginTop: 12, marginLeft: 12, marginRight: 4 }}
          />
          <div style={{ flex: 1 }}>
            <ApproverRequestRow
              request={req}
              isSelected={req.handle === selectedHandle}
              onClick={onRowClick}
            />
          </div>
        </div>
      ))}

      <Modal
        title="Reject Selected Requests"
        open={rejectModalOpen}
        onOk={handleBulkReject}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectRemarks("");
        }}
        confirmLoading={bulkLoading}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <Text>
          You are about to reject <strong>{selectedIds.length}</strong> request(s).
        </Text>
        <TextArea
          rows={3}
          placeholder="Enter rejection remarks (required)"
          value={rejectRemarks}
          onChange={(e) => setRejectRemarks(e.target.value)}
          style={{ marginTop: 12 }}
        />
      </Modal>
    </div>
  );
};

export default HrGlobalQueueTable;

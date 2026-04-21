"use client";

import React, { useState } from "react";
import { Empty, Spin, Typography, Button, Modal, Input, Tag, message } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { CompOffRequest } from "../../types/api.types";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;
const { TextArea } = Input;

interface CompOffInboxTableProps {
  requests: CompOffRequest[];
  loading: boolean;
  organizationId: string;
  employeeId: string;
  onActionComplete: () => void;
}

const CompOffInboxTable: React.FC<CompOffInboxTableProps> = ({
  requests,
  loading,
  organizationId,
  employeeId,
  onActionComplete,
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await HrmLeaveService.approveCompOff({
        organizationId,
        requestId,
        actorId: employeeId,
      });
      message.success("Comp-off approved");
      onActionComplete();
    } catch {
      message.error("Failed to approve comp-off");
    } finally {
      setActionLoading(null);
    }
  };

  const openReject = (requestId: string) => {
    setRejectTarget(requestId);
    setRejectRemarks("");
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectRemarks.trim()) {
      message.warning("Please enter rejection remarks");
      return;
    }
    setActionLoading(rejectTarget);
    try {
      await HrmLeaveService.rejectCompOff({
        organizationId,
        requestId: rejectTarget,
        actorId: employeeId,
        remarks: rejectRemarks.trim(),
      });
      message.success("Comp-off rejected");
      setRejectModalOpen(false);
      setRejectTarget(null);
      setRejectRemarks("");
      onActionComplete();
    } catch {
      message.error("Failed to reject comp-off");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.panelLoading}>
        <Spin tip="Loading pending comp-off requests..." />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className={styles.panelEmpty}>
        <Empty description="No pending comp-off requests" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div className={styles.requestsList}>
      <div className={styles.requestsListHeader}>
        <Text strong>Pending Comp-Off Approvals ({requests.length})</Text>
      </div>

      {requests.map((req) => {
        const workedDate = new Date(req.workedDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const submittedDate = new Date(req.createdDateTime).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        return (
          <div
            key={req.handle}
            className={styles.requestRow}
            style={{ cursor: "default" }}
          >
            <div className={styles.requestRowTop}>
              <Text strong>{req.employeeName || req.employeeId}</Text>
              <Tag color="orange">PENDING</Tag>
            </div>
            <div className={styles.requestRowMid}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Worked: {workedDate}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {req.hours}h = {req.quantity} day(s)
              </Text>
            </div>
            <div style={{ fontSize: 12, color: "#595959", padding: "4px 0" }}>
              {req.reason}
            </div>
            <div className={styles.requestRowBottom}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Submitted: {submittedDate}
              </Text>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  loading={actionLoading === req.handle}
                  onClick={() => handleApprove(req.handle)}
                  style={{ background: "#52c41a", borderColor: "#52c41a" }}
                >
                  Approve
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  loading={actionLoading === req.handle}
                  onClick={() => openReject(req.handle)}
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      <Modal
        title="Reject Comp-Off Request"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectTarget(null);
          setRejectRemarks("");
        }}
        confirmLoading={actionLoading !== null}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <Text>Please provide a reason for rejecting this comp-off request.</Text>
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

export default CompOffInboxTable;

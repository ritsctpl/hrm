"use client";

import React, { useState } from "react";
import { Card, Input, Button, Space, Modal, Typography } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface Props {
  reportId: string;
  loading?: boolean;
  onApprove: (remarks?: string) => void;
  onReject: (remarks: string) => void;
}

const SupervisorApprovalBar: React.FC<Props> = ({ reportId, loading, onApprove, onReject }) => {
  const [remarks, setRemarks] = useState("");
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");

  return (
    <>
      <Card
        size="small"
        title={<Text strong style={{ fontSize: 13 }}>Supervisor Approval</Text>}
        style={{ borderColor: "#faad14", background: "#fffbe6", margin: "16px 16px 0" }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={8}>
          <Input.TextArea
            placeholder="Remarks (mandatory for rejection)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
          />
          <Space style={{ justifyContent: "flex-end", width: "100%", display: "flex" }}>
            <Button danger icon={<CloseCircleOutlined />} onClick={() => setRejectModal(true)} loading={loading}>
              Reject
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => Modal.confirm({
                title: `Approve ${reportId}?`,
                content: "Expense will be forwarded to Finance.",
                okText: "Approve",
                onOk: () => onApprove(remarks || undefined),
              })}
              loading={loading}
            >
              Approve
            </Button>
          </Space>
        </Space>
      </Card>

      <Modal
        title="Reject Expense"
        open={rejectModal}
        onCancel={() => setRejectModal(false)}
        onOk={() => { onReject(rejectRemarks); setRejectModal(false); setRejectRemarks(""); }}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true, disabled: !rejectRemarks.trim() }}
      >
        <Input.TextArea
          placeholder="Enter rejection reason (required)"
          value={rejectRemarks}
          onChange={(e) => setRejectRemarks(e.target.value)}
          rows={3}
        />
      </Modal>
    </>
  );
};

export default SupervisorApprovalBar;

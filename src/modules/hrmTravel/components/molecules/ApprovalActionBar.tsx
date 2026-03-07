"use client";

import React, { useState } from "react";
import { Card, Input, Button, Space, Modal, Typography } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface Props {
  requestId: string;
  loading?: boolean;
  onApprove: (remarks?: string) => void;
  onReject: (remarks: string) => void;
}

const ApprovalActionBar: React.FC<Props> = ({ requestId, loading, onApprove, onReject }) => {
  const [remarks, setRemarks] = useState("");
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");

  const handleApprove = () => {
    Modal.confirm({
      title: `Approve ${requestId}?`,
      content: "This will approve the travel request and notify the employee.",
      okText: "Approve",
      okButtonProps: { type: "primary" },
      onOk: () => onApprove(remarks || undefined),
    });
  };

  const handleRejectSubmit = () => {
    if (!rejectRemarks.trim()) return;
    onReject(rejectRemarks);
    setRejectModal(false);
    setRejectRemarks("");
  };

  return (
    <>
      <Card
        size="small"
        title={<Text strong style={{ fontSize: 13 }}>Approval Action — Supervisor</Text>}
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
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => setRejectModal(true)}
              loading={loading}
            >
              Reject
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleApprove}
              loading={loading}
            >
              Approve
            </Button>
          </Space>
        </Space>
      </Card>

      <Modal
        title="Reject Request"
        open={rejectModal}
        onCancel={() => setRejectModal(false)}
        onOk={handleRejectSubmit}
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

export default ApprovalActionBar;

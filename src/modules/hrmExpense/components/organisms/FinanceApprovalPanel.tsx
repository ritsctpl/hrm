"use client";

import React from "react";
import { Card, Form, InputNumber, Select, Input, DatePicker, Checkbox, Button, Space, Modal, Typography, Descriptions } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, DollarOutlined } from "@ant-design/icons";
import type { FinancePanelState } from "../../types/ui.types";
import type { EmployeeBankDetails } from "../../types/domain.types";
import { PAYMENT_MODE_OPTIONS } from "../../utils/expenseConstants";
import dayjs from "dayjs";

const { Text } = Typography;

interface Props {
  reportId: string;
  totalClaimedAmountInr: number;
  panel: FinancePanelState;
  bankDetails?: EmployeeBankDetails | null;
  loading?: boolean;
  onChange: (changes: Partial<FinancePanelState>) => void;
  onApprove: () => void;
  onReject: (remarks: string) => void;
  onMarkPaid: () => void;
}

const FinanceApprovalPanel: React.FC<Props> = ({
  reportId,
  totalClaimedAmountInr,
  panel,
  bankDetails,
  loading,
  onChange,
  onApprove,
  onReject,
  onMarkPaid,
}) => {
  const [rejectModal, setRejectModal] = React.useState(false);
  const [rejectRemarks, setRejectRemarks] = React.useState("");

  return (
    <>
      <Card
        size="small"
        title={<Text strong style={{ fontSize: 13 }}>Finance Review & Payment</Text>}
        style={{ borderColor: "#1890ff", background: "#f0f8ff", margin: "16px 16px 0" }}
      >
        <Form layout="vertical" component="div">
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">Total Claimed (INR): </Text>
            <Text strong>{totalClaimedAmountInr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item label="Sanctioned Amount (INR)" required style={{ flex: 1 }}>
              <InputNumber
                value={panel.sanctionedAmount ?? undefined}
                min={0}
                style={{ width: "100%" }}
                onChange={(v) => onChange({ sanctionedAmount: v })}
              />
            </Form.Item>
            <Form.Item label="Per Diem (optional, INR)" style={{ flex: 1 }}>
              <InputNumber
                value={panel.perDiemAmount ?? undefined}
                min={0}
                style={{ width: "100%" }}
                onChange={(v) => onChange({ perDiemAmount: v })}
              />
            </Form.Item>
            <Form.Item label="Exchange Rate" style={{ flex: 1 }}>
              <InputNumber
                value={panel.exchangeRate}
                min={0.0001}
                precision={4}
                style={{ width: "100%" }}
                onChange={(v) => onChange({ exchangeRate: v ?? 1 })}
              />
            </Form.Item>
          </div>

          <Form.Item label="">
            <Checkbox
              checked={panel.originalsReceived}
              onChange={(e) => onChange({ originalsReceived: e.target.checked })}
            >
              Originals Received
            </Checkbox>
          </Form.Item>

          <div style={{ borderTop: "1px dashed #d9d9d9", paddingTop: 12, marginTop: 4 }}>
            <Text strong style={{ fontSize: 12, color: "#595959" }}>Payment Details</Text>
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <Form.Item label="Payment Mode" style={{ flex: 1 }}>
                <Select
                  value={panel.paymentMode}
                  options={PAYMENT_MODE_OPTIONS}
                  onChange={(v) => onChange({ paymentMode: v })}
                  placeholder="Select mode"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item label="Payment Reference" style={{ flex: 2 }}>
                <Input
                  placeholder="NEFT/TXN-2025-01-20"
                  value={panel.paymentReference}
                  onChange={(e) => onChange({ paymentReference: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="Payment Date" style={{ flex: 1 }}>
                <DatePicker
                  value={panel.paymentDate ? dayjs(panel.paymentDate) : null}
                  onChange={(_, s) => onChange({ paymentDate: (Array.isArray(s) ? s[0] : s) || null })}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </div>
          </div>

          <Form.Item label="Remarks">
            <Input.TextArea
              rows={2}
              value={panel.remarks}
              onChange={(e) => onChange({ remarks: e.target.value })}
            />
          </Form.Item>

          <Space style={{ width: "100%", justifyContent: "flex-end", display: "flex" }}>
            <Button danger icon={<CloseCircleOutlined />} onClick={() => setRejectModal(true)} loading={loading}>
              Reject
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => Modal.confirm({
                title: `Approve & Sanction ${reportId}?`,
                onOk: onApprove,
              })}
              loading={loading}
              disabled={!panel.sanctionedAmount}
            >
              Approve & Save
            </Button>
            <Button
              icon={<DollarOutlined />}
              onClick={() => Modal.confirm({
                title: `Mark ${reportId} as Paid?`,
                onOk: onMarkPaid,
              })}
              loading={loading}
              disabled={!panel.paymentReference || !panel.paymentDate || !panel.paymentMode}
            >
              Mark as Paid
            </Button>
          </Space>
        </Form>
      </Card>

      {bankDetails && (
        <Card
          size="small"
          title="Employee Bank Details"
          style={{ margin: "12px 16px 0", borderColor: "#f0f0f0" }}
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Account Holder">{bankDetails.accountHolder}</Descriptions.Item>
            <Descriptions.Item label="Bank">{bankDetails.bankName}</Descriptions.Item>
            <Descriptions.Item label="Account No">{bankDetails.accountNumberMasked}</Descriptions.Item>
            <Descriptions.Item label="IFSC">{bankDetails.ifsc}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

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

export default FinanceApprovalPanel;

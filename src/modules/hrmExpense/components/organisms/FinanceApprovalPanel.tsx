"use client";

import React, { useState } from "react";
import {
  Card,
  Form,
  InputNumber,
  Select,
  Input,
  DatePicker,
  Checkbox,
  Button,
  Space,
  Modal,
  Typography,
  Descriptions,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import type { FinancePanelState } from "../../types/ui.types";
import type { EmployeeBankDetails, ExpenseStatus } from "../../types/domain.types";
import { PAYMENT_MODE_OPTIONS } from "../../utils/expenseConstants";
import Can from "../../../hrmAccess/components/Can";
import dayjs from "dayjs";

const { Text } = Typography;

interface Props {
  reportId: string;
  status?: ExpenseStatus;
  currency?: string;
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
  status,
  currency = "INR",
  totalClaimedAmountInr,
  panel,
  bankDetails,
  loading,
  onChange,
  onApprove,
  onReject,
  onMarkPaid,
}) => {
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");

  // Step 2 is the payment step. We land there automatically when the expense
  // is already APPROVED (sanction was recorded earlier). Otherwise the user
  // is on step 1 (Sanction) and can advance to step 2 via the action button.
  const initialStep: 1 | 2 = status === "APPROVED" ? 2 : 1;
  const [step, setStep] = useState<1 | 2>(initialStep);

  // Re-sync when the parent swaps to a different expense.
  React.useEffect(() => {
    setStep(status === "APPROVED" ? 2 : 1);
  }, [status, reportId]);

  const showFxField = currency !== "INR";

  const stepHeader = (
    <Space size={8}>
      <Text strong style={{ fontSize: 13 }}>
        {step === 1 ? "Sanction" : "Payment"}
      </Text>
      <Text type="secondary" style={{ fontSize: 11 }}>
        Step {step} of 2
      </Text>
    </Space>
  );

  const sanctionStep = (
    <Form layout="vertical" component="div">
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary">Employee claimed: </Text>
        <Text strong>
          INR{" "}
          {totalClaimedAmountInr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </Text>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <Form.Item label="Approve amount (INR)" required style={{ flex: 1 }}>
          <InputNumber
            value={panel.sanctionedAmount ?? undefined}
            min={0}
            style={{ width: "100%" }}
            onChange={(v) => onChange({ sanctionedAmount: v })}
          />
        </Form.Item>
        <Form.Item label="Per-diem (optional)" style={{ flex: 1 }}>
          <InputNumber
            value={panel.perDiemAmount ?? undefined}
            min={0}
            style={{ width: "100%" }}
            onChange={(v) => onChange({ perDiemAmount: v })}
          />
        </Form.Item>
        {showFxField && (
          <Form.Item label={`Exchange rate (${currency} → INR)`} style={{ flex: 1 }}>
            <InputNumber
              value={panel.exchangeRate}
              min={0.0001}
              precision={4}
              style={{ width: "100%" }}
              onChange={(v) => onChange({ exchangeRate: v ?? 1 })}
            />
          </Form.Item>
        )}
      </div>

      <Form.Item style={{ marginBottom: 8 }}>
        <Checkbox
          checked={panel.originalsReceived}
          onChange={(e) => onChange({ originalsReceived: e.target.checked })}
        >
          Originals received
        </Checkbox>
      </Form.Item>

      <Form.Item label="Notes for employee">
        <Input.TextArea
          rows={2}
          value={panel.remarks}
          onChange={(e) => onChange({ remarks: e.target.value })}
        />
      </Form.Item>

      <Space style={{ width: "100%", justifyContent: "flex-end", display: "flex" }}>
        <Can I="edit">
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => setRejectModal(true)}
            loading={loading}
          >
            Reject
          </Button>
        </Can>
        <Can I="edit">
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() =>
              Modal.confirm({
                title: `Sanction ${reportId}?`,
                content:
                  "After sanctioning you will move to the payment step. You can come back to adjust if needed.",
                okText: "Sanction & next",
                onOk: async () => {
                  await onApprove();
                  setStep(2);
                },
              })
            }
            loading={loading}
            disabled={!panel.sanctionedAmount}
          >
            Sanction & next <ArrowRightOutlined />
          </Button>
        </Can>
      </Space>
    </Form>
  );

  const paymentStep = (
    <Form layout="vertical" component="div">
      {panel.sanctionedAmount != null && (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">Sanctioned: </Text>
          <Text strong>
            INR{" "}
            {Number(panel.sanctionedAmount).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </Text>
        </div>
      )}

      <div style={{ display: "flex", gap: 16 }}>
        <Form.Item label="Payment mode" required style={{ flex: 1 }}>
          <Select
            value={panel.paymentMode}
            options={PAYMENT_MODE_OPTIONS}
            onChange={(v) => onChange({ paymentMode: v })}
            placeholder="Select mode"
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item label="Reference" required style={{ flex: 2 }}>
          <Input
            placeholder="NEFT-2026-04-10-0421"
            value={panel.paymentReference}
            onChange={(e) => onChange({ paymentReference: e.target.value })}
          />
        </Form.Item>
        <Form.Item label="Payment date" required style={{ flex: 1 }}>
          <DatePicker
            value={panel.paymentDate ? dayjs(panel.paymentDate) : null}
            onChange={(_, s) =>
              onChange({ paymentDate: (Array.isArray(s) ? s[0] : s) || null })
            }
            style={{ width: "100%" }}
          />
        </Form.Item>
      </div>

      {bankDetails && (
        <Card
          size="small"
          title="Employee bank details"
          style={{ marginTop: 4, marginBottom: 12, borderColor: "#f0f0f0" }}
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Account holder">
              {bankDetails.accountHolder}
            </Descriptions.Item>
            <Descriptions.Item label="Bank">{bankDetails.bankName}</Descriptions.Item>
            <Descriptions.Item label="Account no">
              {bankDetails.accountNumberMasked}
            </Descriptions.Item>
            <Descriptions.Item label="IFSC">{bankDetails.ifsc}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Space style={{ width: "100%", justifyContent: "space-between", display: "flex" }}>
        <Button
          type="text"
          size="small"
          icon={<ArrowLeftOutlined />}
          onClick={() => setStep(1)}
        >
          Back to sanction
        </Button>
        <Can I="edit">
          <Button
            type="primary"
            icon={<DollarOutlined />}
            onClick={() =>
              Modal.confirm({
                title: `Mark ${reportId} as paid?`,
                onOk: onMarkPaid,
              })
            }
            loading={loading}
            disabled={!panel.paymentReference || !panel.paymentDate || !panel.paymentMode}
          >
            Mark as paid
          </Button>
        </Can>
      </Space>
    </Form>
  );

  return (
    <>
      <Card
        size="small"
        title={stepHeader}
        style={{
          borderColor: "#1890ff",
          background: "#f0f8ff",
          margin: "16px 16px 0",
        }}
      >
        {step === 1 ? sanctionStep : paymentStep}
      </Card>

      <Modal
        title="Reject expense"
        open={rejectModal}
        onCancel={() => setRejectModal(false)}
        onOk={() => {
          onReject(rejectRemarks);
          setRejectModal(false);
          setRejectRemarks("");
        }}
        okText="Confirm rejection"
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

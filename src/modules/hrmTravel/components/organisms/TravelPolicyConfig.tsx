"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getOrganizationId } from "@/utils/cookieUtils";
import {
  Tabs,
  Form,
  Checkbox,
  InputNumber,
  Input,
  Button,
  Collapse,
  Table,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  DatePicker,
  message,
  Empty,
} from "antd";
import { PlusOutlined, DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { HrmTravelService } from "../../services/hrmTravelService";
import Can from "../../../hrmAccess/components/Can";
import type {
  TravelPolicy,
  TravelType,
  TravelMode,
  GradeEntitlement,
  ApprovalLevel,
  BlackoutPeriod,
} from "../../types/domain.types";

const { Panel } = Collapse;
const { Text } = Typography;

const ALL_TYPES: TravelType[] = ["LOCAL", "DOMESTIC", "INTERNATIONAL"];
const ALL_MODES: TravelMode[] = ["CAB", "AUTO", "BUS", "TRAIN", "FLIGHT", "AIR"];
const TRAVEL_CLASSES = [
  { value: "ECONOMY", label: "Economy" },
  { value: "PREMIUM_ECONOMY", label: "Premium Economy" },
  { value: "BUSINESS", label: "Business" },
  { value: "FIRST", label: "First Class" },
];
const HOTEL_CATEGORIES = [
  { value: "3_STAR", label: "3-Star" },
  { value: "4_STAR", label: "4-Star" },
  { value: "5_STAR", label: "5-Star" },
  { value: "PREMIUM", label: "Premium / Luxury" },
];
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];

interface Props {
  policies: TravelPolicy[];
  onSaved?: () => void;
}

const emptyPolicyFor = (type: TravelType): TravelPolicy => ({
  travelType: type,
  allowedModes:
    type === "LOCAL"
      ? ["CAB", "AUTO", "BUS"]
      : type === "DOMESTIC"
      ? ["CAB", "BUS", "TRAIN", "FLIGHT"]
      : ["FLIGHT", "AIR"],
  escalationWindowDays: 3,
  allowedFileTypes: ["pdf", "jpg", "png"],
  maxFileSizeMb: 5,
  maxFileCount: 5,
  gradeEntitlements: [],
  expenseCurrency: "INR",
  advanceEnabled: false,
  approvalMatrix: [],
  mandatoryDocuments: [],
  preferredVendors: [],
  blackoutPeriods: [],
  autoOnDutyOnApproval: true,
  insuranceMandatory: type === "INTERNATIONAL",
});

// ── Grade Entitlements Table ────────────────────────────────────────────────
const GradeEntitlementsEditor: React.FC<{
  value?: GradeEntitlement[];
  onChange: (v: GradeEntitlement[]) => void;
}> = ({ value = [], onChange }) => {
  const update = (idx: number, patch: Partial<GradeEntitlement>) => {
    const next = value.map((row, i) => (i === idx ? { ...row, ...patch } : row));
    onChange(next);
  };
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const add = () =>
    onChange([
      ...value,
      {
        grade: "",
        travelClass: "ECONOMY",
        hotelCategory: "3_STAR",
        perDiemAmount: 0,
        perDiemCurrency: "INR",
      },
    ]);

  return (
    <div>
      <Table
        size="small"
        rowKey={(_, idx) => String(idx)}
        dataSource={value}
        pagination={false}
        locale={{ emptyText: "No grade entitlements defined. Add rows for each grade (L1, L2, M1, etc.)." }}
        columns={[
          {
            title: "Grade",
            dataIndex: "grade",
            render: (_, r, i) => (
              <Input
                value={r.grade}
                placeholder="e.g. L1"
                onChange={(e) => update(i, { grade: e.target.value })}
              />
            ),
          },
          {
            title: "Travel Class",
            dataIndex: "travelClass",
            render: (_, r, i) => (
              <Select
                style={{ width: "100%" }}
                value={r.travelClass}
                options={TRAVEL_CLASSES}
                onChange={(v) => update(i, { travelClass: v })}
              />
            ),
          },
          {
            title: "Hotel Category",
            dataIndex: "hotelCategory",
            render: (_, r, i) => (
              <Select
                style={{ width: "100%" }}
                value={r.hotelCategory}
                options={HOTEL_CATEGORIES}
                onChange={(v) => update(i, { hotelCategory: v })}
              />
            ),
          },
          {
            title: "Per-Diem Amount",
            dataIndex: "perDiemAmount",
            render: (_, r, i) => (
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                value={r.perDiemAmount}
                onChange={(v) => update(i, { perDiemAmount: v ?? 0 })}
              />
            ),
          },
          {
            title: "Currency",
            dataIndex: "perDiemCurrency",
            width: 100,
            render: (_, r, i) => (
              <Select
                style={{ width: "100%" }}
                value={r.perDiemCurrency}
                options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                onChange={(v) => update(i, { perDiemCurrency: v })}
              />
            ),
          },
          {
            title: "",
            width: 50,
            render: (_, __, i) => (
              <Button danger size="small" icon={<DeleteOutlined />} onClick={() => remove(i)} />
            ),
          },
        ]}
      />
      <Button style={{ marginTop: 8 }} icon={<PlusOutlined />} onClick={add} size="small">
        Add Grade
      </Button>
    </div>
  );
};

// ── Approval Matrix Editor ──────────────────────────────────────────────────
const ApprovalMatrixEditor: React.FC<{
  value?: ApprovalLevel[];
  onChange: (v: ApprovalLevel[]) => void;
}> = ({ value = [], onChange }) => {
  const update = (idx: number, patch: Partial<ApprovalLevel>) => {
    const next = value.map((row, i) => (i === idx ? { ...row, ...patch } : row));
    onChange(next);
  };
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const add = () =>
    onChange([
      ...value,
      { level: value.length + 1, upToAmount: 0, approverRole: "MANAGER", slaHours: 48 },
    ]);

  return (
    <div>
      <Table
        size="small"
        rowKey={(_, idx) => String(idx)}
        dataSource={value}
        pagination={false}
        locale={{ emptyText: "No approval levels. Add levels for escalating thresholds." }}
        columns={[
          {
            title: "Level",
            dataIndex: "level",
            width: 70,
            render: (_, r, i) => (
              <InputNumber
                min={1}
                style={{ width: "100%" }}
                value={r.level}
                onChange={(v) => update(i, { level: v ?? 1 })}
              />
            ),
          },
          {
            title: "Up to Amount",
            dataIndex: "upToAmount",
            render: (_, r, i) => (
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                value={r.upToAmount}
                onChange={(v) => update(i, { upToAmount: v ?? 0 })}
              />
            ),
          },
          {
            title: "Approver Role",
            dataIndex: "approverRole",
            render: (_, r, i) => (
              <Select
                style={{ width: "100%" }}
                value={r.approverRole}
                options={[
                  { value: "MANAGER", label: "Manager" },
                  { value: "SR_MANAGER", label: "Sr. Manager" },
                  { value: "DIRECTOR", label: "Director" },
                  { value: "VP", label: "VP" },
                  { value: "CFO", label: "CFO" },
                  { value: "CEO", label: "CEO" },
                ]}
                onChange={(v) => update(i, { approverRole: v })}
              />
            ),
          },
          {
            title: "SLA (hours)",
            dataIndex: "slaHours",
            width: 120,
            render: (_, r, i) => (
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                value={r.slaHours}
                onChange={(v) => update(i, { slaHours: v ?? 24 })}
              />
            ),
          },
          {
            title: "",
            width: 50,
            render: (_, __, i) => (
              <Button danger size="small" icon={<DeleteOutlined />} onClick={() => remove(i)} />
            ),
          },
        ]}
      />
      <Button style={{ marginTop: 8 }} icon={<PlusOutlined />} onClick={add} size="small">
        Add Level
      </Button>
    </div>
  );
};

// ── Blackout Periods Editor ─────────────────────────────────────────────────
const BlackoutPeriodsEditor: React.FC<{
  value?: BlackoutPeriod[];
  onChange: (v: BlackoutPeriod[]) => void;
}> = ({ value = [], onChange }) => {
  const update = (idx: number, patch: Partial<BlackoutPeriod>) => {
    const next = value.map((row, i) => (i === idx ? { ...row, ...patch } : row));
    onChange(next);
  };
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const add = () =>
    onChange([...value, { startDate: "", endDate: "", reason: "" }]);

  return (
    <div>
      <Table
        size="small"
        rowKey={(_, idx) => String(idx)}
        dataSource={value}
        pagination={false}
        locale={{ emptyText: "No blackout periods. Add date ranges during which travel is restricted." }}
        columns={[
          {
            title: "Start Date",
            dataIndex: "startDate",
            render: (_, r, i) => (
              <DatePicker
                style={{ width: "100%" }}
                value={r.startDate ? dayjs(r.startDate) : null}
                onChange={(d) => update(i, { startDate: d ? d.format("YYYY-MM-DD") : "" })}
              />
            ),
          },
          {
            title: "End Date",
            dataIndex: "endDate",
            render: (_, r, i) => (
              <DatePicker
                style={{ width: "100%" }}
                value={r.endDate ? dayjs(r.endDate) : null}
                onChange={(d) => update(i, { endDate: d ? d.format("YYYY-MM-DD") : "" })}
              />
            ),
          },
          {
            title: "Reason",
            dataIndex: "reason",
            render: (_, r, i) => (
              <Input
                value={r.reason}
                placeholder="e.g. Fiscal year-end freeze"
                onChange={(e) => update(i, { reason: e.target.value })}
              />
            ),
          },
          {
            title: "",
            width: 50,
            render: (_, __, i) => (
              <Button danger size="small" icon={<DeleteOutlined />} onClick={() => remove(i)} />
            ),
          },
        ]}
      />
      <Button style={{ marginTop: 8 }} icon={<PlusOutlined />} onClick={add} size="small">
        Add Period
      </Button>
    </div>
  );
};

// ── Per-Type Policy Form ────────────────────────────────────────────────────
const PolicyTypeForm: React.FC<{
  policy: TravelPolicy;
  isNew: boolean;
  onSave: (values: TravelPolicy) => Promise<void>;
  saving: boolean;
}> = ({ policy, isNew, onSave, saving }) => {
  const [draft, setDraft] = useState<TravelPolicy>(policy);

  useEffect(() => {
    setDraft(policy);
  }, [policy]);

  const patch = (p: Partial<TravelPolicy>) => setDraft((d) => ({ ...d, ...p }));
  const fileTypesStr = (draft.allowedFileTypes ?? []).join(", ");
  const preferredVendorsStr = (draft.preferredVendors ?? []).join(", ");
  const mandatoryDocsStr = (draft.mandatoryDocuments ?? []).join(", ");
  const isIntl = draft.travelType === "INTERNATIONAL";

  return (
    <div style={{ padding: "8px 4px" }}>
      {isNew && (
        <Tag color="orange" style={{ marginBottom: 12 }}>
          No policy saved yet for {draft.travelType}. Configure and click Save to create.
        </Tag>
      )}

      <Collapse defaultActiveKey={["basic", "grade"]} ghost>
        {/* ── Section 1: Basic Settings ────────────────────────────── */}
        <Panel header="Basic Settings (Modes, Escalation, Attachments)" key="basic">
          <Form layout="vertical" size="small">
            <Form.Item label="Allowed Travel Modes">
              <Checkbox.Group
                value={draft.allowedModes}
                options={ALL_MODES.map((m) => ({ label: m, value: m }))}
                onChange={(v) => patch({ allowedModes: v as TravelMode[] })}
              />
            </Form.Item>
            <Space wrap size="large">
              <Form.Item label="Escalation Window (days)">
                <InputNumber
                  min={1}
                  max={30}
                  value={draft.escalationWindowDays}
                  onChange={(v) => patch({ escalationWindowDays: v ?? 3 })}
                />
              </Form.Item>
              <Form.Item label="Allowed File Types (comma)">
                <Input
                  style={{ width: 260 }}
                  value={fileTypesStr}
                  placeholder="pdf, jpg, png"
                  onChange={(e) =>
                    patch({
                      allowedFileTypes: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </Form.Item>
              <Form.Item label="Max File Size (MB)">
                <InputNumber
                  min={1}
                  max={50}
                  value={draft.maxFileSizeMb}
                  onChange={(v) => patch({ maxFileSizeMb: v ?? 5 })}
                />
              </Form.Item>
              <Form.Item label="Max File Count">
                <InputNumber
                  min={1}
                  max={20}
                  value={draft.maxFileCount}
                  onChange={(v) => patch({ maxFileCount: v ?? 5 })}
                />
              </Form.Item>
            </Space>
          </Form>
        </Panel>

        {/* ── Section 2: Grade Entitlements ───────────────────────── */}
        <Panel header="Grade Entitlements (Travel Class, Hotel, Per-Diem)" key="grade">
          <Text type="secondary">
            Define travel class, hotel category, and per-diem by employee grade.
          </Text>
          <div style={{ marginTop: 12 }}>
            <GradeEntitlementsEditor
              value={draft.gradeEntitlements}
              onChange={(v) => patch({ gradeEntitlements: v })}
            />
          </div>
        </Panel>

        {/* ── Section 3: Expense Caps ─────────────────────────────── */}
        <Panel header="Expense Caps (Lodging, Meals, Incidentals)" key="expense">
          <Space wrap size="large">
            <Form.Item label="Currency">
              <Select
                style={{ width: 120 }}
                value={draft.expenseCurrency ?? "INR"}
                options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                onChange={(v) => patch({ expenseCurrency: v })}
              />
            </Form.Item>
            <Form.Item label="Max Lodging / Day">
              <InputNumber
                min={0}
                value={draft.maxLodgingPerDay}
                onChange={(v) => patch({ maxLodgingPerDay: v ?? undefined })}
              />
            </Form.Item>
            <Form.Item label="Max Meals / Day">
              <InputNumber
                min={0}
                value={draft.maxMealsPerDay}
                onChange={(v) => patch({ maxMealsPerDay: v ?? undefined })}
              />
            </Form.Item>
            <Form.Item label="Max Incidentals / Day">
              <InputNumber
                min={0}
                value={draft.maxIncidentalsPerDay}
                onChange={(v) => patch({ maxIncidentalsPerDay: v ?? undefined })}
              />
            </Form.Item>
          </Space>
        </Panel>

        {/* ── Section 4: Advance Policy ───────────────────────────── */}
        <Panel header="Travel Advance Policy" key="advance">
          <Space wrap size="large">
            <Form.Item label="Advance Enabled">
              <Switch
                checked={!!draft.advanceEnabled}
                onChange={(v) => patch({ advanceEnabled: v })}
              />
            </Form.Item>
            <Form.Item label="Max Advance Amount">
              <InputNumber
                min={0}
                disabled={!draft.advanceEnabled}
                value={draft.maxAdvanceAmount}
                onChange={(v) => patch({ maxAdvanceAmount: v ?? undefined })}
              />
            </Form.Item>
            <Form.Item label="Max % of Estimated Cost">
              <InputNumber
                min={0}
                max={100}
                disabled={!draft.advanceEnabled}
                value={draft.maxAdvancePercent}
                onChange={(v) => patch({ maxAdvancePercent: v ?? undefined })}
                addonAfter="%"
              />
            </Form.Item>
            <Form.Item label="Settlement Deadline (days after return)">
              <InputNumber
                min={1}
                max={90}
                disabled={!draft.advanceEnabled}
                value={draft.advanceSettlementDays}
                onChange={(v) => patch({ advanceSettlementDays: v ?? undefined })}
              />
            </Form.Item>
          </Space>
        </Panel>

        {/* ── Section 5: Booking Rules ────────────────────────────── */}
        <Panel header="Booking Rules" key="booking">
          <Space wrap size="large">
            <Form.Item label="Advance Booking Window (days)">
              <InputNumber
                min={0}
                max={180}
                value={draft.advanceBookingWindowDays}
                onChange={(v) => patch({ advanceBookingWindowDays: v ?? undefined })}
              />
            </Form.Item>
            <Form.Item label="Self-Booking Threshold (amount)">
              <InputNumber
                min={0}
                style={{ width: 200 }}
                value={draft.selfBookingThreshold}
                onChange={(v) => patch({ selfBookingThreshold: v ?? undefined })}
              />
            </Form.Item>
          </Space>
          <Form.Item label="Preferred Vendors (comma separated)">
            <Input
              value={preferredVendorsStr}
              placeholder="MakeMyTrip, Yatra, Thomas Cook"
              onChange={(e) =>
                patch({
                  preferredVendors: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </Form.Item>
        </Panel>

        {/* ── Section 6: Approval Matrix ──────────────────────────── */}
        <Panel header="Approval Matrix (Levels by Amount)" key="approval">
          <Text type="secondary">
            Requests are auto-routed by amount. Levels apply in order.
          </Text>
          <div style={{ marginTop: 12 }}>
            <ApprovalMatrixEditor
              value={draft.approvalMatrix}
              onChange={(v) => patch({ approvalMatrix: v })}
            />
          </div>
        </Panel>

        {/* ── Section 7: Claim Submission ─────────────────────────── */}
        <Panel header="Claim Submission & Documents" key="claim">
          <Space wrap size="large">
            <Form.Item label="Claim Deadline (days after return)">
              <InputNumber
                min={1}
                max={90}
                value={draft.claimDeadlineDaysAfterReturn}
                onChange={(v) => patch({ claimDeadlineDaysAfterReturn: v ?? undefined })}
              />
            </Form.Item>
          </Space>
          <Form.Item label="Mandatory Documents (comma separated)">
            <Input
              value={mandatoryDocsStr}
              placeholder="Invoice, Boarding Pass, Itinerary, Receipts"
              onChange={(e) =>
                patch({
                  mandatoryDocuments: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </Form.Item>
        </Panel>

        {/* ── Section 8: International Specifics ──────────────────── */}
        {isIntl && (
          <Panel header="International Specifics" key="intl">
            <Space wrap size="large">
              <Form.Item label="Visa Required (days before)">
                <InputNumber
                  min={0}
                  max={180}
                  value={draft.visaRequiredDaysBefore}
                  onChange={(v) => patch({ visaRequiredDaysBefore: v ?? undefined })}
                />
              </Form.Item>
              <Form.Item label="Forex Limit">
                <InputNumber
                  min={0}
                  style={{ width: 180 }}
                  value={draft.forexLimitAmount}
                  onChange={(v) => patch({ forexLimitAmount: v ?? undefined })}
                />
              </Form.Item>
              <Form.Item label="Forex Currency">
                <Select
                  style={{ width: 120 }}
                  value={draft.forexLimitCurrency ?? "USD"}
                  options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                  onChange={(v) => patch({ forexLimitCurrency: v })}
                />
              </Form.Item>
              <Form.Item label="Insurance Mandatory">
                <Switch
                  checked={!!draft.insuranceMandatory}
                  onChange={(v) => patch({ insuranceMandatory: v })}
                />
              </Form.Item>
            </Space>
            <Form.Item label="Vaccination Requirements">
              <Input.TextArea
                rows={2}
                value={draft.vaccinationRequirements ?? ""}
                placeholder="e.g. Yellow Fever for Africa destinations; check destination-specific"
                onChange={(e) => patch({ vaccinationRequirements: e.target.value })}
              />
            </Form.Item>
          </Panel>
        )}

        {/* ── Section 9: Cancellation Policy ──────────────────────── */}
        <Panel header="Cancellation Policy" key="cancel">
          <Space wrap size="large">
            <Form.Item label="Refund Window (days before travel)">
              <InputNumber
                min={0}
                max={90}
                value={draft.cancellationRefundWindowDays}
                onChange={(v) => patch({ cancellationRefundWindowDays: v ?? undefined })}
              />
            </Form.Item>
            <Form.Item label="Cancellation Charge (%)">
              <InputNumber
                min={0}
                max={100}
                value={draft.cancellationChargePercent}
                onChange={(v) => patch({ cancellationChargePercent: v ?? undefined })}
                addonAfter="%"
              />
            </Form.Item>
          </Space>
        </Panel>

        {/* ── Section 10: Leave Integration ───────────────────────── */}
        <Panel header="Leave Integration" key="leave">
          <Form.Item label="Auto-apply On-Duty on Approval">
            <Switch
              checked={!!draft.autoOnDutyOnApproval}
              onChange={(v) => patch({ autoOnDutyOnApproval: v })}
            />
          </Form.Item>
        </Panel>

        {/* ── Section 11: Blackout Periods ────────────────────────── */}
        <Panel header="Blackout Periods (Travel Restricted)" key="blackout">
          <BlackoutPeriodsEditor
            value={draft.blackoutPeriods}
            onChange={(v) => patch({ blackoutPeriods: v })}
          />
        </Panel>
      </Collapse>

      <div style={{ textAlign: "right", marginTop: 16, borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
        <Can I={isNew ? "add" : "edit"}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => onSave(draft)}
          >
            Save {draft.travelType.charAt(0) + draft.travelType.slice(1).toLowerCase()} Policy
          </Button>
        </Can>
      </div>
    </div>
  );
};

// ── Main Config Container ──────────────────────────────────────────────────
const TravelPolicyConfig: React.FC<Props> = ({ policies, onSaved }) => {
  const organizationId = getOrganizationId();
  const [saving, setSaving] = useState(false);

  // Always render 3 travel-type tabs, merging saved policies with defaults
  // This fixes the blank-screen when backend returns empty.
  const mergedPolicies = useMemo(() => {
    return ALL_TYPES.map((type) => {
      const saved = policies.find((p) => p.travelType === type);
      return { policy: saved ?? emptyPolicyFor(type), isNew: !saved };
    });
  }, [policies]);

  const handleSave = async (values: TravelPolicy) => {
    setSaving(true);
    try {
      await HrmTravelService.updatePolicy({
        organizationId,
        travelType: values.travelType,
        allowedModes: values.allowedModes,
        escalationWindowDays: values.escalationWindowDays,
        allowedFileTypes: values.allowedFileTypes,
        maxFileSizeMb: values.maxFileSizeMb,
        maxFileCount: values.maxFileCount,
        gradeEntitlements: values.gradeEntitlements,
        maxLodgingPerDay: values.maxLodgingPerDay,
        maxMealsPerDay: values.maxMealsPerDay,
        maxIncidentalsPerDay: values.maxIncidentalsPerDay,
        expenseCurrency: values.expenseCurrency,
        advanceEnabled: values.advanceEnabled,
        maxAdvanceAmount: values.maxAdvanceAmount,
        maxAdvancePercent: values.maxAdvancePercent,
        advanceSettlementDays: values.advanceSettlementDays,
        advanceBookingWindowDays: values.advanceBookingWindowDays,
        preferredVendors: values.preferredVendors,
        selfBookingThreshold: values.selfBookingThreshold,
        approvalMatrix: values.approvalMatrix,
        claimDeadlineDaysAfterReturn: values.claimDeadlineDaysAfterReturn,
        mandatoryDocuments: values.mandatoryDocuments,
        visaRequiredDaysBefore: values.visaRequiredDaysBefore,
        forexLimitAmount: values.forexLimitAmount,
        forexLimitCurrency: values.forexLimitCurrency,
        insuranceMandatory: values.insuranceMandatory,
        vaccinationRequirements: values.vaccinationRequirements,
        cancellationRefundWindowDays: values.cancellationRefundWindowDays,
        cancellationChargePercent: values.cancellationChargePercent,
        autoOnDutyOnApproval: values.autoOnDutyOnApproval,
        blackoutPeriods: values.blackoutPeriods,
      });
      message.success(`${values.travelType} policy saved.`);
      onSaved?.();
    } catch (err) {
      const backendMsg =
        (err as any)?.response?.data?.message ?? (err as Error)?.message ?? "Unknown error";
      message.error(`Failed to save ${values.travelType} policy: ${backendMsg}`);
    } finally {
      setSaving(false);
    }
  };

  // Defensive: if something goes wrong with mergedPolicies, show Empty instead of blank
  if (!mergedPolicies.length) {
    return <Empty description="No travel policy types available." />;
  }

  return (
    <Tabs
      items={mergedPolicies.map(({ policy, isNew }) => ({
        key: policy.travelType,
        label: (
          <span>
            {policy.travelType.charAt(0) + policy.travelType.slice(1).toLowerCase()}
            {isNew && (
              <Tag color="orange" style={{ marginLeft: 6 }}>
                Unconfigured
              </Tag>
            )}
          </span>
        ),
        children: (
          <PolicyTypeForm
            policy={policy}
            isNew={isNew}
            onSave={handleSave}
            saving={saving}
          />
        ),
      }))}
    />
  );
};

export default TravelPolicyConfig;

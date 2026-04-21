"use client";

import React, { useState } from "react";
import {
  Table,
  Tag,
  Button,
  Empty,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Popconfirm,
  Drawer,
  Space,
  DatePicker,
  InputNumber,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { PolicySettingsTableProps } from "../../types/ui.types";
import { LeaveType, LeavePolicy, LeaveEntitlementTier } from "../../types/domain.types";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { parseCookies } from "nookies";
import {
  LEAVE_CATEGORIES,
  ACCRUAL_FREQUENCIES,
  LAPSE_RULES,
  ENCASH_WHEN_OPTIONS,
  ENCASH_RATE_FORMULAS,
} from "../../utils/constants";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const { Title, Text } = Typography;

const PolicySettingsTable: React.FC<PolicySettingsTableProps> = ({
  leaveTypes,
  loading,
  organizationId,
  onRefresh,
}) => {
  const cookies = parseCookies();
  const userId = cookies.userId ?? "";
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [typeForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [togglingHandle, setTogglingHandle] = useState<string | null>(null);
  const [deletingHandle, setDeletingHandle] = useState<string | null>(null);

  const [policyDrawerOpen, setPolicyDrawerOpen] = useState(false);
  const [policyDrawerType, setPolicyDrawerType] = useState<LeaveType | null>(null);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [policyForm] = Form.useForm();
  const [policySaving, setPolicySaving] = useState(false);
  const [tiers, setTiers] = useState<LeaveEntitlementTier[]>([]);

  const addTier = () =>
    setTiers([...tiers, { minTenureYears: 0, maxTenureYears: 99, annualEntitlement: 0 }]);
  const removeTier = (idx: number) =>
    setTiers(tiers.filter((_, i) => i !== idx));
  const updateTier = (
    idx: number,
    field: keyof LeaveEntitlementTier,
    value: number | null,
  ) => {
    const updated = [...tiers];
    updated[idx] = { ...updated[idx], [field]: value ?? 0 };
    setTiers(updated);
  };

  const handleSaveType = async () => {
    try {
      const values = await typeForm.validateFields();
      setSaving(true);
      if (editingType) {
        await HrmLeaveService.updateLeaveType({ organizationId, ...values });
      } else {
        await HrmLeaveService.createLeaveType({ organizationId, ...values });
      }
      message.success("Leave type saved");
      setTypeModalOpen(false);
      typeForm.resetFields();
      onRefresh();
    } catch {
      message.error("Failed to save leave type");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteType = async (row: LeaveType) => {
    setDeletingHandle(row.handle);
    try {
      await HrmLeaveService.deleteLeaveType({ organizationId,
        leaveTypeId: row.handle,
        deletedBy: userId,
      });
      message.success(`Deleted ${row.code}`);
      onRefresh();
    } catch {
      message.error("Failed to delete leave type");
    } finally {
      setDeletingHandle(null);
    }
  };

  const handleToggleActive = async (row: LeaveType, checked: boolean) => {
    setTogglingHandle(row.handle);
    try {
      await HrmLeaveService.activateDeactivateLeaveType({ organizationId,
        handle: row.handle,
        activeStatus: checked,
        modifiedBy: userId,
      });
      message.success(checked ? `Activated ${row.code}` : `Deactivated ${row.code}`);
      onRefresh();
    } catch {
      message.error("Failed to update status");
    } finally {
      setTogglingHandle(null);
    }
  };

  const loadPolicies = async (type: LeaveType) => {
    setPoliciesLoading(true);
    try {
      const data = await HrmLeaveService.getPoliciesByLeaveType({ organizationId,
        leaveTypeId: type.handle,
      });
      setPolicies(Array.isArray(data) ? data : []);
    } catch {
      message.error("Failed to load policies");
      setPolicies([]);
    } finally {
      setPoliciesLoading(false);
    }
  };

  const openPolicyDrawer = async (type: LeaveType) => {
    setPolicyDrawerType(type);
    setPolicyDrawerOpen(true);
    await loadPolicies(type);
  };

  const openCreatePolicy = () => {
    setEditingPolicy(null);
    policyForm.resetFields();
    policyForm.setFieldsValue({
      accrualFrequency: "QUARTERLY",
      accrualQuantity: 0,
      prorateEnabled: true,
      carryForwardAllowed: false,
      carryForwardCap: 0,
      encashmentAllowed: false,
      negativeBalanceAllowed: false,
      supervisorSlaDays: 2,
      escalationSlaDays: 1,
    });
    setTiers([]);
    setPolicyModalOpen(true);
  };

  const openEditPolicy = (policy: LeavePolicy) => {
    setEditingPolicy(policy);
    policyForm.setFieldsValue({
      ...policy,
      effectiveFrom: policy.effectiveFrom ? dayjs(policy.effectiveFrom) : null,
      effectiveTo: policy.effectiveTo ? dayjs(policy.effectiveTo) : null,
      lapseDate: policy.lapseDate ? dayjs(policy.lapseDate) : null,
    });
    setTiers(policy.entitlementTiers ?? []);
    setPolicyModalOpen(true);
  };

  const handleSavePolicy = async () => {
    if (!policyDrawerType) return;
    try {
      const values = await policyForm.validateFields();
      setPolicySaving(true);
      await HrmLeaveService.createOrUpdatePolicy({ organizationId,
        leaveTypeId: policyDrawerType.handle,
        leaveTypeCode: policyDrawerType.code,
        buId: values.buId,
        deptId: values.deptId,
        effectiveFrom: values.effectiveFrom.format("YYYY-MM-DD"),
        effectiveTo: values.effectiveTo ? values.effectiveTo.format("YYYY-MM-DD") : undefined,
        accrualFrequency: values.accrualFrequency,
        accrualQuantity: Number(values.accrualQuantity),
        prorateEnabled: values.prorateEnabled,
        carryForwardAllowed: values.carryForwardAllowed,
        carryForwardCap: Number(values.carryForwardCap ?? 0),
        lapseRule: values.lapseRule,
        lapseDate: values.lapseDate ? values.lapseDate.format("YYYY-MM-DD") : undefined,
        encashmentAllowed: values.encashmentAllowed,
        encashWhen: values.encashWhen,
        encashRateFormula: values.encashRateFormula,
        minEncashableDays: values.minEncashableDays,
        maxEncashableDays: values.maxEncashableDays,
        negativeBalanceAllowed: values.negativeBalanceAllowed,
        negativeFloor: values.negativeFloor,
        coExpiryDays: values.coExpiryDays,
        supervisorSlaDays: Number(values.supervisorSlaDays ?? 2),
        escalationSlaDays: Number(values.escalationSlaDays ?? 1),
        entitlementTiers: tiers.length > 0 ? tiers : undefined,
        createdBy: userId,
      });
      message.success("Policy saved");
      setPolicyModalOpen(false);
      policyForm.resetFields();
      loadPolicies(policyDrawerType);
    } catch {
      message.error("Failed to save policy");
    } finally {
      setPolicySaving(false);
    }
  };

  const handleDeletePolicy = async (policy: LeavePolicy) => {
    if (!policyDrawerType) return;
    try {
      await HrmLeaveService.deletePolicy({ organizationId,
        policyId: policy.handle,
        deletedBy: userId,
      });
      message.success("Policy deleted");
      loadPolicies(policyDrawerType);
    } catch {
      message.error("Failed to delete policy");
    }
  };

  const typeColumns: ColumnsType<LeaveType> = [
    { title: "Code", dataIndex: "code", key: "code", width: 60 },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Alias", dataIndex: "alias", key: "alias", width: 70 },
    {
      title: "Half Day",
      dataIndex: "halfDayAllowed",
      key: "halfDay",
      width: 80,
      render: (v: boolean) => <Tag color={v ? "green" : "default"}>{v ? "Yes" : "No"}</Tag>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 90,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: "Active",
      dataIndex: "active",
      key: "active",
      width: 90,
      render: (v: number, row) => (
        <Can I="edit" object="leave_policy" passIf={true}>
          <Switch
            checked={!!v}
            loading={togglingHandle === row.handle}
            onChange={(checked) => handleToggleActive(row, checked)}
          />
        </Can>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      render: (_, row) => (
        <Space size="small">
          <Can I="edit" object="leave_policy" passIf={true}>
            <Button
              size="small"
              type="link"
              onClick={() => {
                setEditingType(row);
                typeForm.setFieldsValue(row);
                setTypeModalOpen(true);
              }}
            >
              Edit
            </Button>
          </Can>
          <Can I="edit" object="leave_policy" passIf={true}>
            <Button size="small" type="link" onClick={() => openPolicyDrawer(row)}>
              Policies
            </Button>
          </Can>
          <Can I="delete" object="leave_policy" passIf={true}>
            <Popconfirm
              title="Delete this leave type?"
              description="This action cannot be undone."
              onConfirm={() => handleDeleteType(row)}
              okText="Delete"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
            >
              <Button
                size="small"
                type="link"
                danger
                loading={deletingHandle === row.handle}
              >
                Delete
              </Button>
            </Popconfirm>
          </Can>
        </Space>
      ),
    },
  ];

  const policyColumns: ColumnsType<LeavePolicy> = [
    { title: "Effective From", dataIndex: "effectiveFrom", key: "effectiveFrom", width: 130 },
    { title: "Effective To", dataIndex: "effectiveTo", key: "effectiveTo", width: 130 },
    { title: "Freq", dataIndex: "accrualFrequency", key: "accrualFrequency", width: 110 },
    { title: "Qty", dataIndex: "accrualQuantity", key: "accrualQuantity", width: 70 },
    {
      title: "CF",
      dataIndex: "carryForwardAllowed",
      key: "cf",
      width: 60,
      render: (v: boolean) => <Tag color={v ? "green" : "default"}>{v ? "Yes" : "No"}</Tag>,
    },
    {
      title: "Encash",
      dataIndex: "encashmentAllowed",
      key: "encash",
      width: 80,
      render: (v: boolean) => <Tag color={v ? "green" : "default"}>{v ? "Yes" : "No"}</Tag>,
    },
    { title: "Ver", dataIndex: "version", key: "version", width: 60 },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      render: (_v, row) => (
        <Space size="small">
          <Button size="small" type="link" onClick={() => openEditPolicy(row)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this policy?"
            onConfirm={() => handleDeletePolicy(row)}
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
          >
            <Button size="small" type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.policySettings}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <Title level={5} style={{ margin: 0 }}>Leave Types</Title>
        <Can I="add" object="leave_policy" passIf={true}>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setEditingType(null);
              typeForm.resetFields();
              setTypeModalOpen(true);
            }}
          >
            + Add Leave Type
          </Button>
        </Can>
      </div>

      <Table
        dataSource={leaveTypes}
        columns={typeColumns}
        rowKey="handle"
        loading={loading}
        size="small"
        pagination={false}
        locale={{
          emptyText: <Empty description="No leave types configured" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
        }}
      />

      <Modal
        title={editingType ? "Edit Leave Type" : "Add Leave Type"}
        open={typeModalOpen}
        onCancel={() => setTypeModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setTypeModalOpen(false)}>
            Cancel
          </Button>,
          <Can key="save" I={editingType ? "edit" : "add"} object="leave_policy" passIf={true}>
            <Button type="primary" loading={saving} onClick={handleSaveType}>
              OK
            </Button>
          </Can>,
        ]}
      >
        <Form form={typeForm} layout="vertical">
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input placeholder="CL, SL, PL..." disabled={!!editingType} />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="alias" label="Alias">
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select options={LEAVE_CATEGORIES} />
          </Form.Item>
          <Form.Item name="halfDayAllowed" label="Half Day Allowed" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="sortOrder" label="Sort Order">
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={policyDrawerType ? `Policies — ${policyDrawerType.code} ${policyDrawerType.name}` : "Policies"}
        width={900}
        open={policyDrawerOpen}
        onClose={() => {
          setPolicyDrawerOpen(false);
          setPolicyDrawerType(null);
          setPolicies([]);
        }}
        destroyOnClose
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <Text type="secondary">
            Policies are versioned by effective date. A new save creates a new version.
          </Text>
          <Can I="add" object="leave_policy" passIf={true}>
            <Button type="primary" size="small" onClick={openCreatePolicy}>
              + Add Policy
            </Button>
          </Can>
        </div>

        <Table
          dataSource={policies}
          columns={policyColumns}
          rowKey="handle"
          size="small"
          loading={policiesLoading}
          pagination={false}
          locale={{
            emptyText: <Empty description="No policies defined" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          }}
        />
      </Drawer>

      <Modal
        title={editingPolicy ? "Edit Policy" : "Add Policy"}
        open={policyModalOpen}
        onCancel={() => setPolicyModalOpen(false)}
        width={720}
        footer={[
          <Button key="cancel" onClick={() => setPolicyModalOpen(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" loading={policySaving} onClick={handleSavePolicy}>
            Save
          </Button>,
        ]}
      >
        <Form form={policyForm} layout="vertical">
          <Space style={{ width: "100%" }} size="middle">
            <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]}>
              <DatePicker format="DD-MMM-YYYY" />
            </Form.Item>
            <Form.Item name="effectiveTo" label="Effective To">
              <DatePicker format="DD-MMM-YYYY" />
            </Form.Item>
          </Space>
          <Space style={{ width: "100%" }} size="middle">
            <Form.Item name="buId" label="BU (optional)">
              <Input placeholder="All BUs" />
            </Form.Item>
            <Form.Item name="deptId" label="Dept (optional)">
              <Input placeholder="All depts" />
            </Form.Item>
          </Space>
          <Space style={{ width: "100%" }} size="middle">
            <Form.Item
              name="accrualFrequency"
              label="Accrual Frequency"
              rules={[{ required: true }]}
            >
              <Select options={ACCRUAL_FREQUENCIES} style={{ width: 160 }} />
            </Form.Item>
            <Form.Item
              name="accrualQuantity"
              label="Accrual Qty"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} step={0.5} />
            </Form.Item>
            <Form.Item name="prorateEnabled" label="Prorate" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
          <Space style={{ width: "100%" }} size="middle">
            <Form.Item name="carryForwardAllowed" label="Carry Forward" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="carryForwardCap" label="CF Cap">
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item name="lapseRule" label="Lapse Rule">
              <Select options={LAPSE_RULES} style={{ width: 140 }} allowClear />
            </Form.Item>
            <Form.Item name="lapseDate" label="Lapse Date">
              <DatePicker format="DD-MMM-YYYY" />
            </Form.Item>
          </Space>
          <Space style={{ width: "100%" }} size="middle">
            <Form.Item name="encashmentAllowed" label="Encashment" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="encashWhen" label="Encash When">
              <Select options={ENCASH_WHEN_OPTIONS} style={{ width: 160 }} allowClear />
            </Form.Item>
            <Form.Item name="encashRateFormula" label="Encash Formula">
              <Select options={ENCASH_RATE_FORMULAS} style={{ width: 160 }} allowClear />
            </Form.Item>
          </Space>
          <Space style={{ width: "100%" }} size="middle">
            <Form.Item name="negativeBalanceAllowed" label="Allow Negative" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="negativeFloor" label="Negative Floor">
              <InputNumber />
            </Form.Item>
            <Form.Item name="coExpiryDays" label="CO Expiry (days)">
              <InputNumber min={0} />
            </Form.Item>
          </Space>
          <Space style={{ width: "100%" }} size="middle">
            <Form.Item name="supervisorSlaDays" label="Supervisor SLA (days)">
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item name="escalationSlaDays" label="Escalation SLA (days)">
              <InputNumber min={0} />
            </Form.Item>
          </Space>

          {/* Entitlement Tiers */}
          <div style={{ marginTop: 16 }}>
            <Text strong>Entitlement Tiers (Optional)</Text>
            <Text
              type="secondary"
              style={{ display: "block", fontSize: 11, marginBottom: 8 }}
            >
              Define different entitlements based on employee tenure. Leave blank
              to use the standard accrual quantity.
            </Text>

            {tiers.map((tier, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 8,
                  alignItems: "center",
                }}
              >
                <InputNumber
                  placeholder="Min Years"
                  min={0}
                  value={tier.minTenureYears}
                  onChange={(v) => updateTier(idx, "minTenureYears", v)}
                  style={{ width: 100 }}
                />
                <Text>to</Text>
                <InputNumber
                  placeholder="Max Years"
                  min={0}
                  value={tier.maxTenureYears}
                  onChange={(v) => updateTier(idx, "maxTenureYears", v)}
                  style={{ width: 100 }}
                />
                <Text>years →</Text>
                <InputNumber
                  placeholder="Days/Year"
                  min={0}
                  step={0.5}
                  value={tier.annualEntitlement}
                  onChange={(v) => updateTier(idx, "annualEntitlement", v)}
                  style={{ width: 100 }}
                />
                <Text>days</Text>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeTier(idx)}
                />
              </div>
            ))}

            <Button
              type="dashed"
              size="small"
              onClick={addTier}
              icon={<PlusOutlined />}
            >
              Add Tier
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PolicySettingsTable;

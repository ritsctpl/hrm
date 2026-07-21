"use client";

import React, { useState, useEffect } from "react";
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
  Checkbox,
  Row,
  Col,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { PolicySettingsTableProps } from "../../types/ui.types";
import { LeaveType, LeavePolicy, LeaveEntitlementTier } from "../../types/domain.types";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { HrmOrganizationService } from "../../../hrmOrganization/services/hrmOrganizationService";
import { getOrganizationId } from "@/utils/cookieUtils";
import { parseCookies } from "nookies";
import {
  LEAVE_CATEGORIES,
  ACCRUAL_FREQUENCIES,
  LAPSE_RULES,
  ENCASH_WHEN_OPTIONS,
  ENCASH_RATE_FORMULAS,
  GENDER_APPLICABILITY,
  employeeTypeOptionsFor,
  MARITAL_STATUS_APPLICABILITY,
  EMPLOYEE_STATUS_APPLICABILITY,
  ACCRUAL_START_BASIS,
  ACCRUAL_START_BASIS_LABELS,
  summariseCountingRules,
} from "../../utils/constants";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";
import Can from "../../../hrmAccess/components/Can";
import { textSearchFilter, categoryFilter } from "@/components/tableColumnFilters";
import styles from "../../styles/HrmLeave.module.css";

const { Title, Text } = Typography;

/** Subtle section rule — a small heading plus a hairline, no card chrome.
 *  Module-level so it isn't re-created on every render of the table. */
const FormSection: React.FC<{ title: string }> = ({ title }) => (
  <div className={styles.policySection}>
    <span className={styles.policySectionTitle}>{title}</span>
    <span className={styles.policySectionRule} />
  </div>
);

const PolicySettingsTable: React.FC<PolicySettingsTableProps> = ({
  leaveTypes,
  loading,
  organizationId,
  onRefresh,
}) => {
  const cookies = parseCookies();
  const identity = useEmployeeIdentity();
  // Leave service expects composite "EMP0012 - John Doe" for audit fields.
  const userId = identity.employeeIdWithName || cookies.userId || "";
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

  // Watch toggle values to conditionally enable/disable related fields
  const carryForwardOn = Form.useWatch("carryForwardAllowed", policyForm);
  const encashmentOn = Form.useWatch("encashmentAllowed", policyForm);
  const negativeOn = Form.useWatch("negativeBalanceAllowed", policyForm);
  // Earned-Leave watches: the eligibility suffix and the credit-cycle field
  // both read off other inputs, and the encashment formula preview
  // recomputes live from the divisor.
  const accrualFrequency = Form.useWatch("accrualFrequency", policyForm);
  const accrualStartBasis = Form.useWatch("accrualStartBasis", policyForm);
  const encashmentDivisor = Form.useWatch("encashmentBasicDivisor", policyForm);
  const startBasisLabel =
    ACCRUAL_START_BASIS_LABELS[accrualStartBasis || "JOINING"] ?? "Joining";

  // BU and Department dropdowns
  const [buOptions, setBuOptions] = useState<{ value: string; label: string }[]>([]);
  const [deptOptions, setDeptOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedBu, setSelectedBu] = useState<string | undefined>(undefined);

  // Fetch BUs on mount
  useEffect(() => {
    const orgId = organizationId || getOrganizationId();
    if (!orgId) return;
    HrmOrganizationService.fetchBusinessUnitsBySite(orgId)
      .then((bus) => {
        setBuOptions(
          (bus || []).map((bu) => ({
            value: bu.handle || bu.buCode || "",
            label: bu.buName || bu.buCode || bu.handle || "",
          }))
        );
      })
      .catch(() => {});
  }, [organizationId]);

  // Fetch departments when BU changes
  useEffect(() => {
    if (!selectedBu) {
      setDeptOptions([]);
      return;
    }
    const orgId = organizationId || getOrganizationId();
    if (!orgId) return;
    HrmOrganizationService.fetchDepartments(orgId, selectedBu)
      .then((depts) => {
        setDeptOptions(
          (depts || []).map((dept) => ({
            value: dept.handle || dept.deptCode || "",
            label: dept.deptName || dept.deptCode || dept.handle || "",
          }))
        );
      })
      .catch(() => {});
  }, [selectedBu, organizationId]);
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
      applicableGender: "ALL",
      applicableMaritalStatus: "ALL",
      accrualFrequency: "QUARTERLY",
      accrualQuantity: 0,
      prorateEnabled: true,
      accrualStartBasis: "JOINING",
      carryForwardAllowed: false,
      carryForwardCap: 0,
      encashmentAllowed: false,
      negativeBalanceAllowed: false,
      supervisorSlaDays: 2,
      escalationSlaDays: 1,
      // Earned-Leave defaults. These mirror the backend defaults so a policy
      // saved without touching the EL section behaves exactly as it did
      // before the fields existed.
      applicableEmployeeStatus: [],
      eligibilityMonths: 0,
      creditCycleMonths: 12,
      maxAccumulation: 0,
      countWeekOffBefore: false,
      countWeekOffBetween: false,
      countWeekOffAfter: false,
      countHolidayBefore: false,
      countHolidayBetween: false,
      countHolidayAfter: false,
      encashmentAllowedDuringEmployment: false,
      encashmentAllowedDuringExit: false,
      encashmentBasicDivisor: 26,
    });
    setTiers([]);
    setPolicyModalOpen(true);
  };

  const openEditPolicy = (policy: LeavePolicy) => {
    setEditingPolicy(policy);
    policyForm.setFieldsValue({
      ...policy,
      accrualStartBasis: policy.accrualStartBasis || "JOINING",
      // Policies saved before the EL rollout come back without these. Seed
      // the same defaults the create form uses so the section renders in a
      // consistent state instead of showing blank numerics.
      applicableEmployeeStatus: policy.applicableEmployeeStatus ?? [],
      // `availableAfterMonths` was the pre-EL waiting period and means the
      // same thing as `eligibilityMonths`. It no longer has an input, so
      // carry a legacy value forward rather than leaving it enforcing
      // invisibly on the backend — saving then clears the old field.
      eligibilityMonths:
        policy.eligibilityMonths || policy.availableAfterMonths || 0,
      creditCycleMonths: policy.creditCycleMonths ?? 12,
      maxAccumulation: policy.maxAccumulation ?? 0,
      encashmentBasicDivisor: policy.encashmentBasicDivisor ?? 26,
      effectiveFrom: policy.effectiveFrom ? dayjs(policy.effectiveFrom) : null,
      effectiveTo: policy.effectiveTo ? dayjs(policy.effectiveTo) : null,
      lapseDate: policy.lapseDate ? dayjs(policy.lapseDate) : null,
    });
    // Restore the BU so its departments load, and seed the saved department
    // option so the Department field shows the stored name immediately
    // (the dept fetch will replace this list once it resolves).
    setSelectedBu(policy.buId);
    if (policy.deptId) {
      setDeptOptions([
        { value: policy.deptId, label: policy.deptName || policy.deptId },
      ]);
    }
    setTiers(policy.entitlementTiers ?? []);
    setPolicyModalOpen(true);
  };

  const handleSavePolicy = async () => {
    if (!policyDrawerType) return;
    try {
      const values = await policyForm.validateFields();
      setPolicySaving(true);
      await HrmLeaveService.createOrUpdatePolicy({ organizationId,
        handle: editingPolicy?.handle,  // Pass handle for update, undefined for create
        leaveTypeId: policyDrawerType.handle,
        leaveTypeCode: policyDrawerType.code,
        buId: values.buId,
        deptId: values.deptId,
        // Persist the department label alongside the id so it can be shown
        // directly on retrieve without re-resolving against the directory.
        deptName: values.deptId
          ? deptOptions.find((o) => o.value === values.deptId)?.label
          : undefined,
        applicableGender: values.applicableGender,
        applicableMaritalStatus: values.applicableMaritalStatus,
        employeeType: values.employeeType,
        designation: values.designation,
        effectiveFrom: values.effectiveFrom.format("YYYY-MM-DD"),
        effectiveTo: values.effectiveTo ? values.effectiveTo.format("YYYY-MM-DD") : undefined,
        accrualFrequency: values.accrualFrequency,
        accrualQuantity: Number(values.accrualQuantity),
        prorateEnabled: values.prorateEnabled,
        accrualStartBasis: values.accrualStartBasis || "JOINING",
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
        // Retired in favour of `eligibilityMonths`, which means the same
        // thing. Sent as 0 rather than omitted so a legacy value is actively
        // cleared — otherwise the backend keeps enforcing a waiting period
        // that no longer appears anywhere in the UI.
        availableAfterMonths: 0,
        entitlementTiers: tiers.length > 0 ? tiers : undefined,
        // ── Earned-Leave configuration ────────────────────────────────
        applicableEmployeeStatus: values.applicableEmployeeStatus ?? [],
        eligibilityMonths: Number(values.eligibilityMonths ?? 0),
        creditCycleMonths: Number(values.creditCycleMonths ?? 12),
        maxAccumulation: Number(values.maxAccumulation ?? 0),
        countWeekOffBefore: !!values.countWeekOffBefore,
        countWeekOffBetween: !!values.countWeekOffBetween,
        countWeekOffAfter: !!values.countWeekOffAfter,
        countHolidayBefore: !!values.countHolidayBefore,
        countHolidayBetween: !!values.countHolidayBetween,
        countHolidayAfter: !!values.countHolidayAfter,
        encashmentAllowedDuringEmployment: !!values.encashmentAllowedDuringEmployment,
        encashmentAllowedDuringExit: !!values.encashmentAllowedDuringExit,
        encashmentBasicDivisor: Number(values.encashmentBasicDivisor ?? 26),
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
    { title: "Code", dataIndex: "code", key: "code", width: 60, ...textSearchFilter<LeaveType>('code') },
    { title: "Name", dataIndex: "name", key: "name", ...textSearchFilter<LeaveType>('name') },
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
      ...categoryFilter<LeaveType>('category', leaveTypes),
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: "Accruals",
      dataIndex: "accrualEnabled",
      key: "accrualEnabled",
      width: 90,
      render: (v?: boolean) => <Tag color={v ? "green" : "default"}>{v ? "Yes" : "No"}</Tag>,
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
    {
      // Item 1: multiple policies can coexist on the same leave type;
      // surface the active/inactive flag explicitly so admins can see the
      // status of each version without having to read between the lines.
      title: "Status",
      dataIndex: "active",
      key: "active",
      width: 90,
      render: (v: number | undefined) => (
        <Tag color={v ? "green" : "default"}>{v ? "Active" : "Inactive"}</Tag>
      ),
    },
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
    {
      // Driven by the six week-off / holiday flags rather than the legacy
      // `sandwichRuleEnabled` boolean, whose behaviour was the inverse of
      // the current spec (it charged adjacent days and ignored between).
      title: "Calculation",
      key: "counting",
      width: 200,
      render: (_v, row) => {
        const chips = summariseCountingRules(row);
        if (chips.length === 0) {
          return <Text type="secondary" style={{ fontSize: 11 }}>Working days only</Text>;
        }
        return (
          <Space size={[2, 2]} wrap>
            {chips.map((c) => (
              <Tag key={c} style={{ fontSize: 10, marginInlineEnd: 0 }}>{c}</Tag>
            ))}
          </Space>
        );
      },
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
        scroll={{ x: "max-content" }}
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
          <Form.Item
            name="accrualEnabled"
            label="Accruals"
            valuePropName="checked"
            tooltip="When enabled, this leave type is included in accrual runs and appears in the Accruals Preview."
          >
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
          scroll={{ x: "max-content" }}
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
        // Wide enough for a true 4-column grid; the body scrolls while the
        // footer stays pinned, so Save is reachable without scrolling.
        width={1180}
        centered
        zIndex={1100}
        styles={{ body: { paddingTop: 12, paddingBottom: 4 } }}
        footer={[
          <Button key="cancel" onClick={() => setPolicyModalOpen(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" loading={policySaving} onClick={handleSavePolicy}>
            Save
          </Button>,
        ]}
      >
        <Form form={policyForm} layout="vertical" className={styles.policyForm}>
          <div className={styles.policyModalBody}>
            <FormSection title="General" />
            <Row gutter={12}>
              <Col span={6}>
                <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]}>
                  <DatePicker format="DD-MMM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="effectiveTo" label="Effective To">
                  <DatePicker format="DD-MMM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="buId" label="Business Unit" tooltip="Leave blank to apply to all business units.">
                  <Select
                    showSearch
                    allowClear
                    placeholder="All BUs"
                    options={buOptions}
                    onChange={(val) => {
                      setSelectedBu(val);
                      policyForm.setFieldValue("deptId", undefined);
                    }}
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="deptId" label="Department" tooltip="Leave blank to apply to all departments in the selected BU.">
                  <Select
                    showSearch
                    allowClear
                    placeholder={selectedBu ? "Select department" : "Select BU first"}
                    options={deptOptions}
                    disabled={!selectedBu}
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
            {/* Policy applicability: a policy applies when the employee's
                gender / employee-type / designation match, or the field is
                left as ALL / blank. */}
            <Row gutter={12}>
              <Col span={6}>
                <Form.Item
                  name="applicableGender"
                  label="Gender"
                  tooltip="Restrict this policy to a gender. ALL applies to everyone."
                >
                  <Select options={GENDER_APPLICABILITY} placeholder="All" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="applicableMaritalStatus"
                  label="Marital Status"
                  tooltip="Restrict this policy to a marital status. Drives Maternity / Paternity eligibility together with Gender."
                >
                  <Select options={MARITAL_STATUS_APPLICABILITY} placeholder="All" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="employeeType"
                  label="Employee Type"
                  tooltip="The contract the employee holds. For lifecycle stage (probation, confirmed, notice period) use Applicable For instead."
                >
                  {/* Options exclude PERMANENT / PROBATION — those are
                      lifecycle stages owned by Applicable For. A policy saved
                      before the split re-injects its stored value so editing
                      it doesn't silently clear the field. */}
                  <Select
                    allowClear
                    options={employeeTypeOptionsFor(editingPolicy?.employeeType)}
                    placeholder="All contract types"
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="designation"
                  label="Designation"
                  tooltip="Restrict this policy to a designation. Blank applies to all."
                >
                  <Input placeholder="All designations" allowClear />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={24}>
                <Form.Item
                  name="applicableEmployeeStatus"
                  label="Applicable For"
                  tooltip="Employment lifecycle statuses this policy applies to. Empty applies to everyone. Earned Leave is typically restricted to Confirmed (Permanent)."
                >
                  <Select
                    mode="multiple"
                    allowClear
                    options={EMPLOYEE_STATUS_APPLICABILITY}
                    placeholder="All employment statuses"
                    maxTagCount={3}
                  />
                </Form.Item>
              </Col>
            </Row>

            <FormSection title="Accrual Rules" />
            <Row gutter={12}>
              <Col span={6}>
                <Form.Item name="accrualFrequency" label="Accrual Frequency" rules={[{ required: true }]}>
                  <Select options={ACCRUAL_FREQUENCIES} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="accrualQuantity" label="Accrual Qty" rules={[{ required: true }]}>
                  <InputNumber min={0} step={0.5} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="prorateEnabled"
                  label="Prorate"
                  valuePropName="checked"
                  className={styles.policyToggleCell}
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="accrualStartBasis"
                  label="Anchor Date"
                  tooltip="The date both proration and eligibility count from: the employee's joining date, or their confirmation date (probation end)."
                >
                  <Select options={ACCRUAL_START_BASIS} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={6}>
                {/* Reads as a sentence — "Eligible After [12] Months from
                    Confirmation" — so the anchor is never a number whose
                    reference point lives in another field. The anchor itself
                    stays a single control above; this suffix mirrors it. */}
                <Form.Item
                  name="eligibilityMonths"
                  label="Eligible After"
                  tooltip="Months of service from the anchor date before this leave is earned or may be taken. 0 means no waiting period."
                >
                  <InputNumber
                    min={0}
                    precision={0}
                    addonAfter={`Months from ${startBasisLabel}`}
                  />
                </Form.Item>
              </Col>
              {accrualFrequency === "ANNIVERSARY" && (
                <Col span={6}>
                  <Form.Item
                    name="creditCycleMonths"
                    label="Credit Every"
                    tooltip="How often the credit repeats, counted from the anchor date."
                  >
                    <InputNumber min={1} precision={0} addonAfter="Month(s)" />
                  </Form.Item>
                </Col>
              )}
            </Row>

            {/* Six independent flags decide which non-working days inside or
                adjacent to a leave span are charged against the balance.
                "Between" is the classic sandwich rule. These days are now
                actually deducted, not merely previewed. */}
            <FormSection title="Leave Calculation" />
            <Row gutter={12}>
              <Col span={12}>
                <div className={styles.policyCheckGroup}>
                  <div className={styles.policyCheckGroupTitle}>Weekly Off</div>
                  <div className={styles.policyCheckRow}>
                    <Form.Item name="countWeekOffBefore" valuePropName="checked" noStyle>
                      <Checkbox>Before</Checkbox>
                    </Form.Item>
                    <Form.Item name="countWeekOffBetween" valuePropName="checked" noStyle>
                      <Checkbox>Between (Sandwich)</Checkbox>
                    </Form.Item>
                    <Form.Item name="countWeekOffAfter" valuePropName="checked" noStyle>
                      <Checkbox>After</Checkbox>
                    </Form.Item>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.policyCheckGroup}>
                  <div className={styles.policyCheckGroupTitle}>Holiday</div>
                  <div className={styles.policyCheckRow}>
                    <Form.Item name="countHolidayBefore" valuePropName="checked" noStyle>
                      <Checkbox>Before</Checkbox>
                    </Form.Item>
                    <Form.Item name="countHolidayBetween" valuePropName="checked" noStyle>
                      <Checkbox>Between (Sandwich)</Checkbox>
                    </Form.Item>
                    <Form.Item name="countHolidayAfter" valuePropName="checked" noStyle>
                      <Checkbox>After</Checkbox>
                    </Form.Item>
                  </div>
                </div>
              </Col>
            </Row>
            <div className={styles.policyHelper}>
              Sandwiched days are non-working days with leave on both sides.
              Example: leave on Friday and the following Monday charges 4 days,
              because Saturday and Sunday fall between them.
            </div>

            <FormSection title="Carry Forward" />
            <Row gutter={12}>
              <Col span={3}>
                <Form.Item
                  name="carryForwardAllowed"
                  label="Enable"
                  valuePropName="checked"
                  className={styles.policyToggleCell}
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item
                  name="carryForwardCap"
                  label="CF Cap"
                  dependencies={["carryForwardAllowed", "accrualQuantity", "maxAccumulation"]}
                  rules={[
                    ({ getFieldValue }) => ({
                      // CF Cap Count is mandatory only when Carry Forward is enabled.
                      required: !!getFieldValue("carryForwardAllowed"),
                      message: "Required when Carry Forward is enabled.",
                    }),
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        // Only enforce the cap when Carry Forward is on and a value exists.
                        if (!getFieldValue("carryForwardAllowed")) return Promise.resolve();
                        if (value === undefined || value === null || value === "") return Promise.resolve();
                        // Accumulating policies (Earned Leave) legitimately carry
                        // forward far more than one period's accrual — the real
                        // ceiling is Maximum Accumulation. Fall back to the
                        // accrual-quantity guard only when no ceiling is set.
                        const ceiling = Number(getFieldValue("maxAccumulation"));
                        if (Number.isFinite(ceiling) && ceiling > 0) {
                          if (Number(value) > ceiling) {
                            return Promise.reject(
                              new Error("Cannot exceed Max Accumulation."),
                            );
                          }
                          return Promise.resolve();
                        }
                        const accrual = Number(getFieldValue("accrualQuantity"));
                        if (Number.isFinite(accrual) && Number(value) > accrual) {
                          return Promise.reject(
                            new Error("Cannot exceed Accrual Qty."),
                          );
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <InputNumber min={0} disabled={!carryForwardOn} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item
                  name="maxAccumulation"
                  label="Max Accumulation"
                  tooltip="Balance ceiling after carry-forward. Anything above this lapses. 0 means no ceiling."
                >
                  <InputNumber min={0} disabled={!carryForwardOn} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name="lapseRule" label="Lapse Rule">
                  <Select options={LAPSE_RULES} allowClear disabled={!carryForwardOn} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="lapseDate" label="Lapse Date">
                  <DatePicker format="DD-MMM-YYYY" disabled={!carryForwardOn} />
                </Form.Item>
              </Col>
            </Row>
            {/* Display-only: there is no backend flag for this. Balance above
                Maximum Accumulation always lapses and is never encashable, so
                the row states the behaviour rather than offering a choice. */}
            <div className={styles.policyReadout}>
              <span className={styles.policyReadoutLabel}>Lapse Excess Balance</span>
              <Tag color="green" style={{ marginInlineEnd: 0 }}>Yes</Tag>
              <span className={styles.policyReadoutLabel}>
                Balance above Max Accumulation always lapses and cannot be encashed.
              </span>
            </div>

            <FormSection title="Encashment" />
            <Row gutter={12}>
              <Col span={3}>
                <Form.Item
                  name="encashmentAllowed"
                  label="Enable"
                  valuePropName="checked"
                  className={styles.policyToggleCell}
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="encashWhen" label="Encash When">
                  <Select options={ENCASH_WHEN_OPTIONS} allowClear disabled={!encashmentOn} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="encashRateFormula" label="Formula">
                  <Select options={ENCASH_RATE_FORMULAS} allowClear disabled={!encashmentOn} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item name="minEncashableDays" label="Min Days">
                  <InputNumber min={0} disabled={!encashmentOn} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name="maxEncashableDays" label="Max Days">
                  <InputNumber min={0} disabled={!encashmentOn} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={5}>
                <Form.Item
                  name="encashmentAllowedDuringEmployment"
                  label="During Employment"
                  valuePropName="checked"
                  tooltip="When off, employees cannot encash this leave while still employed."
                  className={styles.policyToggleCell}
                >
                  <Switch disabled={!encashmentOn} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item
                  name="encashmentAllowedDuringExit"
                  label="During Exit"
                  valuePropName="checked"
                  tooltip="Permits encashment as part of Full & Final Settlement."
                  className={styles.policyToggleCell}
                >
                  <Switch disabled={!encashmentOn} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item
                  name="encashmentBasicDivisor"
                  label="Basic Divisor"
                  tooltip="Paid days per month used to derive a day's pay in the encashment formula."
                >
                  <InputNumber min={1} disabled={!encashmentOn} />
                </Form.Item>
              </Col>
              <Col span={10}>
                {/* Read-only preview so the configured divisor is legible as
                    the formula it actually produces. */}
                <Form.Item label="Formula Preview">
                  <div className={styles.policyReadout}>
                    <Text strong style={{ fontSize: 13 }}>
                      (Basic Salary / {Number(encashmentDivisor) > 0 ? encashmentDivisor : 26}) ×
                      Accumulated {policyDrawerType?.code ?? "Leave"} Days
                    </Text>
                  </div>
                </Form.Item>
              </Col>
            </Row>

            <FormSection title="Other Rules" />
            <Row gutter={12}>
              <Col span={4}>
                <Form.Item
                  name="negativeBalanceAllowed"
                  label="Allow Negative"
                  valuePropName="checked"
                  className={styles.policyToggleCell}
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name="negativeFloor" label="Negative Floor">
                  <InputNumber disabled={!negativeOn} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name="coExpiryDays" label="CO Expiry (days)">
                  <InputNumber min={0} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name="supervisorSlaDays" label="Supervisor SLA (days)">
                  <InputNumber min={0} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name="escalationSlaDays" label="Escalation SLA (days)">
                  <InputNumber min={0} />
                </Form.Item>
              </Col>
            </Row>

            <FormSection title="Entitlement Tiers (Optional)" />
            <div className={styles.policyHelper} style={{ marginTop: 0, marginBottom: 8 }}>
              Different entitlements by tenure. Leave empty to use the standard
              accrual quantity.
            </div>
            {tiers.map((tier, idx) => (
              <div key={idx} className={styles.policyTierRow}>
                <InputNumber
                  placeholder="Min Years"
                  min={0}
                  value={tier.minTenureYears}
                  onChange={(v) => updateTier(idx, "minTenureYears", v)}
                  style={{ width: 110 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>to</Text>
                <InputNumber
                  placeholder="Max Years"
                  min={0}
                  value={tier.maxTenureYears}
                  onChange={(v) => updateTier(idx, "maxTenureYears", v)}
                  style={{ width: 110 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>years →</Text>
                <InputNumber
                  placeholder="Days/Year"
                  min={0}
                  step={0.5}
                  value={tier.annualEntitlement}
                  onChange={(v) => updateTier(idx, "annualEntitlement", v)}
                  style={{ width: 110 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>days</Text>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeTier(idx)}
                />
              </div>
            ))}
            <Button type="dashed" size="small" onClick={addTier} icon={<PlusOutlined />}>
              Add Tier
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PolicySettingsTable;

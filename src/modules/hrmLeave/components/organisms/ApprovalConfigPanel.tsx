"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Empty,
  Form,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { parseCookies } from "nookies";
import dayjs from "dayjs";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { ApprovalLevel, DelegationEntry } from "../../types/api.types";
import { useEmployeeOptions } from "../../hooks/useEmployeeOptions";
import { useEmployeeIdentity } from "../../../hrmAccess/hooks/useEmployeeIdentity";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const { Title, Text } = Typography;

const ROLE_OPTIONS = [
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "NEXT_SUPERIOR", label: "Next Superior" },
  { value: "HR", label: "HR" },
];

interface ApprovalConfigPanelProps {
  organizationId: string;
}

const ApprovalConfigPanel: React.FC<ApprovalConfigPanelProps> = ({ organizationId }) => {
  const cookies = parseCookies();
  const identity = useEmployeeIdentity();
  // Leave service expects composite "EMP0012 - John Doe" for audit fields.
  const userId = identity.employeeIdWithName || cookies.userId || "";
  const [form] = Form.useForm();
  const [delegationForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [levels, setLevels] = useState<ApprovalLevel[]>([]);

  // ── Delegation state ──────────────────────────────────────────────
  const [delegations, setDelegations] = useState<DelegationEntry[]>([]);
  const [delegationLoading, setDelegationLoading] = useState(false);
  const [showDelegationForm, setShowDelegationForm] = useState(false);
  const [delegationSaving, setDelegationSaving] = useState(false);
  const { options: employeeOptions, loading: employeesLoading } = useEmployeeOptions();

  const loadConfig = async () => {
    setLoading(true);
    try {
      const cfg = await HrmLeaveService.getApprovalConfig({ organizationId });
      if (cfg) {
        form.setFieldsValue({
          autoEscalateDays: cfg.autoEscalateDays,
          notifyHrOnEscalation: cfg.notifyHrOnEscalation,
        });
        setLevels(cfg.levels ?? []);
      } else {
        form.setFieldsValue({ autoEscalateDays: 2, notifyHrOnEscalation: true });
        setLevels([]);
      }
    } catch {
      message.error("Failed to load approval config");
    } finally {
      setLoading(false);
    }
  };

  // ── Delegation data loading ──────────────────────────────────────
  // TODO: Backend endpoint not yet implemented
  const loadDelegations = useCallback(async () => {
    setDelegationLoading(true);
    try {
      const data = await HrmLeaveService.getDelegations({ organizationId });
      setDelegations(data);
    } catch (err) {
      // Silently fail — delegation endpoint may not exist yet.
      // Show empty table instead of an error toast.
      console.warn("Delegation load failed (endpoint may not exist yet):", err);
      setDelegations([]);
    } finally {
      setDelegationLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      loadConfig();
      loadDelegations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  // ── Delegation handlers ────────────────────────────────────────────
  const handleSaveDelegation = async () => {
    try {
      const values = await delegationForm.validateFields();
      setDelegationSaving(true);
      await HrmLeaveService.setDelegation({
        organizationId,
        approverId: values.approverId,
        delegateIds: [values.delegateId],
        fromDate: values.fromDate.format("YYYY-MM-DD"),
        toDate: values.toDate.format("YYYY-MM-DD"),
      });
      message.success("Delegation saved");
      delegationForm.resetFields();
      setShowDelegationForm(false);
      loadDelegations();
    } catch {
      message.error("Failed to save delegation");
    } finally {
      setDelegationSaving(false);
    }
  };

  const handleDeleteDelegation = async (handle: string) => {
    try {
      await HrmLeaveService.deleteDelegation({ organizationId, handle });
      message.success("Delegation removed");
      loadDelegations();
    } catch {
      message.error("Failed to delete delegation");
    }
  };

  const handleAddLevel = () => {
    const nextLevel = levels.length + 1;
    setLevels([...levels, { level: nextLevel, role: "SUPERVISOR", required: true }]);
  };

  const handleRemoveLevel = (idx: number) => {
    const next = levels
      .filter((_, i) => i !== idx)
      .map((lvl, i) => ({ ...lvl, level: i + 1 }));
    setLevels(next);
  };

  const handleLevelChange = (idx: number, patch: Partial<ApprovalLevel>) => {
    setLevels(levels.map((lvl, i) => (i === idx ? { ...lvl, ...patch } : lvl)));
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        organizationId,
        levels,
        autoEscalateDays: values.autoEscalateDays,
        notifyHrOnEscalation: values.notifyHrOnEscalation,
        modifiedBy: userId,
      };
      await HrmLeaveService.saveApprovalConfig(payload);
      message.success("Approval config saved");
      loadConfig();
    } catch {
      message.error("Failed to save approval config");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<ApprovalLevel> = [
    { title: "Level", dataIndex: "level", key: "level", width: 80 },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (v: string, _row, idx) => (
        <Select
          value={v}
          options={ROLE_OPTIONS}
          style={{ width: 180 }}
          onChange={(val) => handleLevelChange(idx, { role: val as ApprovalLevel["role"] })}
        />
      ),
    },
    {
      title: "Required",
      dataIndex: "required",
      key: "required",
      width: 110,
      render: (v: boolean, _row, idx) => (
        <Switch checked={v} onChange={(val) => handleLevelChange(idx, { required: val })} />
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_v, _row, idx) => (
        <Button size="small" danger type="link" onClick={() => handleRemoveLevel(idx)}>
          Remove
        </Button>
      ),
    },
  ];

  const delegationColumns: ColumnsType<DelegationEntry> = [
    {
      title: "Approver",
      dataIndex: "approverName",
      key: "approverName",
    },
    {
      title: "Delegate",
      dataIndex: "delegateName",
      key: "delegateName",
    },
    {
      title: "From",
      dataIndex: "fromDate",
      key: "fromDate",
      width: 120,
    },
    {
      title: "To",
      dataIndex: "toDate",
      key: "toDate",
      width: 120,
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_v, row) => (
        <Popconfirm
          title="Remove this delegation?"
          onConfirm={() => handleDeleteDelegation(row.handle)}
          okText="Yes"
          cancelText="No"
        >
          <Button size="small" danger type="link">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const employeeFilterOption = (
    input: string,
    option?: { label: string; value: string },
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  return (
    <div className={styles.approvalConfigPanel}>
      <Title level={5}>Approval Configuration</Title>

      <Card size="small" loading={loading}>
        <Form form={form} layout="vertical" style={{ maxWidth: 520 }}>
          <Form.Item
            name="autoEscalateDays"
            label="Auto Escalate After (days)"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} max={30} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item
            name="notifyHrOnEscalation"
            label="Notify HR on Escalation"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16, marginBottom: 8 }}>
          <Space style={{ justifyContent: "space-between", width: "100%", display: "flex" }}>
            <Text strong>Approval Levels</Text>
            <Button size="small" onClick={handleAddLevel}>
              + Add Level
            </Button>
          </Space>
        </div>

        <Table
          dataSource={levels}
          columns={columns}
          rowKey={(row) => `level-${row.level}`}
          size="small"
          pagination={false}
          locale={{
            emptyText: <Empty description="No levels defined" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          }}
        />

        <div style={{ marginTop: 16 }}>
          <Can I="edit" object="leave_approval_config" passIf={true}>
            <Button type="primary" onClick={handleSave} loading={saving}>
              Save Config
            </Button>
          </Can>
        </div>
      </Card>

      {/* ── Approval Delegation ──────────────────────────────────────── */}
      <Divider />
      <Title level={5}>Approval Delegation</Title>

      <Card size="small" loading={delegationLoading}>
        <Space
          style={{
            justifyContent: "space-between",
            width: "100%",
            display: "flex",
            marginBottom: 12,
          }}
        >
          <Text strong>Active Delegations</Text>
          <Can I="edit" object="leave_approval_config" passIf={true}>
            <Button
              size="small"
              onClick={() => setShowDelegationForm(true)}
            >
              + Add Delegation
            </Button>
          </Can>
        </Space>

        <Table
          dataSource={delegations}
          columns={delegationColumns}
          rowKey="handle"
          size="small"
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                description="No delegations configured"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>

      {/* ── Delegation Modal ─────────────────────────────────────────── */}
      <Modal
        title="Add Delegation"
        open={showDelegationForm}
        onCancel={() => {
          setShowDelegationForm(false);
          delegationForm.resetFields();
        }}
        onOk={handleSaveDelegation}
        confirmLoading={delegationSaving}
        okText="Save"
        destroyOnClose
      >
        <Form
          form={delegationForm}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="approverId"
            label="Approver"
            rules={[{ required: true, message: "Please select an approver" }]}
          >
            <Select
              showSearch
              placeholder="Search employee..."
              options={employeeOptions}
              loading={employeesLoading}
              filterOption={employeeFilterOption}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="delegateId"
            label="Delegate"
            dependencies={["approverId"]}
            rules={[
              { required: true, message: "Please select a delegate" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("approverId") !== value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Delegate must be different from Approver"),
                  );
                },
              }),
            ]}
          >
            <Select
              showSearch
              placeholder="Search employee..."
              options={employeeOptions}
              loading={employeesLoading}
              filterOption={employeeFilterOption}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="fromDate"
            label="From Date"
            rules={[{ required: true, message: "Please select from date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="toDate"
            label="To Date"
            dependencies={["fromDate"]}
            rules={[
              { required: true, message: "Please select to date" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || !getFieldValue("fromDate")) {
                    return Promise.resolve();
                  }
                  if (
                    dayjs(value).isBefore(dayjs(getFieldValue("fromDate")))
                  ) {
                    return Promise.reject(
                      new Error("To Date must be on or after From Date"),
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ApprovalConfigPanel;

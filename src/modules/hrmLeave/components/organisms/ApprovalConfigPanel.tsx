"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Form,
  InputNumber,
  Select,
  Space,
  Switch,
  Table,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { ApprovalLevel, LeaveApprovalConfig } from "../../types/api.types";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const { Title, Text } = Typography;

const ROLE_OPTIONS = [
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "NEXT_SUPERIOR", label: "Next Superior" },
  { value: "HR", label: "HR" },
];

interface ApprovalConfigPanelProps {
  site: string;
}

const ApprovalConfigPanel: React.FC<ApprovalConfigPanelProps> = ({ site }) => {
  const cookies = parseCookies();
  const userId = cookies.userId ?? "";
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [levels, setLevels] = useState<ApprovalLevel[]>([]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const cfg = await HrmLeaveService.getApprovalConfig({ site });
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

  useEffect(() => {
    if (site) loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site]);

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
        site,
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
    </div>
  );
};

export default ApprovalConfigPanel;

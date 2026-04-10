"use client";

import React, { useState } from "react";
import { Table, Tag, Button, Empty, Typography, Modal, Form, Input, Select, Switch, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PolicySettingsTableProps } from "../../types/ui.types";
import { LeaveType } from "../../types/domain.types";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { parseCookies } from "nookies";
import { LEAVE_CATEGORIES } from "../../utils/constants";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const { Title, Text } = Typography;

const PolicySettingsTable: React.FC<PolicySettingsTableProps> = ({
  leaveTypes,
  loading,
  site,
  onRefresh,
}) => {
  const cookies = parseCookies();
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [typeForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleSaveType = async () => {
    try {
      const values = await typeForm.validateFields();
      setSaving(true);
      if (editingType) {
        await HrmLeaveService.updateLeaveType({ site, ...values });
      } else {
        await HrmLeaveService.createLeaveType({ site, ...values });
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
      width: 70,
      render: (v: boolean) => <Tag color={v ? "green" : "red"}>{v ? "Yes" : "No"}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, row) => (
        <Can I="edit">
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
      ),
    },
  ];

  return (
    <div className={styles.policySettings}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <Title level={5} style={{ margin: 0 }}>Leave Types</Title>
        <Can I="add">
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
          <Can key="save" I={editingType ? "edit" : "add"}>
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
    </div>
  );
};

export default PolicySettingsTable;

"use client";

import React, { useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Checkbox, Switch, message, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { parseCookies } from "nookies";
import { HrmExpenseService } from "../../services/hrmExpenseService";
import type { ExpenseCategory } from "../../types/domain.types";

interface Props {
  categories: ExpenseCategory[];
  onRefresh: () => void;
}

const ExpenseCategoryConfig: React.FC<Props> = ({ categories, onRefresh }) => {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const openModal = (category?: ExpenseCategory) => {
    setEditingCategory(category ?? null);
    form.setFieldsValue(
      category
        ? { ...category }
        : { requiresReceipt: true, active: true, sortOrder: categories.length + 1 }
    );
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await HrmExpenseService.saveCategory({
        site,
        ...(editingCategory ? { handle: editingCategory.handle } : {}),
        ...values,
      });
      message.success(`Category ${editingCategory ? "updated" : "created"}.`);
      setModalOpen(false);
      onRefresh();
    } catch {
      message.error("Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (handle: string) => {
    try {
      await HrmExpenseService.deleteCategory({ site, handle });
      message.success("Category deleted.");
      onRefresh();
    } catch {
      message.error("Failed to delete category.");
    }
  };

  const columns: ColumnsType<ExpenseCategory> = [
    { title: "Code", dataIndex: "code", width: 100 },
    { title: "Name", dataIndex: "name" },
    { title: "Daily Limit (INR)", dataIndex: "dailyLimitInr", width: 140, render: (v) => v ? v.toLocaleString() : "—" },
    { title: "Requires Receipt", dataIndex: "requiresReceipt", width: 140, render: (v) => v ? "Yes" : "No" },
    {
      title: "Active",
      dataIndex: "active",
      width: 80,
      render: (v) => <Switch size="small" checked={v} disabled />,
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, r) => (
        <>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
          <Popconfirm title="Delete category?" onConfirm={() => handleDelete(r.handle)}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          Add Category
        </Button>
      </div>

      <Table rowKey="handle" columns={columns} dataSource={categories} size="small" pagination={false} />

      <Modal
        title={editingCategory ? "Edit Category" : "Add Category"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Code" name="code" rules={[{ required: true }]}>
            <Input disabled={!!editingCategory} />
          </Form.Item>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Daily Limit (INR)" name="dailyLimitInr">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="requiresReceipt" valuePropName="checked">
            <Checkbox>Requires Receipt</Checkbox>
          </Form.Item>
          <Form.Item name="active" valuePropName="checked">
            <Checkbox>Active</Checkbox>
          </Form.Item>
          <Form.Item label="Sort Order" name="sortOrder">
            <InputNumber min={1} style={{ width: 100 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExpenseCategoryConfig;

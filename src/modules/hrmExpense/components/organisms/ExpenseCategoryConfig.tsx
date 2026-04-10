"use client";

import React, { useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Checkbox, Switch, message, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { parseCookies } from "nookies";
import { HrmExpenseService } from "../../services/hrmExpenseService";
import type { ExpenseCategory } from "../../types/domain.types";
import Can from "../../../hrmAccess/components/Can";

interface Props {
  categories: ExpenseCategory[];
  onRefresh: () => void;
}

const ExpenseCategoryConfig: React.FC<Props> = ({ categories, onRefresh }) => {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const userId = cookies.userId ?? "";
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const openModal = (category?: ExpenseCategory) => {
    setEditingCategory(category ?? null);
    form.setFieldsValue(
      category
        ? { ...category }
        : { requiresAttachment: true, mileageCategory: false }
    );
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await HrmExpenseService.saveCategory({
        site,
        categoryCode: values.categoryCode,
        categoryName: values.categoryName,
        description: values.description,
        dailyLimit: values.dailyLimit,
        perTripLimit: values.perTripLimit,
        requiresAttachment: values.requiresAttachment,
        mileageCategory: values.mileageCategory,
        mileageRatePerKm: values.mileageRatePerKm,
        createdBy: userId,
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

  const handleDelete = async (categoryId: string) => {
    try {
      await HrmExpenseService.deleteCategory({ site, categoryId, deletedBy: userId });
      message.success("Category deleted.");
      onRefresh();
    } catch {
      message.error("Failed to delete category.");
    }
  };

  const columns: ColumnsType<ExpenseCategory> = [
    { title: "Code", dataIndex: "categoryCode", width: 100 },
    { title: "Name", dataIndex: "categoryName" },
    { title: "Daily Limit", dataIndex: "dailyLimit", width: 140, render: (v) => v ? v.toLocaleString() : "\u2014" },
    { title: "Requires Attachment", dataIndex: "requiresAttachment", width: 160, render: (v) => v ? "Yes" : "No" },
    { title: "Mileage", dataIndex: "mileageCategory", width: 90, render: (v) => v ? "Yes" : "No" },
    {
      title: "Active",
      dataIndex: "active",
      width: 80,
      render: (v) => <Switch size="small" checked={!!v} disabled />,
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, r) => (
        <>
          <Can I="edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
          </Can>
          <Can I="delete">
            <Popconfirm title="Delete category?" onConfirm={() => handleDelete(r.handle)}>
              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Can>
        </>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Can I="add">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Add Category
          </Button>
        </Can>
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
          <Form.Item label="Category Code" name="categoryCode" rules={[{ required: true }]}>
            <Input disabled={!!editingCategory} />
          </Form.Item>
          <Form.Item label="Category Name" name="categoryName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input />
          </Form.Item>
          <Form.Item label="Daily Limit" name="dailyLimit">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Per Trip Limit" name="perTripLimit">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="requiresAttachment" valuePropName="checked">
            <Checkbox>Requires Attachment</Checkbox>
          </Form.Item>
          <Form.Item name="mileageCategory" valuePropName="checked">
            <Checkbox>Mileage Category</Checkbox>
          </Form.Item>
          <Form.Item label="Mileage Rate Per KM" name="mileageRatePerKm">
            <InputNumber min={0} step={0.5} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExpenseCategoryConfig;

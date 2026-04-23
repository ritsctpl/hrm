"use client";

import React, { useState } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { Table, Button, Modal, Form, Input, InputNumber, Checkbox, Switch, message, Popconfirm, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { parseCookies } from "nookies";
import { HrmExpenseService } from "../../services/hrmExpenseService";
import type { ExpenseCategory } from "../../types/domain.types";
import Can from "../../../hrmAccess/components/Can";

interface Props {
  categories: ExpenseCategory[];
  onRefresh: () => void | Promise<void>;
}

const ExpenseCategoryConfig: React.FC<Props> = ({ categories, onRefresh }) => {
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const userId = cookies.userId ?? "";
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [form] = Form.useForm();

  const openModal = (category?: ExpenseCategory) => {
    setEditingCategory(category ?? null);
    form.resetFields();
    form.setFieldsValue(
      category
        ? { ...category, active: category.active === 1 }
        : { requiresAttachment: true, mileageCategory: false, active: true }
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await HrmExpenseService.saveCategory({
        organizationId,
        categoryCode: values.categoryCode,
        categoryName: values.categoryName,
        description: values.description,
        dailyLimit: values.dailyLimit,
        perTripLimit: values.perTripLimit,
        requiresAttachment: values.requiresAttachment,
        mileageCategory: values.mileageCategory,
        mileageRatePerKm: values.mileageCategory ? values.mileageRatePerKm : undefined,
        active: values.active ? 1 : 0,
        createdBy: userId,
        modifiedBy: userId,
      });
      message.success(`Category ${editingCategory ? "updated" : "created"}.`);
      closeModal();
      await onRefresh();
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;
      console.error("[Expense] Failed to save category:", error);
      message.error(backendMessage || "Failed to save category.");
    }
    finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await HrmExpenseService.deleteCategory({ organizationId, categoryId, deletedBy: userId });
      message.success("Category deleted.");
      await onRefresh();
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;
      console.error("[Expense] Failed to delete category:", error);
      message.error(backendMessage || "Failed to delete category.");
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (!showInactive && !c.active) return false;
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      c.categoryCode?.toLowerCase().includes(q) ||
      c.categoryName?.toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q)
    );
  });

  const columns: ColumnsType<ExpenseCategory> = [
    {
      title: "Code",
      dataIndex: "categoryCode",
      width: 120,
      sorter: (a, b) => a.categoryCode.localeCompare(b.categoryCode),
    },
    {
      title: "Name",
      dataIndex: "categoryName",
      sorter: (a, b) => a.categoryName.localeCompare(b.categoryName),
    },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
      render: (v) => v || "—",
    },
    {
      title: "Daily Limit",
      dataIndex: "dailyLimit",
      width: 120,
      align: "right",
      render: (v) => (v ? v.toLocaleString() : "—"),
    },
    {
      title: "Per Trip Limit",
      dataIndex: "perTripLimit",
      width: 130,
      align: "right",
      render: (v) => (v ? v.toLocaleString() : "—"),
    },
    {
      title: "Requires Attachment",
      dataIndex: "requiresAttachment",
      width: 160,
      render: (v) => (v ? "Yes" : "No"),
    },
    {
      title: "Mileage",
      dataIndex: "mileageCategory",
      width: 150,
      render: (v, r) =>
        v ? <Tag color="blue">{`Yes (${r.mileageRatePerKm ?? 0}/km)`}</Tag> : "No",
    },
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
          <Can I="edit" object="expense_category">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
          </Can>
          <Can I="delete" object="expense_category">
            <Popconfirm
              title="Delete this category?"
              description="If this category is referenced by existing expense items, deletion may be rejected. Consider deactivating instead."
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(r.handle)}
            >
              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Can>
        </>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Input
            placeholder="Search by code, name, description"
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />
          <Checkbox checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)}>
            Show inactive
          </Checkbox>
        </div>
        <Can I="add" object="expense_category">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Add Category
          </Button>
        </Can>
      </div>

      <Table
        rowKey="handle"
        columns={columns}
        dataSource={filteredCategories}
        size="small"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total ${t}` }}
      />

      <Modal
        title={editingCategory ? "Edit Category" : "Add Category"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        confirmLoading={saving}
        okText="Save"
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Category Code"
            name="categoryCode"
            rules={[
              { required: true, message: "Category code is required" },
              { pattern: /^[A-Z0-9_]+$/, message: "Use uppercase letters, numbers, and underscores only" },
              { max: 32, message: "Max 32 characters" },
            ]}
          >
            <Input disabled={!!editingCategory} placeholder="e.g., MEALS, ACCOMMODATION, MILEAGE" />
          </Form.Item>
          <Form.Item
            label="Category Name"
            name="categoryName"
            rules={[
              { required: true, message: "Category name is required" },
              { max: 80, message: "Max 80 characters" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="description" rules={[{ max: 200, message: "Max 200 characters" }]}>
            <Input.TextArea rows={2} maxLength={200} showCount />
          </Form.Item>
          <Form.Item
            label="Daily Limit"
            name="dailyLimit"
            tooltip="Maximum claim amount per day for this category"
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="Per Trip Limit"
            name="perTripLimit"
            tooltip="Maximum claim amount per trip for this category"
            dependencies={["dailyLimit"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const daily = getFieldValue("dailyLimit");
                  if (value != null && daily != null && Number(value) < Number(daily)) {
                    return Promise.reject(new Error("Per-trip limit should be ≥ daily limit"));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="requiresAttachment" valuePropName="checked">
            <Checkbox>Requires Attachment (receipt)</Checkbox>
          </Form.Item>
          <Form.Item name="mileageCategory" valuePropName="checked">
            <Checkbox>Mileage Category</Checkbox>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.mileageCategory !== curr.mileageCategory}
          >
            {({ getFieldValue }) =>
              getFieldValue("mileageCategory") ? (
                <Form.Item
                  label="Mileage Rate Per KM"
                  name="mileageRatePerKm"
                  rules={[
                    { required: true, message: "Rate per km is required for mileage categories" },
                    { type: "number", min: 0.01, message: "Rate must be > 0" },
                  ]}
                >
                  <InputNumber min={0} step={0.5} style={{ width: "100%" }} />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="active" valuePropName="checked" label="Active">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExpenseCategoryConfig;

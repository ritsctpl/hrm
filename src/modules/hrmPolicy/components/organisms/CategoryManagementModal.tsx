"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Table,
  Button,
  Form,
  Input,
  Space,
  Popconfirm,
  Tooltip,
  message,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { parseCookies } from "nookies";
import { HrmPolicyService } from "../../services/hrmPolicyService";
import type { PolicyCategory } from "../../types/domain.types";
import Can from "../../../hrmAccess/components/Can";

interface CategoryManagementModalProps {
  open: boolean;
  organizationId: string;
  categories: PolicyCategory[];
  onClose: () => void;
  /** Called after any successful create/update/delete so the parent can refetch. */
  onChanged: () => void;
}

interface CategoryFormValues {
  categoryCode: string;
  categoryName: string;
  description?: string;
}

/**
 * Drives Add Category (inline form row), Edit (row → form), Delete (row action).
 * Keeps state local — every successful mutation triggers `onChanged()` so the
 * parent re-runs the cached `loadCategories()` and refreshes the dropdown
 * downstream consumers (e.g. PolicyFormDrawer) read from.
 */
const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  open,
  organizationId,
  categories,
  onClose,
  onChanged,
}) => {
  const [form] = Form.useForm<CategoryFormValues>();
  const [adding, setAdding] = useState(false);
  const [editingHandle, setEditingHandle] = useState<string | null>(null);
  const [busyHandle, setBusyHandle] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cookies = parseCookies();
  const userId = cookies.rl_user_id ?? cookies.userId ?? "system";

  // Reset transient state every time the modal opens so re-opens don't leak
  // a half-filled add row from a previous session.
  useEffect(() => {
    if (open) {
      form.resetFields();
      setAdding(false);
      setEditingHandle(null);
      setBusyHandle(null);
      setSubmitting(false);
    }
  }, [open, form]);

  const startAdd = () => {
    setEditingHandle(null);
    form.resetFields();
    setAdding(true);
  };

  const startEdit = (cat: PolicyCategory) => {
    setAdding(false);
    setEditingHandle(cat.handle);
    form.setFieldsValue({
      categoryCode: cat.categoryCode,
      categoryName: cat.categoryName,
      description: cat.description ?? "",
    });
  };

  const cancelForm = () => {
    setAdding(false);
    setEditingHandle(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingHandle) {
        // BE update uses { categoryId, name } — the older Update DTO doesn't
        // accept categoryCode (it's immutable post-create) so we only push
        // name + description here.
        await HrmPolicyService.updateCategory({
          organizationId,
          categoryId: editingHandle,
          name: values.categoryName,
          description: values.description || undefined,
          modifiedBy: userId,
        });
        message.success("Category updated.");
      } else {
        await HrmPolicyService.createCategory({
          organizationId,
          categoryCode: values.categoryCode.trim(),
          categoryName: values.categoryName.trim(),
          description: values.description || undefined,
          createdBy: userId,
        });
        message.success("Category created.");
      }

      cancelForm();
      onChanged();
    } catch (err) {
      const apiErr = err as {
        response?: { data?: { message_details?: { msg?: string }; message?: string } };
        message?: string;
        errorFields?: unknown;
      };
      // Form-validation failures already surface inline — only toast API
      // errors so users don't get a duplicate "field is required" toast.
      if (!apiErr.errorFields) {
        const detail =
          apiErr.response?.data?.message_details?.msg ||
          apiErr.response?.data?.message ||
          apiErr.message ||
          "Failed to save category.";
        message.error(detail);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: PolicyCategory) => {
    setBusyHandle(cat.handle);
    try {
      await HrmPolicyService.deleteCategory({
        organizationId,
        categoryId: cat.handle,
        deletedBy: userId,
      });
      message.success(`Category "${cat.categoryName}" deleted.`);
      onChanged();
    } catch (err) {
      const apiErr = err as {
        response?: { data?: { message_details?: { msg?: string }; message?: string } };
        message?: string;
      };
      const detail =
        apiErr.response?.data?.message_details?.msg ||
        apiErr.response?.data?.message ||
        apiErr.message ||
        "Failed to delete category.";
      message.error(detail);
    } finally {
      setBusyHandle(null);
    }
  };

  const formActive = adding || editingHandle !== null;

  const columns: ColumnsType<PolicyCategory> = [
    { title: "Code", dataIndex: "categoryCode", key: "categoryCode", width: 130 },
    { title: "Name", dataIndex: "categoryName", key: "categoryName" },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (v?: string) => v || <span style={{ color: "#bfbfbf" }}>—</span>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      render: (_, record) => (
        <Space size={4}>
          <Can I="edit">
            <Tooltip title="Edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                disabled={formActive}
                onClick={() => startEdit(record)}
              />
            </Tooltip>
          </Can>
          <Can I="delete">
            <Popconfirm
              title="Delete this category?"
              description="Policies linked to this category may need re-categorising."
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record)}
            >
              <Tooltip title="Delete">
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={busyHandle === record.handle}
                  disabled={formActive}
                />
              </Tooltip>
            </Popconfirm>
          </Can>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title="Manage Policy Categories"
      open={open}
      onCancel={submitting ? undefined : onClose}
      maskClosable={!submitting}
      width={760}
      footer={
        <Button onClick={onClose} disabled={submitting}>
          Close
        </Button>
      }
    >
      <Can I="add">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={startAdd}
          disabled={formActive}
          style={{ marginBottom: 12 }}
        >
          Add Category
        </Button>
      </Can>

      {formActive && (
        <Form
          form={form}
          layout="vertical"
          style={{
            background: "#fafafa",
            padding: 12,
            borderRadius: 4,
            marginBottom: 12,
          }}
        >
          <Space align="start" style={{ width: "100%" }}>
            <Form.Item
              name="categoryCode"
              label="Code"
              rules={[
                { required: true, message: "Required" },
                { max: 30, message: "Max 30 chars" },
              ]}
              style={{ marginBottom: 8 }}
            >
              <Input
                placeholder="e.g. HR_LEAVE"
                disabled={!!editingHandle}
                style={{ width: 160 }}
              />
            </Form.Item>
            <Form.Item
              name="categoryName"
              label="Name"
              rules={[{ required: true, message: "Required" }]}
              style={{ marginBottom: 8 }}
            >
              <Input placeholder="e.g. Leave Policies" style={{ width: 220 }} />
            </Form.Item>
            <Form.Item name="description" label="Description" style={{ marginBottom: 8 }}>
              <Input placeholder="Optional" style={{ width: 220 }} />
            </Form.Item>
          </Space>
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={submitting}
            >
              {editingHandle ? "Update" : "Create"}
            </Button>
            <Button icon={<CloseOutlined />} onClick={cancelForm} disabled={submitting}>
              Cancel
            </Button>
          </Space>
        </Form>
      )}

      {categories.length === 0 ? (
        <Empty description="No categories yet — add one to get started." />
      ) : (
        <Table
          rowKey="handle"
          size="small"
          columns={columns}
          dataSource={categories}
          pagination={false}
          scroll={{ y: 320 }}
        />
      )}
    </Modal>
  );
};

export default CategoryManagementModal;

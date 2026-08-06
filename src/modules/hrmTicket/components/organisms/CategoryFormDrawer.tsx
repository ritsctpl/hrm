'use client';

import React, { useEffect } from 'react';
import { Button, Drawer, Form, Input, InputNumber, Select, Space, Switch } from 'antd';
import type { TicketCategory, TicketSupportGroup } from '../../types/domain.types';
import type { TicketCategoryFormValues } from '../../types/ui.types';
import { PRIORITY_OPTIONS } from '../../utils/ticketConstants';

interface Props {
  open: boolean;
  editCategory?: TicketCategory | null;
  categories: TicketCategory[];
  supportGroups: TicketSupportGroup[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: TicketCategoryFormValues, isEdit: boolean) => Promise<boolean>;
}

const CategoryFormDrawer: React.FC<Props> = ({
  open,
  editCategory,
  categories,
  supportGroups,
  saving,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm<TicketCategoryFormValues>();
  const isEdit = Boolean(editCategory);

  useEffect(() => {
    if (!open) return;
    if (editCategory) {
      form.setFieldsValue({
        categoryCode: editCategory.categoryCode,
        name: editCategory.name,
        description: editCategory.description,
        parentCode: editCategory.parentCode,
        supportGroupCode: editCategory.supportGroupCode ?? '',
        defaultPriority: editCategory.defaultPriority,
        responseSlaHours: editCategory.responseSlaHours,
        resolutionSlaHours: editCategory.resolutionSlaHours,
        autoCloseAfterDays: editCategory.autoCloseAfterDays,
        requesterGuidance: editCategory.requesterGuidance,
        displayOrder: editCategory.displayOrder,
        restricted: editCategory.restricted,
      });
    } else {
      form.resetFields();
    }
  }, [open, editCategory, form]);

  // Only top-level categories can be parents — the backend enforces one level of nesting, and
  // offering a sub-category here would produce a request it rejects.
  const parentOptions = categories
    .filter((c) => !c.parentCode && c.categoryCode !== editCategory?.categoryCode)
    .map((c) => ({ value: c.categoryCode, label: c.name }));

  const handleFinish = async (values: TicketCategoryFormValues) => {
    if (await onSubmit(values, isEdit)) {
      form.resetFields();
      onClose();
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={480}
      destroyOnHidden
      title={isEdit ? `Edit ${editCategory?.categoryCode}` : 'New category'}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Save
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark="optional">
        <Form.Item
          name="categoryCode"
          label="Code"
          rules={[{ required: true, message: 'A code is required' }]}
          extra={
            isEdit
              ? 'The code cannot change — every ticket filed here references it.'
              : 'Upper case, no spaces — e.g. IT_LAPTOP.'
          }
        >
          <Input disabled={isEdit} placeholder="IT_LAPTOP" />
        </Form.Item>

        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'A name is required' }]}>
          <Input placeholder="Laptop & desktop" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item name="parentCode" label="Parent category" extra="Optional — one level only.">
          <Select allowClear placeholder="Top level" options={parentOptions} />
        </Form.Item>

        <Form.Item
          name="supportGroupCode"
          label="Routes to"
          rules={[{ required: true, message: 'Choose the team that receives these tickets' }]}
          extra="Without a group, tickets raised here land in nobody's queue."
        >
          <Select
            placeholder="Support group"
            options={supportGroups.map((g) => ({ value: g.groupCode, label: g.name }))}
          />
        </Form.Item>

        <Form.Item name="defaultPriority" label="Default priority">
          <Select allowClear placeholder="Medium" options={PRIORITY_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="responseSlaHours"
          label="First-response target (hours)"
          extra="Scaled by priority: Critical gets a quarter of this, Low gets double. Blank disables it."
        >
          <InputNumber min={1} max={2000} style={{ width: '100%' }} placeholder="e.g. 8" />
        </Form.Item>

        <Form.Item name="resolutionSlaHours" label="Resolution target (hours)">
          <InputNumber min={1} max={2000} style={{ width: '100%' }} placeholder="e.g. 48" />
        </Form.Item>

        <Form.Item
          name="autoCloseAfterDays"
          label="Auto-close after (days)"
          extra="Days a resolved ticket waits before closing itself. Zero means never — a human confirms."
        >
          <InputNumber min={0} max={365} style={{ width: '100%' }} placeholder="7" />
        </Form.Item>

        <Form.Item
          name="requesterGuidance"
          label="Guidance for the requester"
          extra="Shown above the description box when someone files in this category."
        >
          <Input.TextArea rows={2} placeholder="Include your asset tag and any error message." />
        </Form.Item>

        <Form.Item name="displayOrder" label="Display order">
          <InputNumber min={0} max={999} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="restricted"
          label="Restricted"
          valuePropName="checked"
          extra="Hides it from the raise form without deleting it — the way to retire a category that still has history."
        >
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default CategoryFormDrawer;

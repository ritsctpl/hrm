'use client';

import React, { useEffect } from 'react';
import { Alert, Button, Drawer, Form, Input, Select, Space } from 'antd';
import type { TicketSupportGroup } from '../../types/domain.types';
import type { TicketGroupFormValues } from '../../types/ui.types';
import { useTicketEmployeeOptions } from '../../hooks/useTicketEmployeeOptions';

interface Props {
  open: boolean;
  editGroup?: TicketSupportGroup | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: TicketGroupFormValues, isEdit: boolean) => Promise<boolean>;
}

const SupportGroupFormDrawer: React.FC<Props> = ({
  open,
  editGroup,
  saving,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm<TicketGroupFormValues>();
  const isEdit = Boolean(editGroup);
  const { options, loading: employeesLoading, toComposite, toCompositeList } =
    useTicketEmployeeOptions();

  // Stored values are bare employee codes; the picker's options are composites. Re-run once the
  // directory arrives so an edit opened before it loaded still shows names rather than raw codes.
  useEffect(() => {
    if (!open) return;
    if (editGroup) {
      form.setFieldsValue({
        groupCode: editGroup.groupCode,
        name: editGroup.name,
        description: editGroup.description,
        memberCodes: toCompositeList(editGroup.memberCodes),
        leadCode: toComposite(editGroup.leadCode),
        defaultAssigneeCode: toComposite(editGroup.defaultAssigneeCode),
      });
    } else {
      form.resetFields();
    }
  }, [open, editGroup, form, options, toComposite, toCompositeList]);

  const handleFinish = async (values: TicketGroupFormValues) => {
    if (await onSubmit(values, isEdit)) {
      form.resetFields();
      onClose();
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={460}
      destroyOnHidden
      title={isEdit ? `Edit ${editGroup?.groupCode}` : 'New support group'}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Save
          </Button>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Membership is what puts a ticket on someone's screen."
        description="An agent sees a queue because they are listed here, not because of a role grant. Removing someone leaves their assigned tickets with them — reassign those first."
      />

      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark="optional">
        <Form.Item
          name="groupCode"
          label="Code"
          rules={[{ required: true, message: 'A code is required' }]}
          extra={
            isEdit
              ? 'The code cannot change — categories and tickets reference it.'
              : 'Upper case, no spaces — e.g. IT_SUPPORT.'
          }
        >
          <Input disabled={isEdit} placeholder="IT_SUPPORT" />
        </Form.Item>

        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'A name is required' }]}>
          <Input placeholder="IT Support" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item
          name="memberCodes"
          label="Agents"
          extra="The people who see and work this queue. Type to search the employee directory."
        >
          <Select
            mode="multiple"
            showSearch
            allowClear
            loading={employeesLoading}
            optionFilterProp="label"
            maxTagCount="responsive"
            placeholder="Search by name or employee code"
            options={options}
            notFoundContent={employeesLoading ? 'Loading employees…' : 'No matching employee'}
          />
        </Form.Item>

        <Form.Item
          name="leadCode"
          label="Lead"
          extra="Can assign within the group, and is told when a ticket here breaches its SLA."
        >
          <Select
            showSearch
            allowClear
            loading={employeesLoading}
            optionFilterProp="label"
            placeholder="Search by name or employee code"
            options={options}
            notFoundContent={employeesLoading ? 'Loading employees…' : 'No matching employee'}
          />
        </Form.Item>

        <Form.Item
          name="defaultAssigneeCode"
          label="Fallback assignee"
          extra="Picks up anything still unclaimed when the first-response target lapses. Leave blank to escalate to the lead instead."
        >
          <Select
            showSearch
            allowClear
            loading={employeesLoading}
            optionFilterProp="label"
            placeholder="Optional — leave blank to escalate to the lead"
            options={options}
            notFoundContent={employeesLoading ? 'Loading employees…' : 'No matching employee'}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default SupportGroupFormDrawer;

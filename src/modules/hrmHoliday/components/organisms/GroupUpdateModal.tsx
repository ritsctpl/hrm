'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { parseCookies } from 'nookies';
import { HrmHolidayService } from '../../services/hrmHolidayService';
import type { HolidayGroup } from '../../types/domain.types';
import { groupFormRules } from '../../utils/validations';

interface GroupUpdateModalProps {
  open: boolean;
  group: HolidayGroup;
  onClose: () => void;
  onUpdated: (group: HolidayGroup) => void;
}

export default function GroupUpdateModal({ open, group, onClose, onUpdated }: GroupUpdateModalProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && group) {
      form.setFieldsValue({
        groupName: group.groupName,
        description: group.description,
        status: group.status,
      });
    }
  }, [open, group, form]);

  const handleOk = async () => {
    const cookies = parseCookies();
    const site = cookies.site ?? '';
    const userId = cookies.userId ?? '';

    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await HrmHolidayService.updateGroup({
        site,
        handle: group.handle,
        groupName: values.groupName,
        description: values.description,
        status: values.status,
        modifiedBy: userId,
      });
      
      // Response is unwrapped by interceptor
      // Update endpoint returns a string message, not an object
      message.success('Holiday group updated successfully');
      const updatedGroup: HolidayGroup = {
        ...group,
        groupName: values.groupName,
        description: values.description,
        status: values.status,
      };
      onUpdated(updatedGroup);
    } catch (error) {
      console.error('Failed to update holiday group:', error);
      message.error('Failed to update holiday group');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Update Holiday Group"
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={saving}
      destroyOnClose
      okText="Update Group"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Group Name" name="groupName" rules={groupFormRules.groupName}>
          <Input placeholder="e.g. India Holidays 2026" maxLength={120} />
        </Form.Item>
        <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Status is required' }]}>
          <Select
            options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'LOCKED', label: 'Locked' },
            ]}
          />
        </Form.Item>
        <Form.Item label="Description" name="description" rules={groupFormRules.description}>
          <Input.TextArea rows={2} maxLength={512} placeholder="Optional description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

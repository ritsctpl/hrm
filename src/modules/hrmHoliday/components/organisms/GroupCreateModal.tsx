'use client';

import { useState } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { parseCookies } from 'nookies';
import { HrmHolidayService } from '../../services/hrmHolidayService';
import type { GroupCreateModalProps } from '../../types/ui.types';
import type { HolidayGroup } from '../../types/domain.types';
import { groupFormRules } from '../../utils/validations';
import { getYearOptions } from '../../utils/formatters';

export default function GroupCreateModal({ open, onClose, onCreated }: GroupCreateModalProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const yearOptions = getYearOptions(3);

  const handleOk = async () => {
    const cookies = parseCookies();
    const site = cookies.site ?? '';
    const userId = cookies.userId ?? '';

    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await HrmHolidayService.createGroup({
        site,
        groupName: values.groupName,
        year: values.year,
        description: values.description,
        createdBy: userId,
      });
      if (res.success) {
        const group: HolidayGroup = {
          ...res.data,
          mappings: res.data.mappings ?? [],
        };
        message.success('Holiday group created');
        form.resetFields();
        onCreated(group);
      } else {
        message.error(res.message || 'Failed to create group');
      }
    } catch {
      // form validation
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Create Holiday Group"
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={saving}
      destroyOnHidden
      okText="Create Group"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Group Name" name="groupName" rules={groupFormRules.groupName}>
          <Input placeholder="e.g. India Holidays 2026" maxLength={120} />
        </Form.Item>
        <Form.Item label="Year" name="year" rules={groupFormRules.year}
          initialValue={new Date().getFullYear()}>
          <Select options={yearOptions} />
        </Form.Item>
        <Form.Item label="Description" name="description" rules={groupFormRules.description}>
          <Input.TextArea rows={2} maxLength={512} placeholder="Optional description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

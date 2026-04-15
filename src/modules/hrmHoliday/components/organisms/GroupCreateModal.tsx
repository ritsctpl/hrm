'use client';

import { useState } from 'react';
import { Modal, Form, Input, Select, message, Button } from 'antd';
import { parseCookies } from 'nookies';
import { HrmHolidayService } from '../../services/hrmHolidayService';
import type { GroupCreateModalProps } from '../../types/ui.types';
import type { HolidayGroup } from '../../types/domain.types';
import type { HolidayGroupResponse } from '../../types/api.types';
import { groupFormRules } from '../../utils/validations';
import { getYearOptions } from '../../utils/formatters';
import Can from '../../../hrmAccess/components/Can';

export default function GroupCreateModal({ open, onClose, onCreated }: GroupCreateModalProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const yearOptions = getYearOptions(3);
  const cookies = parseCookies();
  const site = cookies.site ?? '';
  const userId = cookies.userId ?? '';

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await HrmHolidayService.createGroup({
        site,
        groupName: values.groupName,
        year: values.year,
        description: values.description,
        createdBy: userId,
      }) as any as HolidayGroupResponse;
      
      // After interceptor unwrapping, res contains the group object directly
      if (res && res.handle) {
        const group: HolidayGroup = {
          ...res,
          mappings: res.mappings ?? [],
        };
        message.success('Holiday group created successfully');
        form.resetFields();
        onCreated(group);
      } else {
        message.error('Failed to create group');
      }
    } catch (error) {
      console.error('Failed to create holiday group:', error);
      message.error('Failed to create holiday group');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Create Holiday Group"
      onCancel={onClose}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Can key="create" I="add">
          <Button type="primary" loading={saving} onClick={handleOk}>
            Create Group
          </Button>
        </Can>,
      ]}
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

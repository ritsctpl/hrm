'use client';

import { useState } from 'react';
import { Modal, Form, Input, Select, Checkbox, message, Button } from 'antd';
import { parseCookies } from 'nookies';
import { HrmHolidayService } from '../../services/hrmHolidayService';
import type { DuplicateGroupModalProps } from '../../types/ui.types';
import type { DuplicateGroupResponse } from '../../types/api.types';
import { getYearOptions } from '../../utils/formatters';
import Can from '../../../hrmAccess/components/Can';

export default function DuplicateGroupModal({
  open,
  sourceGroup,
  onClose,
  onDuplicated,
}: DuplicateGroupModalProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const yearOptions = getYearOptions(3).filter((y) => y.value !== sourceGroup.year);

  const handleOk = async () => {
    const cookies = parseCookies();
    const site = cookies.site ?? '';
    const userId = cookies.userId ?? '';

    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await HrmHolidayService.duplicateGroup({
        site,
        sourceGroupHandle: sourceGroup.handle,
        targetYear: values.targetYear,
        newGroupName: values.newGroupName,
        shiftWeekends: values.shiftWeekends ?? false,
        createdBy: userId,
      }) as any as DuplicateGroupResponse;
      
      // After interceptor unwrapping, res contains the duplicate response directly
      if (res && res.newGroupHandle) {
        message.success(`Duplicated: ${res.holidaysCopied} holidays copied`);
        form.resetFields();
        onDuplicated(res.newGroupHandle);
      } else {
        message.error('Duplication failed');
      }
    } catch (error) {
      console.error('Failed to duplicate group:', error);
      message.error('Failed to duplicate group');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={`Duplicate — ${sourceGroup.groupName}`}
      onCancel={onClose}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Can key="duplicate" I="add">
          <Button type="primary" loading={saving} onClick={handleOk}>
            Duplicate
          </Button>
        </Can>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
        initialValues={{
          newGroupName: `${sourceGroup.groupName} (copy)`,
          targetYear: new Date().getFullYear() + 1,
          shiftWeekends: false,
        }}
      >
        <Form.Item
          label="New Group Name"
          name="newGroupName"
          rules={[{ required: true, message: 'Group name is required' }]}
        >
          <Input maxLength={120} />
        </Form.Item>
        <Form.Item
          label="Target Year"
          name="targetYear"
          rules={[{ required: true, message: 'Year is required' }]}
        >
          <Select options={yearOptions} />
        </Form.Item>
        <Form.Item name="shiftWeekends" valuePropName="checked">
          <Checkbox>Adjust weekend holidays to nearest weekday</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}

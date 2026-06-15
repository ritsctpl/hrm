'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Tag, Typography, message, Button } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmHolidayService } from '../../services/hrmHolidayService';
import type { HolidayGroup } from '../../types/domain.types';
import { groupFormRules } from '../../utils/validations';
import Can from '../../../hrmAccess/components/Can';
import { useEmployeeIdentity } from '../../../hrmAccess/hooks/useEmployeeIdentity';

interface GroupUpdateModalProps {
  open: boolean;
  group: HolidayGroup;
  onClose: () => void;
  onUpdated: (group: HolidayGroup) => void;
}

export default function GroupUpdateModal({ open, group, onClose, onUpdated }: GroupUpdateModalProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { employeeCode } = useEmployeeIdentity();
  const cookies = parseCookies();
  const userRole = cookies.userRole ?? '';

  // Region is fixed at creation (backend immutable) — shown read-only.
  const isGeneral = !group.country && !group.state;
  const regionLabel = isGeneral
    ? 'General (org-wide fallback)'
    : [group.country, group.state].filter(Boolean).join(' / ');

  useEffect(() => {
    if (open && group) {
      form.setFieldsValue({
        groupName: group.groupName,
        description: group.description,
      });
    }
  }, [open, group, form]);

  const handleOk = async () => {
    const organizationId = getOrganizationId();
    try {
      const values = await form.validateFields();
      setSaving(true);
      // Region (country/state) is immutable — do NOT send it on update.
      await HrmHolidayService.updateGroup({
        organizationId,
        handle: group.handle,
        groupName: values.groupName,
        description: values.description,
        modifiedBy: employeeCode,
        modifiedByRole: userRole,
      });

      message.success('Holiday group updated successfully');
      onUpdated({ ...group, groupName: values.groupName, description: values.description });
    } catch (error) {
      console.error('Failed to update holiday group:', error);
      const beMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(beMsg || 'Failed to update holiday group');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Update Holiday Group"
      onCancel={onClose}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Can key="update" I="edit">
          <Button type="primary" loading={saving} onClick={handleOk}>
            Update Group
          </Button>
        </Can>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Group Name" name="groupName" rules={groupFormRules.groupName}>
          <Input placeholder="e.g. India Holidays 2026" maxLength={120} />
        </Form.Item>

        {/* Region is fixed at creation — read-only */}
        <div style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Region (cannot be changed)</Typography.Text>
          <div><Tag color={isGeneral ? 'gold' : 'blue'}>{regionLabel || '—'}</Tag></div>
        </div>

        <Form.Item label="Description" name="description" rules={groupFormRules.description}>
          <Input.TextArea rows={2} maxLength={512} placeholder="Optional description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

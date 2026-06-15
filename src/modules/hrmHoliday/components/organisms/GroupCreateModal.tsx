'use client';

import { useMemo, useState } from 'react';
import { Modal, Form, Input, Select, Checkbox, Typography, message, Button } from 'antd';
import { parseCookies } from 'nookies';
import Holidays from 'date-holidays';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmHolidayService } from '../../services/hrmHolidayService';
import type { GroupCreateModalProps } from '../../types/ui.types';
import type { HolidayGroup } from '../../types/domain.types';
import type { HolidayGroupResponse } from '../../types/api.types';
import { groupFormRules } from '../../utils/validations';
import { getYearOptions } from '../../utils/formatters';
import Can from '../../../hrmAccess/components/Can';
import { useEmployeeIdentity } from '../../../hrmAccess/hooks/useEmployeeIdentity';

export default function GroupCreateModal({ open, onClose, onCreated }: GroupCreateModalProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const yearOptions = getYearOptions(3);
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const { employeeCode } = useEmployeeIdentity();
  const userRole = cookies.userRole ?? '';

  // Region (or General fallback) the group applies to.
  const [isGeneral, setIsGeneral] = useState(false);
  const [country, setCountry] = useState<string | undefined>('IN');
  const [stateCode, setStateCode] = useState<string | undefined>();

  const base = useMemo(() => new Holidays(), []);
  const countryOptions = useMemo(
    () =>
      Object.entries((base.getCountries() as Record<string, string>) ?? {})
        .map(([value, label]) => ({ value, label: `${label} (${value})` }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [base]
  );
  const stateOptions = useMemo(
    () =>
      country
        ? Object.entries((base.getStates(country) as Record<string, string>) ?? {})
            .map(([value, label]) => ({ value, label: `${label} (${value})` }))
            .sort((a, b) => a.label.localeCompare(b.label))
        : [],
    [base, country]
  );

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      // "General" is implicit on the backend: country == null && state == null.
      // No isGeneral flag is sent — the checkbox just clears country/state.
      const res = await HrmHolidayService.createGroup({ organizationId,
        groupName: values.groupName,
        year: values.year,
        description: values.description,
        country: isGeneral ? undefined : country,
        state: isGeneral ? undefined : stateCode,
        createdBy: employeeCode,
        createdByRole: userRole,
      }) as any as HolidayGroupResponse & { success?: boolean; message?: string };

      // Success: the interceptor returns the group object directly (has handle).
      if (res && res.handle) {
        const group: HolidayGroup = {
          ...res,
          mappings: res.mappings ?? [],
        };
        message.success('Holiday group created successfully');
        form.resetFields();
        onCreated(group);
        return;
      }
      // Failure returned as 200 { success:false, message } (e.g. DUPLICATE_GROUP_NAME).
      // Keep the modal open so the user can rename.
      message.error(res?.message || 'Failed to create holiday group');
    } catch (error) {
      console.error('Failed to create holiday group:', error);
      const beMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(beMsg || 'Failed to create holiday group');
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
        <Form.Item label="Year (optional)" name="year" rules={groupFormRules.year}>
          <Select options={yearOptions} allowClear placeholder="Leave blank for multi-year group" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 8 }}>
          <Checkbox checked={isGeneral} onChange={(e) => setIsGeneral(e.target.checked)}>
            General holiday group (org-wide fallback when a location has no group)
          </Checkbox>
        </Form.Item>
        {!isGeneral && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>Country</Typography.Text>
              <Select
                showSearch
                style={{ width: '100%' }}
                value={country}
                options={countryOptions}
                optionFilterProp="label"
                onChange={(v) => {
                  setCountry(v);
                  setStateCode(undefined);
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>State / Province</Typography.Text>
              <Select
                showSearch
                allowClear
                style={{ width: '100%' }}
                placeholder="Whole country"
                value={stateCode}
                options={stateOptions}
                optionFilterProp="label"
                disabled={stateOptions.length === 0}
                onChange={setStateCode}
              />
            </div>
          </div>
        )}

        <Form.Item label="Description" name="description" rules={groupFormRules.description}>
          <Input.TextArea rows={2} maxLength={512} placeholder="Optional description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

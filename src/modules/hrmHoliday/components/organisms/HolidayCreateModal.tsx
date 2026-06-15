'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal, Form, Select, DatePicker, AutoComplete, Typography, message, Button } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import dayjs from 'dayjs';
import Holidays from 'date-holidays';
import { HrmHolidayService } from '../../services/hrmHolidayService';
import type { HolidayGroup } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import { useEmployeeIdentity } from '../../../hrmAccess/hooks/useEmployeeIdentity';

const { Text } = Typography;

interface HolidayCreateModalProps {
  open: boolean;
  groups: HolidayGroup[];
  onClose: () => void;
  onCreated: () => void;
}

const TYPE_TO_CATEGORY: Record<string, string> = {
  public: 'NATIONAL',
  bank: 'NATIONAL',
  optional: 'FESTIVAL',
  observance: 'LOCAL',
  school: 'LOCAL',
};

function toOptions(map: Record<string, string> | undefined) {
  return Object.entries(map ?? {})
    .map(([value, label]) => ({ value, label: `${label} (${value})` }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export default function HolidayCreateModal({ open, groups, onClose, onCreated }: HolidayCreateModalProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const { employeeCode } = useEmployeeIdentity();
  const userRole = cookies.userRole ?? '';
  const userId = employeeCode;

  // Region for suggestions (date-holidays) — defaults from the selected group.
  const [country, setCountry] = useState<string>('IN');
  const [state, setState] = useState<string | undefined>(undefined);

  const selectedGroups = Form.useWatch('groupHandle', form);
  const watchedDate = Form.useWatch('date', form);

  // Inherit country/state from the first selected group
  const groupRegion = useMemo(() => {
    const handles = Array.isArray(selectedGroups) ? selectedGroups : selectedGroups ? [selectedGroups] : [];
    const g = groups.find((gr) => handles.includes(gr.handle));
    return { country: g?.country, state: g?.state };
  }, [selectedGroups, groups]);

  useEffect(() => {
    if (groupRegion.country) setCountry(groupRegion.country);
    setState(groupRegion.state);
  }, [groupRegion.country, groupRegion.state]);

  const base = useMemo(() => new Holidays(), []);
  const countryOptions = useMemo(() => toOptions(base.getCountries() as Record<string, string>), [base]);
  const stateOptions = useMemo(() => {
    try {
      return toOptions(new Holidays(country).getStates(country) as Record<string, string> | undefined);
    } catch {
      return [];
    }
  }, [country]);

  // Suggestions follow the selected group's year (fallback: picked date / current year).
  const suggestionYear = useMemo(() => {
    const handles = Array.isArray(selectedGroups) ? selectedGroups : selectedGroups ? [selectedGroups] : [];
    const g = groups.find((gr) => handles.includes(gr.handle));
    if (g?.year) return g.year;
    if (watchedDate) return dayjs(watchedDate).year();
    return new Date().getFullYear();
  }, [selectedGroups, watchedDate, groups]);

  const suggestions = useMemo(() => {
    if (!country) return [] as { name: string; date: string; type: string }[];
    try {
      const hd = new Holidays(country, state || undefined);
      return ((hd.getHolidays(suggestionYear) ?? []) as Array<{ name: string; date: string; type: string }>).map((h) => ({
        name: h.name,
        date: String(h.date).slice(0, 10),
        type: h.type,
      }));
    } catch {
      return [];
    }
  }, [country, state, suggestionYear]);

  const nameOptions = useMemo(
    () =>
      suggestions.map((s) => ({
        value: s.name,
        label: `${s.name} — ${dayjs(s.date).format('DD MMM')}`,
        date: s.date,
        category: TYPE_TO_CATEGORY[s.type] ?? 'NATIONAL',
        optional: s.type === 'optional',
      })),
    [suggestions]
  );

  const handlePickSuggestion = (_value: string, option: { date?: string; category?: string }) => {
    if (option?.date) {
      form.setFieldsValue({ date: dayjs(option.date), category: option.category ?? 'NATIONAL' });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterByValue = (input: string, option?: any) =>
    String(option?.value ?? '').toLowerCase().includes(input.toLowerCase());

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const dateStr = values.date ? dayjs(values.date).format('YYYY-MM-DD') : '';
      const groupHandles = Array.isArray(values.groupHandle) ? values.groupHandle : [values.groupHandle];

      const results = await Promise.allSettled(
        groupHandles.map((groupHandle) =>
          HrmHolidayService.createHoliday({
            organizationId,
            groupHandle,
            name: values.name,
            date: dateStr,
            category: values.category || 'NATIONAL',
            createdBy: userId,
            createdByRole: userRole,
          })
        )
      );

      const successes = results.filter((r) => r.status === 'fulfilled').length;
      const failures = results.filter((r) => r.status === 'rejected').length;

      if (successes > 0) {
        if (failures === 0) {
          message.success(`Holiday created successfully in ${successes} group${successes > 1 ? 's' : ''}`);
        } else {
          message.warning(`Holiday created in ${successes} group${successes > 1 ? 's' : ''}, failed in ${failures}`);
        }
        form.resetFields();
        onCreated();
      } else {
        message.error('Failed to create holiday in all selected groups');
      }
    } catch {
      message.error('Failed to create holiday');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Create Holiday"
      onCancel={onClose}
      destroyOnHidden
      width={520}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Can key="create" I="add">
          <Button type="primary" loading={saving} onClick={handleOk}>
            Create Holiday
          </Button>
        </Can>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          label="Holiday Group"
          name="groupHandle"
          rules={[{ required: true, message: 'Please select at least one holiday group' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select holiday group(s)"
            options={groups.map((g) => ({ value: g.handle, label: `${g.groupName} (${g.year})` }))}
            maxTagCount="responsive"
          />
        </Form.Item>

        {/* Region (from the selected group) drives the holiday-name suggestions below. */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Country</Text>
            <Select
              showSearch
              style={{ width: '100%' }}
              value={country}
              options={countryOptions}
              optionFilterProp="label"
              onChange={(c) => { setCountry(c); setState(undefined); }}
            />
          </div>
          {stateOptions.length > 0 && (
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>State / region</Text>
              <Select
                showSearch
                allowClear
                style={{ width: '100%' }}
                value={state}
                options={stateOptions}
                optionFilterProp="label"
                onChange={(s) => setState(s)}
              />
            </div>
          )}
        </div>

        <Form.Item
          label={`Holiday Name (suggestions for ${suggestionYear})`}
          name="name"
          rules={[{ required: true, message: 'Holiday name is required' }]}
        >
          <AutoComplete
            options={nameOptions}
            onSelect={handlePickSuggestion}
            filterOption={filterByValue}
            placeholder="Pick a suggested holiday or type your own"
          />
        </Form.Item>

        <Form.Item label="Date" name="date" rules={[{ required: true, message: 'Date is required' }]}>
          <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
        </Form.Item>

        <Form.Item label="Category" name="category" initialValue="NATIONAL">
          <Select
            options={[
              { value: 'NATIONAL', label: 'National' },
              { value: 'FESTIVAL', label: 'Festival' },
              { value: 'LOCAL', label: 'Local' },
              { value: 'COMPENSATORY', label: 'Compensatory' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import Holidays from 'date-holidays';
import { HrmHolidayService } from '../../services/hrmHolidayService';
import type { CreateHolidayRequest } from '../../types/api.types';

const { Text } = Typography;

interface Props {
  open: boolean;
  organizationId: string;
  groupHandle: string;
  groupYear: number;
  /** Dates (YYYY-MM-DD) already present in the group — used to skip duplicates. */
  existingDates: Set<string>;
  createdBy: string;
  createdByRole?: string;
  onClose: () => void;
  onAdded: () => void;
}

interface SuggestedRow {
  key: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: string;
  category: string;
  optional: boolean;
  alreadyAdded: boolean;
}

// date-holidays types → this module's holiday categories.
const TYPE_TO_CATEGORY: Record<string, { category: string; optional: boolean }> = {
  public: { category: 'NATIONAL', optional: false },
  bank: { category: 'NATIONAL', optional: false },
  optional: { category: 'FESTIVAL', optional: true },
  observance: { category: 'LOCAL', optional: true },
  school: { category: 'LOCAL', optional: true },
};

const TYPE_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'optional', label: 'Optional' },
  { value: 'bank', label: 'Bank' },
  { value: 'observance', label: 'Observance' },
  { value: 'school', label: 'School' },
];

function toOptions(map: Record<string, string> | undefined) {
  return Object.entries(map ?? {})
    .map(([value, label]) => ({ value, label: `${label} (${value})` }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export default function SuggestHolidaysModal({
  open,
  organizationId,
  groupHandle,
  groupYear,
  existingDates,
  createdBy,
  createdByRole,
  onClose,
  onAdded,
}: Props) {
  const [country, setCountry] = useState<string>('IN');
  const [types, setTypes] = useState<string[]>(['public', 'optional']);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const base = useMemo(() => new Holidays(), []);
  const countryOptions = useMemo(() => toOptions(base.getCountries() as Record<string, string>), [base]);

  const rows = useMemo<SuggestedRow[]>(() => {
    if (!country) return [];
    try {
      const hd = new Holidays(country);
      const list = (hd.getHolidays(groupYear) ?? []) as Array<{ date: string; name: string; type: string }>;
      const seen = new Set<string>();
      return list
        .filter((h) => types.includes(h.type))
        .map((h) => {
          const date = String(h.date).slice(0, 10);
          const map = TYPE_TO_CATEGORY[h.type] ?? { category: 'LOCAL', optional: true };
          return {
            key: `${date}|${h.name}`,
            name: h.name,
            date,
            type: h.type,
            category: map.category,
            optional: map.optional,
            alreadyAdded: existingDates.has(date),
          };
        })
        .filter((r) => (seen.has(r.key) ? false : (seen.add(r.key), true)));
    } catch {
      return [];
    }
  }, [country, groupYear, types, existingDates]);

  // Pre-select everything not already in the group whenever the list changes.
  useEffect(() => {
    setSelectedKeys(rows.filter((r) => !r.alreadyAdded).map((r) => r.key));
  }, [rows]);

  const newCount = rows.filter((r) => selectedKeys.includes(r.key) && !r.alreadyAdded).length;

  async function handleAdd() {
    const chosen = rows.filter((r) => selectedKeys.includes(r.key) && !r.alreadyAdded);
    if (chosen.length === 0) {
      message.warning('No new holidays selected');
      return;
    }
    setSaving(true);
    try {
      const holidays: CreateHolidayRequest[] = chosen.map((r) => ({
        organizationId,
        groupHandle,
        name: r.name,
        date: r.date,
        category: r.category,
        optional: r.optional,
        createdBy,
        createdByRole,
      }));
      const res = await HrmHolidayService.bulkCreateHolidays({
        organizationId,
        groupHandle,
        holidays,
        createdBy,
      });
      if (res && (res as { success?: boolean }).success === false) {
        message.error((res as { message?: string }).message || 'Failed to add holidays');
        return;
      }
      message.success(`Added ${chosen.length} holiday(s) to the group`);
      onAdded();
    } catch {
      message.error('Failed to add holidays');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Suggest Holidays"
      width={760}
      onCancel={onClose}
      okText={`Add Selected${newCount ? ` (${newCount})` : ''}`}
      okButtonProps={{ disabled: newCount === 0, loading: saving }}
      onOk={handleAdd}
      destroyOnHidden
    >
      <Space wrap style={{ marginBottom: 12 }}>
        <Select
          showSearch
          style={{ width: 240 }}
          placeholder="Country"
          value={country}
          options={countryOptions}
          optionFilterProp="label"
          onChange={setCountry}
        />
        <Select
          mode="multiple"
          style={{ minWidth: 220 }}
          placeholder="Types"
          value={types}
          options={TYPE_OPTIONS}
          onChange={setTypes}
          maxTagCount="responsive"
        />
      </Space>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message={`Suggestions for ${groupYear} (from the group). Categories are pre-mapped — edit any holiday after adding.`}
      />

      <Table<SuggestedRow>
        size="small"
        rowKey="key"
        dataSource={rows}
        pagination={false}
        scroll={{ y: 320 }}
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: (keys) => setSelectedKeys(keys as string[]),
          getCheckboxProps: (r) => ({ disabled: r.alreadyAdded }),
        }}
        columns={[
          { title: 'Holiday', dataIndex: 'name', key: 'name' },
          { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
          {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 120,
            render: (c: string, r) => (
              <Space size={4}>
                <Tag>{c}</Tag>
                {r.optional && <Tag color="gold">optional</Tag>}
              </Space>
            ),
          },
          {
            title: '',
            key: 'added',
            width: 90,
            render: (_: unknown, r) =>
              r.alreadyAdded ? <Text type="secondary" style={{ fontSize: 12 }}>Added</Text> : null,
          },
        ]}
        locale={{ emptyText: 'No suggestions for this selection' }}
      />
    </Modal>
  );
}

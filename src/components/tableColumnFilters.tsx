'use client';

/**
 * Shared "smart table" column-filter factories for Ant Design <Table>.
 *
 * Each factory returns a slice of ColumnType props that a column opts into by
 * spreading the result, e.g.:
 *
 *   { title: 'Purpose', dataIndex: 'purpose', ...textSearchFilter<Row>('purpose') }
 *   { title: 'Status',  dataIndex: 'status',  ...categoryFilter<Row>('status', rows) }
 *   { title: 'Date',    dataIndex: 'date',    ...dateRangeFilter<Row>('date') }
 *
 * Filtering is client-side over the rows the table holds. For computed/derived
 * columns (no plain dataIndex value), pass getText / getValue / getDate.
 */

import React from 'react';
import { Button, Input, Space, DatePicker } from 'antd';
import { SearchOutlined, FilterFilled } from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const ACTIVE_COLOR = '#1677ff';

/** Text-search dropdown: case-insensitive substring match. */
export function textSearchFilter<T>(
  dataIndex: keyof T,
  opts: { getText?: (record: T) => string | null | undefined; placeholder?: string } = {},
): Pick<ColumnType<T>, 'filterDropdown' | 'filterIcon' | 'onFilter'> {
  const getText =
    opts.getText ??
    ((r: T) => {
      const v = r[dataIndex];
      return v == null ? '' : String(v);
    });

  return {
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          autoFocus
          placeholder={opts.placeholder ?? 'Search'}
          value={selectedKeys[0] as string | undefined}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block', width: 200 }}
        />
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SearchOutlined />}
            onClick={() => confirm()}
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            size="small"
            onClick={() => {
              clearFilters?.();
              confirm();
            }}
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? ACTIVE_COLOR : undefined }} />
    ),
    onFilter: (value, record) =>
      (getText(record) ?? '').toString().toLowerCase().includes(String(value).toLowerCase()),
  };
}

/** Categorical checkbox list; options derived from the rows unless provided. */
export function categoryFilter<T>(
  dataIndex: keyof T,
  rows: readonly T[],
  opts: {
    labelMap?: Record<string, string>;
    options?: { text: string; value: React.Key }[];
    getValue?: (record: T) => React.Key | null | undefined;
  } = {},
): Pick<ColumnType<T>, 'filters' | 'filterIcon' | 'onFilter'> {
  const getValue = opts.getValue ?? ((r: T) => r[dataIndex] as unknown as React.Key);

  const filters =
    opts.options ??
    Array.from(
      new Set(
        rows
          .map((r) => getValue(r))
          .filter((v): v is React.Key => v != null && v !== ''),
      ),
    )
      .sort((a, b) => String(a).localeCompare(String(b)))
      .map((v) => ({ text: opts.labelMap?.[String(v)] ?? String(v), value: v }));

  return {
    filters,
    filterIcon: (filtered: boolean) => (
      <FilterFilled style={{ color: filtered ? ACTIVE_COLOR : undefined }} />
    ),
    onFilter: (value, record) => getValue(record) === value,
  };
}

/** Inclusive date-range dropdown using dayjs against the row's date value. */
export function dateRangeFilter<T>(
  dataIndex: keyof T,
  opts: { getDate?: (record: T) => string | null | undefined } = {},
): Pick<ColumnType<T>, 'filterDropdown' | 'filterIcon' | 'onFilter'> {
  const getDate =
    opts.getDate ??
    ((r: T) => {
      const v = r[dataIndex];
      return v == null ? null : String(v);
    });

  return {
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => {
      const parts = (selectedKeys[0] as string | undefined)?.split('|') ?? [];
      const value: [dayjs.Dayjs | null, dayjs.Dayjs | null] =
        parts.length === 2 ? [dayjs(parts[0]), dayjs(parts[1])] : [null, null];
      return (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
          <RangePicker
            value={value}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setSelectedKeys([`${dates[0].format('YYYY-MM-DD')}|${dates[1].format('YYYY-MM-DD')}`]);
              } else {
                setSelectedKeys([]);
              }
            }}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="primary" size="small" onClick={() => confirm()} style={{ width: 90 }}>
              Filter
            </Button>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.();
                confirm();
              }}
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      );
    },
    filterIcon: (filtered: boolean) => (
      <FilterFilled style={{ color: filtered ? ACTIVE_COLOR : undefined }} />
    ),
    onFilter: (value, record) => {
      const [from, to] = String(value).split('|');
      const raw = getDate(record);
      if (!raw) return false;
      const d = dayjs(raw);
      return d.isValid() && !d.isBefore(dayjs(from).startOf('day')) && !d.isAfter(dayjs(to).endOf('day'));
    },
  };
}

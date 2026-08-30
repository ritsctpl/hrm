'use client';

import React, { useCallback } from 'react';
import { Select, Tag } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';

export interface EmployeeOption {
  employeeId: string;
  employeeName: string;
  email?: string;
  grade?: string;
  department?: string;
  designation?: string;
}

interface EmployeeLookupSelectProps {
  value?: string;
  options?: EmployeeOption[];
  loading?: boolean;
  placeholder?: string;
  /**
   * Fired (debounced by the caller) when the user types. Search is SERVER-driven
   * over id / name / email via the employee directory, so filterOption is disabled
   * and the caller is responsible for fetching the matching option set.
   */
  onSearch?: (keyword: string) => void;
  onChange: (employeeId: string, option: EmployeeOption) => void;
}

const EmployeeLookupSelect: React.FC<EmployeeLookupSelectProps> = ({
  value,
  options = [],
  loading = false,
  placeholder = 'Search by employee ID, name or email',
  onSearch,
  onChange,
}) => {
  const handleChange = useCallback(
    (val: string, opt: DefaultOptionType | DefaultOptionType[]) => {
      const single = Array.isArray(opt) ? opt[0] : opt;
      if (single && 'emp' in single) {
        onChange(val, single.emp as EmployeeOption);
      }
    },
    [onChange],
  );

  const renderOption = (emp: EmployeeOption) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 600 }}>{emp.employeeName}</span>
      <span style={{ color: 'var(--hrm-text-tertiary)', fontSize: 12 }}>({emp.employeeId})</span>
      {emp.email && (
        <span style={{ color: 'var(--hrm-text-secondary)', fontSize: 12 }}>{emp.email}</span>
      )}
      {emp.grade && (
        <Tag color="geekblue" style={{ fontSize: 11, margin: 0 }}>
          {emp.grade}
        </Tag>
      )}
      {emp.department && (
        <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
          {emp.department}
        </Tag>
      )}
    </div>
  );

  return (
    <Select
      showSearch
      value={value || undefined}
      placeholder={placeholder}
      // Search is server-side (id / name / email) — never re-filter client-side or we'd
      // hide rows the directory already matched (e.g. an email the label doesn't show).
      filterOption={false}
      onSearch={onSearch}
      onChange={handleChange}
      loading={loading}
      allowClear
      style={{ width: '100%' }}
      notFoundContent={loading ? 'Searching…' : 'Type an ID, name or email'}
    >
      {options.map((emp) => (
        <Select.Option key={emp.employeeId} value={emp.employeeId} emp={emp}>
          {renderOption(emp)}
        </Select.Option>
      ))}
    </Select>
  );
};

export default EmployeeLookupSelect;

'use client';

import React, { useCallback } from 'react';
import { Select, Tag } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';

interface EmployeeOption {
  employeeId: string;
  employeeName: string;
  department?: string;
  designation?: string;
}

interface EmployeeLookupSelectProps {
  value?: string;
  options?: EmployeeOption[];
  loading?: boolean;
  placeholder?: string;
  onChange: (employeeId: string, option: EmployeeOption) => void;
}

const EmployeeLookupSelect: React.FC<EmployeeLookupSelectProps> = ({
  value,
  options = [],
  loading = false,
  placeholder = 'Search by employee ID or name',
  onChange,
}) => {
  const selectOptions = options.map((emp) => ({
    value: emp.employeeId,
    label: `${emp.employeeName} (${emp.employeeId})`,
    emp,
  }));

  const handleFilter = useCallback(
    (input: string, option: DefaultOptionType | undefined): boolean => {
      if (!option) return false;
      return String(option.label ?? '').toLowerCase().includes(input.toLowerCase());
    },
    [],
  );

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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{emp.employeeName}</span>
      <span style={{ color: '#8c8c8c', fontSize: 12 }}>({emp.employeeId})</span>
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
      filterOption={handleFilter}
      onChange={handleChange}
      loading={loading}
      allowClear
      style={{ width: '100%' }}
      notFoundContent={loading ? 'Loading...' : 'No employees found'}
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

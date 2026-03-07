'use client';

import React, { useCallback } from 'react';
import { Select } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';

interface EmployeeOption {
  handle: string;
  name: string;
  employeeCode: string;
}

interface HrmEmployeePickerProps {
  onSelect: (employee: EmployeeOption) => void;
  multiple?: boolean;
  filters?: Record<string, string>;
  value?: string | string[];
  options?: EmployeeOption[];
  loading?: boolean;
  placeholder?: string;
}

/**
 * HrmEmployeePicker
 *
 * Searchable dropdown for selecting employees.
 * Displays employee name and code in the option label.
 * Supports single and multi-select modes.
 *
 * @param onSelect    - Called when an employee is selected
 * @param multiple    - Enable multi-select mode
 * @param value       - Controlled value (handle or array of handles)
 * @param options     - Array of employee options to populate the list
 * @param loading     - Show loading spinner while options load
 * @param placeholder - Custom placeholder text
 */
const HrmEmployeePicker: React.FC<HrmEmployeePickerProps> = ({
  onSelect,
  multiple = false,
  value,
  options = [],
  loading = false,
  placeholder = 'Search employee...',
}) => {
  const selectOptions = options.map((emp) => ({
    value: emp.handle,
    label: `${emp.name} (${emp.employeeCode})`,
    employee: emp,
  }));

  const handleFilterOption = useCallback(
    (input: string, option: DefaultOptionType | undefined): boolean => {
      if (!option) return false;
      const label = String(option.label ?? '');
      return label.toLowerCase().includes(input.toLowerCase());
    },
    [],
  );

  const handleChange = useCallback(
    (selected: string | string[]) => {
      if (multiple) {
        // For multi-select, call onSelect with the last-added item
        const selectedArr = Array.isArray(selected) ? selected : [selected];
        const lastHandle = selectedArr[selectedArr.length - 1];
        const emp = options.find((o) => o.handle === lastHandle);
        if (emp) onSelect(emp);
      } else {
        const emp = options.find((o) => o.handle === selected);
        if (emp) onSelect(emp);
      }
    },
    [multiple, options, onSelect],
  );

  return (
    <Select
      showSearch
      mode={multiple ? 'multiple' : undefined}
      value={value}
      placeholder={placeholder}
      filterOption={handleFilterOption}
      onChange={handleChange}
      options={selectOptions}
      loading={loading}
      allowClear
      style={{ width: '100%' }}
      notFoundContent={loading ? 'Loading...' : 'No employees found'}
    />
  );
};

export default HrmEmployeePicker;

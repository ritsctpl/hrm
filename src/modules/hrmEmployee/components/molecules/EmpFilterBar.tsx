/**
 * EmpFilterBar - Filter dropdowns for department, status, and BU
 */

'use client';

import React from 'react';
import { Select } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import type { EmpFilterBarProps } from '../../types/ui.types';

const EmpFilterBar: React.FC<EmpFilterBarProps> = ({
  filters,
  onFilterChange,
  departments,
  businessUnits,
}) => {
  return (
    <>
      <Select
        value={filters.departmentFilter}
        onChange={(value) => onFilterChange({ departmentFilter: value || null })}
        placeholder="Department"
        allowClear
        style={{ width: 150, height: 32 }}
        suffixIcon={<FilterOutlined />}
        options={departments.map((d) => ({ value: d, label: d }))}
      />

      <Select
        value={filters.statusFilter}
        onChange={(value) => onFilterChange({ statusFilter: value || null })}
        placeholder="Status"
        allowClear
        style={{ width: 120, height: 32 }}
        suffixIcon={<FilterOutlined />}
        options={[
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' },
        ]}
      />

      <Select
        value={filters.buFilter}
        onChange={(value) => onFilterChange({ buFilter: value || null })}
        placeholder="Business Unit"
        allowClear
        style={{ width: 160, height: 32 }}
        suffixIcon={<FilterOutlined />}
        options={businessUnits.map((bu) => ({ value: bu, label: bu }))}
      />
    </>
  );
};

export default EmpFilterBar;

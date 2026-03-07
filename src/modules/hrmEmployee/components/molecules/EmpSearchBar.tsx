/**
 * EmpSearchBar - Search input for employee directory
 */

'use client';

import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { EmpSearchBarProps } from '../../types/ui.types';

const EmpSearchBar: React.FC<EmpSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search employees...',
}) => {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
      allowClear
      style={{ width: 240, borderRadius: 8, height: 32 }}
    />
  );
};

export default EmpSearchBar;

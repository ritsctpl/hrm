'use client';

import React from 'react';
import { Input } from 'antd';
import type { RbacSearchBarProps } from '../../types/ui.types';

const { Search } = Input;

const RbacSearchBar: React.FC<RbacSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  onSearch,
}) => {
  return (
    <Search
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onSearch={onSearch}
      placeholder={placeholder}
      allowClear
      style={{ width: '100%' }}
    />
  );
};

export default RbacSearchBar;

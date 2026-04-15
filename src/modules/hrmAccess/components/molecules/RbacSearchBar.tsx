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
  width,
}) => {
  return (
    <Search
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onSearch={onSearch}
      placeholder={placeholder}
      allowClear
      style={{ width: width ?? '100%' }}
    />
  );
};

export default RbacSearchBar;

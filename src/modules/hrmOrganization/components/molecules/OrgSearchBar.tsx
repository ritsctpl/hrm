'use client';

import React, { useCallback } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { OrgSearchBarProps } from '../../types/ui.types';
import styles from '../../styles/HrmOrganizationForm.module.css';

const OrgSearchBar: React.FC<OrgSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <Input
      className={styles.searchBar}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
      allowClear
    />
  );
};

export default OrgSearchBar;

'use client';

import React, { useCallback } from 'react';
import { Input } from 'antd';
import SearchIcon from '@mui/icons-material/Search';
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
      prefix={<SearchIcon fontSize="small" style={{ color: '#bfbfbf' }} />}
      allowClear
    />
  );
};

export default OrgSearchBar;

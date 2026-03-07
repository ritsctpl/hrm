'use client';

import { Input, Select, Button, Space } from 'antd';
import ClearIcon from '@mui/icons-material/Clear';
import type { AssetSearchBarProps } from '../../types/ui.types';
import { ASSET_STATUS_OPTIONS } from '../../utils/assetConstants';
import styles from '../../styles/AssetList.module.css';

const { Search } = Input;

export default function AssetSearchBar({
  searchQuery,
  filterCategory,
  filterStatus,
  filterLocation,
  categories,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onLocationChange,
  onClear,
}: AssetSearchBarProps) {
  const categoryOptions = categories.map((c) => ({ value: c.categoryCode, label: c.categoryName }));

  return (
    <div className={styles.searchBar}>
      <Space wrap>
        <Search
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search assets..."
          style={{ width: 220 }}
          allowClear
        />
        <Select
          value={filterCategory || undefined}
          onChange={onCategoryChange}
          options={categoryOptions}
          allowClear
          placeholder="All Categories"
          style={{ width: 160 }}
        />
        <Select
          value={filterStatus || undefined}
          onChange={onStatusChange}
          options={ASSET_STATUS_OPTIONS}
          allowClear
          placeholder="All Status"
          style={{ width: 150 }}
        />
        <Input
          value={filterLocation}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="Location..."
          style={{ width: 140 }}
          allowClear
        />
        <Button icon={<ClearIcon style={{ fontSize: 16 }} />} onClick={onClear}>Clear</Button>
      </Space>
    </div>
  );
}

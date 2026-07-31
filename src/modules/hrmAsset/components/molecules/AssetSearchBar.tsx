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
  showAvailableToAssign,
}: AssetSearchBarProps) {
  const categoryOptions = categories.map((c) => ({ value: c.categoryCode, label: c.categoryName }));
  const availableOnly = filterStatus === 'IN_STORE';

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
        {/* Shortcut to the only directly-assignable status, so a store keeper
            handing out kit doesn't have to work the Status dropdown. Reflects
            and drives the same filterStatus as that dropdown. */}
        {showAvailableToAssign && (
          <Button
            type={availableOnly ? 'primary' : 'default'}
            aria-pressed={availableOnly}
            onClick={() => onStatusChange(availableOnly ? '' : 'IN_STORE')}
          >
            Available to assign
          </Button>
        )}
        <Button icon={<ClearIcon style={{ fontSize: 16 }} />} onClick={onClear}>Clear</Button>
      </Space>
    </div>
  );
}

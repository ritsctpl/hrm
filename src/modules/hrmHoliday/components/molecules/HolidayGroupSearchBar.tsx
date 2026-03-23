'use client';

import { Select, Input, Button, Space } from 'antd';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { HolidayGroupSearchBarProps } from '../../types/ui.types';
import { HOLIDAY_GROUP_STATUSES } from '../../utils/constants';
import { getYearOptions } from '../../utils/formatters';
import styles from '../../styles/HrmHoliday.module.css';

const { Search } = Input;

export default function HolidayGroupSearchBar({
  searchParams,
  onSearchChange,
  onNewGroup,
  onNewHoliday,
  onEditGroup,
  onDeleteGroup,
  onDuplicateYear,
  canManageSettings,
  hasSelectedGroup,
}: HolidayGroupSearchBarProps) {
  const yearOptions = getYearOptions(3);

  return (
    <div className={styles.searchBar}>
      <Space wrap>
        <Select
          value={searchParams.year}
          onChange={(year) => onSearchChange({ year })}
          options={yearOptions}
          style={{ width: 100 }}
          placeholder="Year"
        />
        <Select
          value={searchParams.status}
          onChange={(status) => onSearchChange({ status })}
          allowClear
          placeholder="All Status"
          style={{ width: 140 }}
          options={[
            { value: HOLIDAY_GROUP_STATUSES.DRAFT, label: 'Draft' },
            { value: HOLIDAY_GROUP_STATUSES.PUBLISHED, label: 'Published' },
            { value: HOLIDAY_GROUP_STATUSES.LOCKED, label: 'Locked' },
          ]}
        />
        <Search
          value={searchParams.search}
          onChange={(e) => onSearchChange({ search: e.target.value })}
          placeholder="Search groups..."
          style={{ width: 200 }}
          allowClear
        />
      </Space>
      <Space wrap>
        {onNewHoliday && (
          <Button type="primary" onClick={onNewHoliday}>
            Create Holiday
          </Button>
        )}
        {onNewGroup && (
          <Button onClick={onNewGroup}>
            New Group
          </Button>
        )}
        {onEditGroup && hasSelectedGroup && (
          <Button onClick={onEditGroup}>
            Edit Group
          </Button>
        )}
        {onDeleteGroup && hasSelectedGroup && (
          <Button danger  onClick={onDeleteGroup}>
            Delete Group
          </Button>
        )}
        {onDuplicateYear && (
          <Button icon={<ContentCopyIcon style={{ fontSize: 16 }} />} onClick={onDuplicateYear}>
            Dup Year
          </Button>
        )}
        {canManageSettings && (
          <Button icon={<SettingsIcon style={{ fontSize: 16 }} />}>Settings</Button>
        )}
      </Space>
    </div>
  );
}

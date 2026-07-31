'use client';

import React from 'react';
import { Button, Input, Segmented, Tooltip } from 'antd';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { GuideViewMode } from '../../types/ui.types';

interface GuideSearchBarProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  viewMode: GuideViewMode;
  onViewModeChange: (mode: GuideViewMode) => void;
  onReload: () => void;
  /** Rendered at the right end — the Upload button when the user may add. */
  extra?: React.ReactNode;
}

const GuideSearchBar: React.FC<GuideSearchBarProps> = ({
  searchText,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onReload,
  extra,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 16px',
      background: '#fff',
      borderBottom: '1px solid #f0f0f0',
      flexShrink: 0,
    }}
  >
    <Input
      allowClear
      size="small"
      style={{ maxWidth: 320 }}
      placeholder="Search guides by title, module or tag"
      prefix={<SearchIcon style={{ fontSize: 16, color: '#bfbfbf' }} />}
      value={searchText}
      onChange={(e) => onSearchChange(e.target.value)}
    />
    <div style={{ flex: 1 }} />
    <Segmented
      size="small"
      value={viewMode}
      onChange={(v) => onViewModeChange(v as GuideViewMode)}
      options={[
        { label: 'Grid', value: 'grid' },
        { label: 'List', value: 'list' },
      ]}
    />
    <Tooltip title="Reload">
      <Button size="small" icon={<RefreshIcon style={{ fontSize: 16 }} />} onClick={onReload} />
    </Tooltip>
    {extra}
  </div>
);

export default GuideSearchBar;

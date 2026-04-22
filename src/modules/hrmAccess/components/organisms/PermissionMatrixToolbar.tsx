'use client';

import React from 'react';
import { Select, Button, Space, Tooltip } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import DownloadIcon from '@mui/icons-material/Download';
import type { Role } from '../../types/domain.types';
import type { ModuleRegistry } from '../../types/domain.types';
import styles from '../../styles/PermissionMatrix.module.css';

interface PermissionMatrixToolbarProps {
  modules: ModuleRegistry[];
  roles: Role[];
  moduleFilter: string | null;
  roleFilter: string | null;
  onModuleFilterChange: (val: string | null) => void;
  onRoleFilterChange: (val: string | null) => void;
  onExport: () => void;
  isLoading: boolean;
}

const PermissionMatrixToolbar: React.FC<PermissionMatrixToolbarProps> = ({
  modules,
  roles,
  moduleFilter,
  roleFilter,
  onModuleFilterChange,
  onRoleFilterChange,
  onExport,
  isLoading,
}) => {
  return (
    <div className={styles.toolbar}>
      <Space wrap>
        <Select
          placeholder="Filter by Module"
          value={moduleFilter ?? undefined}
          onChange={(val) => onModuleFilterChange(val ?? null)}
          allowClear
          style={{ width: 200 }}
          options={[
            ...modules.map((m) => ({ value: m.moduleCode, label: m.moduleName })),
          ]}
        />
        <Select
          placeholder="Filter by Role"
          value={roleFilter ?? undefined}
          onChange={(val) => onRoleFilterChange(val ?? null)}
          allowClear
          style={{ width: 200 }}
          options={roles.map((r) => ({ value: r.roleCode, label: r.roleName }))}
        />
        {(moduleFilter || roleFilter) && (
          <Tooltip title="Clear filters">
            <Button
              icon={<ClearOutlined />}
              onClick={() => {
                onModuleFilterChange(null);
                onRoleFilterChange(null);
              }}
            >
              Reset
            </Button>
          </Tooltip>
        )}
        <Button
          icon={<DownloadIcon fontSize="small" />}
          onClick={onExport}
          disabled={isLoading}
        >
          Export CSV
        </Button>
      </Space>
    </div>
  );
};

export default PermissionMatrixToolbar;

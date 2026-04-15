/**
 * EmployeeDirectoryTemplate - Template layout for the employee directory (landing) view
 * Renders toolbar (search + filters + view toggle) and the table or card grid.
 */

'use client';

import React, { useMemo } from 'react';
import { Button, Tooltip, Spin } from 'antd';
import {
  AppstoreOutlined,
  BarsOutlined,
  PlusOutlined,
  UploadOutlined,
  ReloadOutlined,
  TeamOutlined,
  AlertOutlined,
  DownloadOutlined,
  AuditOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import EmpSearchBar from '../molecules/EmpSearchBar';
import EmpFilterBar from '../molecules/EmpFilterBar';
import EmployeeTable from '../organisms/EmployeeTable';
import EmployeeCardGrid from '../organisms/EmployeeCardGrid';
import { useEmployeePermissions } from '../../hooks/useEmployeePermissions';
import { useHrmRbacStore } from '@/modules/hrmAccess/stores/hrmRbacStore';
import type { EmployeeSummary } from '../../types/domain.types';
import type { DirectoryViewMode, DirectoryFilters } from '../../types/ui.types';
import styles from '../../styles/HrmEmployee.module.css';

interface EmployeeDirectoryTemplateProps {
  employees: EmployeeSummary[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  viewMode: DirectoryViewMode;
  searchKeyword: string;
  filters: DirectoryFilters;
  departments: string[];
  businessUnits: string[];
  onSearch: (keyword: string) => void;
  onFilterChange: (filters: Partial<DirectoryFilters>) => void;
  onViewModeChange: (mode: DirectoryViewMode) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onRowClick: (handle: string) => void;
  onAddEmployee: () => void;
  onBulkImport: () => void;
  onRefresh: () => void;
  onOffboarding?: () => void;
  onBulkOps?: () => void;
  onAlerts?: () => void;
  onExport?: () => void;
  onAuditLog?: () => void;
  onFieldConfig?: () => void;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

const EmployeeDirectoryTemplate: React.FC<EmployeeDirectoryTemplateProps> = ({
  employees,
  totalCount,
  currentPage,
  pageSize,
  isLoading,
  viewMode,
  searchKeyword,
  filters,
  departments,
  businessUnits,
  onSearch,
  onFilterChange,
  onViewModeChange,
  onPageChange,
  onRowClick,
  onAddEmployee,
  onBulkImport,
  onRefresh,
  onOffboarding,
  onBulkOps,
  onAlerts,
  onExport,
  onAuditLog,
  onFieldConfig,
  canAdd = true,
  canEdit = true,
  canDelete = true,
}) => {
  // Per-object permissions (now uses module-level fallback when the
  // backend hasn't published per-object grants — see useEmployeePermissions).
  const permissions = useEmployeePermissions();
  const isReady = useHrmRbacStore(s => s.isReady);

  const activeCount = useMemo(
    () => employees.filter((e) =>
      e.isActive !== undefined ? e.isActive === true : e.status === 'ACTIVE'
    ).length,
    [employees]
  );
  const inactiveCount = useMemo(
    () => employees.filter((e) =>
      e.isActive !== undefined ? e.isActive === false : e.status === 'INACTIVE'
    ).length,
    [employees]
  );

  // Access control is handled upstream by <ModuleAccessGate moduleCode="HRM_EMPLOYEE">
  // wrapping HrmEmployeeLanding. That gate is the single source of truth
  // for module-level VIEW; reaching this template means the user passed it.
  // Wait for RBAC to finish initializing before rendering the directory.
  if (!isReady) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          gap: 16,
        }}
      >
        <Spin size="large" />
        <div style={{ color: '#64748b', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.landingWrapper}>
      {/* Action Bar */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <div className={styles.countBadges}>
            <span className={styles.countActive}>Active {activeCount}</span>
            <span className={styles.countInactive}>Inactive {inactiveCount}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          {permissions.canAddEmployee && (
            <Tooltip title="Bulk Import">
              <Button icon={<UploadOutlined />} onClick={onBulkImport}>
                Import
              </Button>
            </Tooltip>
          )}
          {permissions.canEditEmployee && onBulkOps && (
            <Tooltip title="Bulk Operations">
              <Button icon={<TeamOutlined />} onClick={onBulkOps}>
                Bulk Ops
              </Button>
            </Tooltip>
          )}
          {onAlerts && (
            <Tooltip title="Alerts Dashboard">
              <Button icon={<AlertOutlined />} onClick={onAlerts}>
                Alerts
              </Button>
            </Tooltip>
          )}
          {onExport && (
            <Tooltip title="Export Employees">
              <Button icon={<DownloadOutlined />} onClick={onExport}>
                Export
              </Button>
            </Tooltip>
          )}
          {onAuditLog && (
            <Tooltip title="Audit Log">
              <Button icon={<AuditOutlined />} onClick={onAuditLog} />
            </Tooltip>
          )}
          {permissions.canEditEmployee && onFieldConfig && (
            <Tooltip title="Field Schema Config">
              <Button icon={<SettingOutlined />} onClick={onFieldConfig} />
            </Tooltip>
          )}
          {permissions.canAddEmployee && (
            <Tooltip title="Add Employee">
              <Button type="primary" icon={<PlusOutlined />} onClick={onAddEmployee} />
            </Tooltip>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <EmpSearchBar value={searchKeyword} onChange={onSearch} />
          <EmpFilterBar
            filters={filters}
            onFilterChange={onFilterChange}
            departments={departments}
            businessUnits={businessUnits}
          />
        </div>
        <div className={styles.toolbarRight}>
          <Tooltip title="Refresh">
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              size="small"
              type="text"
            />
          </Tooltip>
          <Button
            icon={<AppstoreOutlined />}
            size="small"
            className={`${styles.viewToggleBtn} ${viewMode === 'card' ? styles.viewToggleActive : ''}`}
            onClick={() => onViewModeChange('card')}
          />
          <Button
            icon={<BarsOutlined />}
            size="small"
            className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleActive : ''}`}
            onClick={() => onViewModeChange('table')}
          />
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <EmployeeTable
          data={employees}
          loading={isLoading}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onRowClick={onRowClick}
          canView={permissions.canViewEmployee}
          canEdit={permissions.canEditEmployee}
          canDelete={permissions.canDeleteEmployee}
        />
      ) : (
        <EmployeeCardGrid
          data={employees}
          loading={isLoading}
          onCardClick={onRowClick}
        />
      )}
    </div>
  );
};

export default EmployeeDirectoryTemplate;

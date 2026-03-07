/**
 * EmployeeDirectoryTemplate - Template layout for the employee directory (landing) view
 * Renders toolbar (search + filters + view toggle) and the table or card grid.
 */

'use client';

import React, { useMemo } from 'react';
import { Button, Tooltip } from 'antd';
import {
  AppstoreOutlined,
  BarsOutlined,
  PlusOutlined,
  UploadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import EmpSearchBar from '../molecules/EmpSearchBar';
import EmpFilterBar from '../molecules/EmpFilterBar';
import EmployeeTable from '../organisms/EmployeeTable';
import EmployeeCardGrid from '../organisms/EmployeeCardGrid';
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
}) => {
  const activeCount = useMemo(
    () => employees.filter((e) => e.status === 'ACTIVE').length,
    [employees]
  );
  const inactiveCount = useMemo(
    () => employees.filter((e) => e.status === 'INACTIVE').length,
    [employees]
  );

  return (
    <div className={styles.landingWrapper}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Employees</h1>
          <div className={styles.countBadges}>
            <span className={styles.countActive}>Active {activeCount}</span>
            <span className={styles.countInactive}>Inactive {inactiveCount}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Tooltip title="Bulk Import">
            <Button icon={<UploadOutlined />} onClick={onBulkImport}>
              Import
            </Button>
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAddEmployee}>
            Add Employee
          </Button>
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

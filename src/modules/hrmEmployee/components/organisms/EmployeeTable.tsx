/**
 * EmployeeTable - Ant Design Table for the employee directory table view
 */

'use client';

import React, { useMemo } from 'react';
import { Table, Button, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined } from '@ant-design/icons';
import EmpAvatar from '../atoms/EmpAvatar';
import EmpStatusBadge from '../atoms/EmpStatusBadge';
import type { EmployeeSummary } from '../../types/domain.types';
import { PAGE_SIZE_OPTIONS } from '../../utils/constants';
import { textSearchFilter, categoryFilter } from '@/components/tableColumnFilters';
import styles from '../../styles/HrmEmployeeTable.module.css';

interface EmployeeTableProps {
  data: EmployeeSummary[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onRowClick: (handle: string) => void;
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  data,
  loading,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onRowClick,
  canView = true,
  canEdit = false,
  canDelete = false,
}) => {
  const columns: ColumnsType<EmployeeSummary> = useMemo(
    () => [
      {
        title: 'Employee',
        dataIndex: 'fullName',
        key: 'fullName',
        width: 260,
        sorter: (a, b) => (a.fullName || '').localeCompare(b.fullName || ''),
        ...textSearchFilter<EmployeeSummary>('fullName', { getText: (r) => r.fullName }),
        render: (_: string, record: EmployeeSummary) => (
          <div className={styles.nameCell}>
            <EmpAvatar name={record.fullName} photoUrl={record.photoUrl} photoBase64={record.photoBase64} size={32} />
            <div className={styles.nameCellText}>
              <span className={styles.nameCellName}>{record.fullName}</span>
              <span className={styles.nameCellEmail}>{record.workEmail}</span>
            </div>
          </div>
        ),
      },
      {
        title: 'Code',
        dataIndex: 'employeeCode',
        key: 'employeeCode',
        width: 120,
        sorter: (a, b) => (a.employeeCode || '').localeCompare(b.employeeCode || '', undefined, { numeric: true }),
        ...textSearchFilter<EmployeeSummary>('employeeCode'),
      },
      {
        title: 'Department',
        dataIndex: 'department',
        key: 'department',
        width: 160,
        sorter: (a, b) => (a.department || '').localeCompare(b.department || ''),
        ...categoryFilter<EmployeeSummary>('department', data),
      },
      {
        title: 'Designation',
        dataIndex: 'designation',
        key: 'designation',
        width: 180,
        sorter: (a, b) => (a.designation || '').localeCompare(b.designation || ''),
        ...categoryFilter<EmployeeSummary>('designation', data),
      },
      {
        title: 'Grade',
        dataIndex: 'grade',
        key: 'grade',
        width: 100,
        sorter: (a, b) => (a.grade || '').localeCompare(b.grade || ''),
        ...categoryFilter<EmployeeSummary>('grade', data),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        sorter: (a, b) => {
          const s = (r: EmployeeSummary) =>
            r.isActive !== undefined ? (r.isActive ? 'ACTIVE' : 'INACTIVE') : (r.status || '');
          return s(a).localeCompare(s(b));
        },
        ...categoryFilter<EmployeeSummary>('status', data, {
          getValue: (r) =>
            r.isActive !== undefined ? (r.isActive ? 'ACTIVE' : 'INACTIVE') : r.status,
        }),
        render: (_: EmployeeSummary['status'], record: EmployeeSummary) => {
          const displayStatus = record.isActive !== undefined
            ? (record.isActive ? 'ACTIVE' : 'INACTIVE')
            : record.status;
          return <EmpStatusBadge status={displayStatus} size="small" />;
        },
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 120,
        align: 'center',
        render: (_: unknown, record: EmployeeSummary) => (
          <div className={styles.actionBtnGroup}>
            {/* Show View button if user has VIEW-only (no EDIT) */}
            {canView && !canEdit && (
              <Tooltip title="View Profile">
                <Button
                  type="link"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRowClick(record.handle);
                  }}
                >
                  View
                </Button>
              </Tooltip>
            )}
            
            {/* Show Edit button if user has EDIT permission */}
            {canEdit && (
              <Tooltip title="Edit Profile">
                <Button
                  type="link"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRowClick(record.handle);
                  }}
                >
                  Edit
                </Button>
              </Tooltip>
            )}
            
            {/* Show Delete button if user has DELETE permission */}
            {canDelete && (
              <Tooltip title="Delete Employee">
                <Button
                  type="link"
                  danger
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement delete functionality
                    console.log('Delete employee:', record.handle);
                  }}
                >
                  Delete
                </Button>
              </Tooltip>
            )}
            
            {/* Fallback: Show eye icon if only VIEW permission */}
            {canView && !canEdit && !canDelete && (
              <Tooltip title="View Profile">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRowClick(record.handle);
                  }}
                />
              </Tooltip>
            )}
          </div>
        ),
      },
    ],
    [data, onRowClick, canView, canEdit, canDelete]
  );

  return (
    <div className={styles.tableWrapper}>
      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
        Column filters apply to the loaded page.
      </div>
      <Table<EmployeeSummary>
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="handle"
        size="small"
        pagination={{
          current: currentPage,
          pageSize,
          total: totalCount,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          showTotal: (total) => `Total ${total} employees`,
          onChange: onPageChange,
        }}
        onRow={(record) => ({
          onClick: () => {
            // Allow row click for all VIEW users
            if (canView) {
              onRowClick(record.handle);
            }
          },
          style: { cursor: canView ? 'pointer' : 'default' },
        })}
        scroll={{ x: 900 }}
      />
    </div>
  );
};

export default EmployeeTable;

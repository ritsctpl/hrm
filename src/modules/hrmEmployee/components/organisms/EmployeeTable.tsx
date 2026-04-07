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
import type { EmployeeTableProps } from '../../types/ui.types';
import { PAGE_SIZE_OPTIONS } from '../../utils/constants';
import styles from '../../styles/HrmEmployeeTable.module.css';

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  data,
  loading,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onRowClick,
}) => {
  const columns: ColumnsType<EmployeeSummary> = useMemo(
    () => [
      {
        title: 'Employee',
        dataIndex: 'fullName',
        key: 'fullName',
        width: 260,
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
      },
      {
        title: 'Department',
        dataIndex: 'department',
        key: 'department',
        width: 160,
      },
      {
        title: 'Designation',
        dataIndex: 'designation',
        key: 'designation',
        width: 180,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (_: unknown, record: EmployeeSummary) => {
          const displayStatus: 'ACTIVE' | 'INACTIVE' = 
            record.isActive !== undefined 
              ? (record.isActive === true ? 'ACTIVE' : 'INACTIVE')
              : (record.status as 'ACTIVE' | 'INACTIVE');
          return <EmpStatusBadge status={displayStatus} size="small" />;
        },
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 80,
        align: 'center',
        render: (_: unknown, record: EmployeeSummary) => (
          <div className={styles.actionBtnGroup}>
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
          </div>
        ),
      },
    ],
    [onRowClick]
  );

  return (
    <div className={styles.tableWrapper}>
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
          onClick: () => onRowClick(record.handle),
          style: { cursor: 'pointer' },
        })}
        scroll={{ x: 900 }}
      />
    </div>
  );
};

export default EmployeeTable;

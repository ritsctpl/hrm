'use client';

import React from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Role } from '../../types/domain.types';
import type { RoleTableProps } from '../../types/ui.types';
import RbacStatusBadge from '../atoms/RbacStatusBadge';
import RbacScopeTag from '../atoms/RbacScopeTag';
import styles from '../../styles/RoleManagement.module.css';

const RoleTable: React.FC<RoleTableProps> = ({
  data,
  isLoading,
  selectedHandle,
  onRowClick,
}) => {
  const columns: ColumnsType<Role> = [
    {
      title: 'Code',
      dataIndex: 'roleCode',
      key: 'roleCode',
      width: 140,
      ellipsis: true,
    },
    {
      title: 'Name',
      dataIndex: 'roleName',
      key: 'roleName',
      ellipsis: true,
    },
    {
      title: 'Scope',
      dataIndex: 'roleScope',
      key: 'roleScope',
      width: 110,
      render: (scope: string) => <RbacScopeTag scope={scope} />,
    },
    {
      title: 'Status',
      key: 'status',
      width: 90,
      render: (_, record) => (
        <RbacStatusBadge
          isActive={record.isActive}
          isSystemRole={record.isSystemRole}
        />
      ),
    },
    {
      title: 'Perms',
      dataIndex: 'permissionCount',
      key: 'permissionCount',
      width: 65,
      align: 'right',
    },
  ];

  return (
    <Table<Role>
      columns={columns}
      dataSource={data}
      rowKey="handle"
      loading={isLoading}
      size="small"
      pagination={false}
      scroll={{ y: 400 }}
      rowClassName={(record) =>
        record.handle === selectedHandle ? styles.selectedRow : ''
      }
      onRow={(record) => ({
        onClick: () => onRowClick(record),
        className: styles.tableRow,
      })}
      className={styles.roleTable}
    />
  );
};

export default RoleTable;

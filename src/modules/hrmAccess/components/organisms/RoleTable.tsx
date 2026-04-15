'use client';

import React from 'react';
import { Table, Button, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
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
  onDelete,
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
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (text: string | null) => text || '-',
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
    {
      title: 'Created Date',
      dataIndex: 'createdDateTime',
      key: 'createdDateTime',
      width: 110,
      render: (date: string) => {
        if (!date) return '-';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Popconfirm
          title="Delete Role"
          description={`Are you sure you want to delete "${record.roleName}"?`}
          onConfirm={(e) => {
            e?.stopPropagation();
            onDelete?.(record);
          }}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          disabled={record.isSystemRole}
        >
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            danger
            disabled={record.isSystemRole}
            onClick={(e) => e.stopPropagation()}
            title={record.isSystemRole ? 'System roles cannot be deleted' : 'Delete role'}
          />
        </Popconfirm>
      ),
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

import React from 'react';
import { Table, Button, Space, Tag, Popconfirm, Empty } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UserRoleAssignment } from '../../types/domain.types';
import { textSearchFilter, categoryFilter, dateRangeFilter } from '@/components/tableColumnFilters';
import styles from '../../styles/UserRoleAssignment.module.css';

interface UserAssignmentTableProps {
  assignments: UserRoleAssignment[];
  isLoading: boolean;
  isRevoking: boolean;
  selectedHandle: string | null;
  onRowClick: (handle: string) => void;
  onRevoke: (handle: string) => void;
}

const UserAssignmentTable: React.FC<UserAssignmentTableProps> = ({
  assignments,
  isLoading,
  isRevoking,
  selectedHandle,
  onRowClick,
  onRevoke,
}) => {
  if (assignments.length === 0 && !isLoading) {
    return <Empty description="No role assignments" style={{ marginTop: 20 }} />;
  }

  const columns: ColumnsType<UserRoleAssignment> = [
    {
      title: 'Role Code',
      dataIndex: 'roleCode',
      key: 'roleCode',
      width: '20%',
      ...textSearchFilter<UserRoleAssignment>('roleCode'),
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Role Name',
      dataIndex: 'roleName',
      key: 'roleName',
      width: '25%',
      ...textSearchFilter<UserRoleAssignment>('roleName'),
    },
    {
      title: 'Effective From',
      dataIndex: 'effectiveFrom',
      key: 'effectiveFrom',
      width: '15%',
      ...dateRangeFilter<UserRoleAssignment>('effectiveFrom'),
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Effective To',
      dataIndex: 'effectiveTo',
      key: 'effectiveTo',
      width: '15%',
      ...dateRangeFilter<UserRoleAssignment>('effectiveTo'),
      render: (date: string | null) => (date ? new Date(date).toLocaleDateString() : 'Active'),
    },
    {
      title: 'Status',
      dataIndex: 'assignmentStatus',
      key: 'assignmentStatus',
      width: '12%',
      ...categoryFilter<UserRoleAssignment>('assignmentStatus', assignments),
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          ACTIVE: 'green',
          EXPIRED: 'red',
          PENDING: 'orange',
          REVOKED: 'default',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '13%',
      render: (_: unknown, record: UserRoleAssignment) => (
        <Space>
          <Popconfirm
            title="Revoke Assignment"
            description={`Are you sure you want to revoke the ${record.roleCode} role from this user?`}
            onConfirm={() => onRevoke(record.handle)}
            okText="Revoke"
            okType="danger"
            cancelText="Cancel"
          >
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={isRevoking && selectedHandle === record.handle}
            >
              Revoke
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.assignmentTable}>
      <h4>Current Assignments</h4>
      <Table
        columns={columns}
        dataSource={assignments}
        rowKey="handle"
        loading={isLoading}
        pagination={false}
        scroll={{ x: 1000 }}
        size="small"
        onRow={(record) => ({
          onClick: () => onRowClick(record.handle),
          className: selectedHandle === record.handle ? styles.selectedRow : '',
        })}
      />
    </div>
  );
};

export default UserAssignmentTable;

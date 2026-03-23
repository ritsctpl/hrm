import React from 'react';
import { Table, Button, Space, Tag, Popconfirm, Empty } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { UserRoleAssignment } from '../../types/domain.types';
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

  const columns = [
    {
      title: 'Role Code',
      dataIndex: 'roleCode',
      key: 'roleCode',
      width: '20%',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Role Name',
      dataIndex: 'roleName',
      key: 'roleName',
      width: '25%',
    },
    {
      title: 'Effective From',
      dataIndex: 'effectiveFrom',
      key: 'effectiveFrom',
      width: '15%',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Effective To',
      dataIndex: 'effectiveTo',
      key: 'effectiveTo',
      width: '15%',
      render: (date: string | null) => (date ? new Date(date).toLocaleDateString() : 'Active'),
    },
    {
      title: 'Status',
      dataIndex: 'assignmentStatus',
      key: 'assignmentStatus',
      width: '12%',
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

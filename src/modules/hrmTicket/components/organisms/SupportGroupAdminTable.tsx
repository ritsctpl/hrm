'use client';

import React from 'react';
import { Button, Popconfirm, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TicketSupportGroup } from '../../types/domain.types';
import { displayNameOnly } from '../../utils/ticketHelpers';

interface Props {
  groups: TicketSupportGroup[];
  loading: boolean;
  canManage: boolean;
  onCreate: () => void;
  onEdit: (group: TicketSupportGroup) => void;
  onDelete: (code: string) => void;
  onReload: () => void;
}

const SupportGroupAdminTable: React.FC<Props> = ({
  groups,
  loading,
  canManage,
  onCreate,
  onEdit,
  onDelete,
  onReload,
}) => {
  const columns: ColumnsType<TicketSupportGroup> = [
    {
      title: 'Group',
      dataIndex: 'name',
      render: (value: string, row) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>{row.groupCode}</div>
        </div>
      ),
    },
    {
      title: 'Lead',
      dataIndex: 'leadName',
      width: 160,
      render: (value: string) => (
        <span style={{ fontSize: 12 }}>{value ? displayNameOnly(value) : '—'}</span>
      ),
    },
    {
      title: 'Agents',
      dataIndex: 'memberNames',
      render: (value: string[]) =>
        value?.length ? (
          <Space size={4} wrap>
            {value.slice(0, 4).map((name) => (
              <Tag key={name} style={{ margin: 0, fontSize: 11 }}>
                {displayNameOnly(name)}
              </Tag>
            ))}
            {value.length > 4 ? (
              <Tooltip title={value.slice(4).map(displayNameOnly).join(', ')}>
                <Tag style={{ margin: 0, fontSize: 11 }}>+{value.length - 4}</Tag>
              </Tooltip>
            ) : null}
          </Space>
        ) : (
          <span style={{ fontSize: 12, color: '#cf1322' }}>No agents — nobody sees this queue</span>
        ),
    },
    {
      title: 'Categories',
      dataIndex: 'categoryCodes',
      width: 110,
      render: (value: string[]) => <span style={{ fontSize: 12 }}>{value?.length ?? 0}</span>,
    },
    {
      title: 'Open',
      dataIndex: 'openTicketCount',
      width: 90,
      render: (value: number, row) => (
        <span style={{ fontSize: 12 }}>
          {value ?? 0}
          {row.unassignedCount ? (
            <Tooltip title={`${row.unassignedCount} unassigned`}>
              <Tag color="volcano" style={{ marginLeft: 6, fontSize: 10 }}>
                {row.unassignedCount}
              </Tag>
            </Tooltip>
          ) : null}
        </span>
      ),
    },
    ...(canManage
      ? ([
          {
            title: '',
            key: 'actions',
            width: 130,
            render: (_: unknown, row: TicketSupportGroup) => (
              <Space size={4}>
                <Button size="small" type="link" onClick={() => onEdit(row)}>
                  Edit
                </Button>
                <Popconfirm
                  title="Remove this support group?"
                  description="Refused while any category still routes here."
                  okText="Remove"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => onDelete(row.groupCode)}
                >
                  <Button size="small" type="link" danger>
                    Remove
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ] as ColumnsType<TicketSupportGroup>)
      : []),
  ];

  return (
    <div style={{ background: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Typography.Text style={{ fontSize: 13, fontWeight: 600 }}>Support groups</Typography.Text>
        <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>
          Membership decides whose queue a ticket appears in — it is not an RBAC role.
        </Typography.Text>
        <Space style={{ marginLeft: 'auto' }}>
          <Button size="small" icon={<ReloadOutlined />} onClick={onReload} />
          {canManage ? (
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={onCreate}>
              New group
            </Button>
          ) : null}
        </Space>
      </div>
      <Table<TicketSupportGroup>
        rowKey="groupCode"
        size="small"
        columns={columns}
        dataSource={groups}
        loading={loading}
        pagination={false}
        scroll={{ y: 'calc(100vh - 300px)' }}
        locale={{ emptyText: 'No support groups yet — create one before adding categories.' }}
      />
    </div>
  );
};

export default SupportGroupAdminTable;

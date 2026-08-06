'use client';

import React from 'react';
import { Button, Popconfirm, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import TicketPriorityTag from '../atoms/TicketPriorityTag';
import type { TicketCategory } from '../../types/domain.types';

interface Props {
  categories: TicketCategory[];
  loading: boolean;
  canManage: boolean;
  onCreate: () => void;
  onEdit: (category: TicketCategory) => void;
  onDelete: (code: string) => void;
  onReload: () => void;
}

/** SLA hours as the form stores them, with the priority multiplier explained rather than applied. */
const slaText = (hours?: number | null) => (hours ? `${hours} h` : '—');

const CategoryAdminTable: React.FC<Props> = ({
  categories,
  loading,
  canManage,
  onCreate,
  onEdit,
  onDelete,
  onReload,
}) => {
  const columns: ColumnsType<TicketCategory> = [
    {
      title: 'Category',
      dataIndex: 'name',
      render: (value: string, row) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {row.parentCode ? <span style={{ color: '#bfbfbf' }}>— </span> : null}
            {value}
            {row.restricted ? (
              <Tooltip title="Hidden from the raise form; agents can still file here">
                <Tag style={{ marginLeft: 8, fontSize: 10 }}>Restricted</Tag>
              </Tooltip>
            ) : null}
          </div>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>{row.categoryCode}</div>
        </div>
      ),
    },
    {
      title: 'Routes to',
      dataIndex: 'supportGroupName',
      width: 160,
      render: (value: string, row) => (
        <span style={{ fontSize: 12 }}>{value ?? row.supportGroupCode ?? '—'}</span>
      ),
    },
    {
      title: 'Default priority',
      dataIndex: 'defaultPriority',
      width: 130,
      render: (_, row) => <TicketPriorityTag priority={row.defaultPriority} />,
    },
    {
      title: (
        <Tooltip title="Before the priority multiplier — a Critical ticket gets a quarter of this">
          <span>Response SLA</span>
        </Tooltip>
      ),
      dataIndex: 'responseSlaHours',
      width: 120,
      render: (value: number) => <span style={{ fontSize: 12 }}>{slaText(value)}</span>,
    },
    {
      title: 'Resolution SLA',
      dataIndex: 'resolutionSlaHours',
      width: 130,
      render: (value: number) => <span style={{ fontSize: 12 }}>{slaText(value)}</span>,
    },
    {
      title: 'Open',
      dataIndex: 'openTicketCount',
      width: 80,
      render: (value: number) => <span style={{ fontSize: 12 }}>{value ?? 0}</span>,
    },
    ...(canManage
      ? ([
          {
            title: '',
            key: 'actions',
            width: 130,
            render: (_: unknown, row: TicketCategory) => (
              <Space size={4}>
                <Button size="small" type="link" onClick={() => onEdit(row)}>
                  Edit
                </Button>
                {/* The backend refuses while live tickets or sub-categories remain and says which;
                    that message is shown verbatim rather than being pre-empted here, because this
                    table's counts can be a page-load out of date. */}
                <Popconfirm
                  title="Remove this category?"
                  description="Existing tickets keep their category label."
                  okText="Remove"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => onDelete(row.categoryCode)}
                >
                  <Button size="small" type="link" danger>
                    Remove
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ] as ColumnsType<TicketCategory>)
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
        <Typography.Text style={{ fontSize: 13, fontWeight: 600 }}>Categories</Typography.Text>
        <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>
          Each category names the team that receives its tickets and the targets they are held to.
        </Typography.Text>
        <Space style={{ marginLeft: 'auto' }}>
          <Button size="small" icon={<ReloadOutlined />} onClick={onReload} />
          {canManage ? (
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={onCreate}>
              New category
            </Button>
          ) : null}
        </Space>
      </div>
      <Table<TicketCategory>
        rowKey="categoryCode"
        size="small"
        columns={columns}
        dataSource={categories}
        loading={loading}
        pagination={false}
        scroll={{ y: 'calc(100vh - 300px)' }}
        locale={{ emptyText: 'No categories yet — tickets cannot be raised until one exists.' }}
      />
    </div>
  );
};

export default CategoryAdminTable;

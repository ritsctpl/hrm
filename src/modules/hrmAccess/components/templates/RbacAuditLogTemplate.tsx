'use client';

import React, { useState } from 'react';
import { Table, Button, Select, Input, message, Empty, Tag } from 'antd';
import { HrmAccessService } from '../../services/hrmAccessService';
import type { ColumnsType } from 'antd/es/table';
import type { RbacAuditLogDto } from '../../types/api.types';

interface Props {
  organizationId: string;
}

const ENTITY_TYPES = [
  { label: 'Role', value: 'ROLE' },
  { label: 'Permission', value: 'PERMISSION' },
  { label: 'Module', value: 'MODULE' },
  { label: 'User Role Assignment', value: 'USER_ROLE_ASSIGNMENT' },
];

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  ACTIVATE: 'cyan',
  DEACTIVATE: 'orange',
};

const RbacAuditLogTemplate: React.FC<Props> = ({ organizationId }) => {
  const [data, setData] = useState<RbacAuditLogDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [entityType, setEntityType] = useState<string>('ROLE');
  const [entityHandle, setEntityHandle] = useState<string>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const loadAuditLog = async (p = 0, size = pageSize) => {
    setLoading(true);
    try {
      const result = await HrmAccessService.fetchAuditLog(
        organizationId,
        entityType,
        entityHandle.trim() || '',
        p,
        size
      );
      setData(result.content);
      setTotal(result.totalElements);
      setPage(p);
    } catch {
      message.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<RbacAuditLogDto> = [
    {
      title: 'Timestamp',
      dataIndex: 'performedAt',
      width: 180,
      sorter: (a, b) => a.performedAt.localeCompare(b.performedAt),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 110,
      render: (action: string) => (
        <Tag color={ACTION_COLORS[action] ?? 'default'}>{action}</Tag>
      ),
    },
    { title: 'Entity Type', dataIndex: 'entityType', width: 140 },
    { title: 'Entity', dataIndex: 'entityHandle', width: 200, ellipsis: true },
    { title: 'Performed By', dataIndex: 'performedBy', width: 160 },
    {
      title: 'Before',
      dataIndex: 'beforeValue',
      ellipsis: true,
      render: (v: unknown) => v ? (
        <span style={{ fontSize: 11 }}>{typeof v === 'string' ? v : JSON.stringify(v)}</span>
      ) : '--',
    },
    {
      title: 'After',
      dataIndex: 'afterValue',
      ellipsis: true,
      render: (v: unknown) => v ? (
        <span style={{ fontSize: 11 }}>{typeof v === 'string' ? v : JSON.stringify(v)}</span>
      ) : '--',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      width: 140,
      ellipsis: true,
      render: (v: string | null) => v ?? '--',
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Select
          value={entityType}
          onChange={setEntityType}
          style={{ width: 200 }}
          options={ENTITY_TYPES}
        />
        <Input
          placeholder="Entity handle (optional)"
          value={entityHandle}
          onChange={(e) => setEntityHandle(e.target.value)}
          style={{ width: 240 }}
          allowClear
        />
        <Button type="primary" onClick={() => loadAuditLog(0)} loading={loading}>
          Load Audit Log
        </Button>
      </div>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="handle"
        loading={loading}
        size="small"
        scroll={{ x: 1100 }}
        pagination={{
          current: page + 1,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (t) => `${t} entries`,
          onChange: (p, s) => {
            setPageSize(s);
            loadAuditLog(p - 1, s);
          },
        }}
        locale={{ emptyText: <Empty description="Click Load Audit Log to view data" /> }}
      />
    </div>
  );
};

export default RbacAuditLogTemplate;

'use client';

import React, { useEffect } from 'react';
import { Table, Select, Input, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import styles from '../../styles/HrmOrganization.module.css';

const ENTITY_TYPES = [
  { value: '', label: 'All Entities' },
  { value: 'COMPANY_PROFILE', label: 'Company' },
  { value: 'BUSINESS_UNIT', label: 'Business Unit' },
  { value: 'DEPARTMENT', label: 'Department' },
  { value: 'LOCATION', label: 'Location' },
];

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
};

const OrgAuditLogPanel: React.FC = () => {
  const {
    auditLog,
    fetchAuditLog,
    setAuditEntityTypeFilter,
    setAuditEntityHandleFilter,
  } = useHrmOrganizationStore();

  useEffect(() => {
    fetchAuditLog(auditLog.entityTypeFilter, auditLog.entityHandleFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditLog.entityTypeFilter, auditLog.entityHandleFilter]);

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'performedAt',
      key: 'performedAt',
      width: 180,
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (v: string) => <Tag color={ACTION_COLORS[v] || 'default'}>{v}</Tag>,
    },
    {
      title: 'Entity Type',
      dataIndex: 'entityType',
      key: 'entityType',
      width: 140,
    },
    {
      title: 'Before Value',
      dataIndex: 'beforeValue',
      key: 'beforeValue',
      ellipsis: true,
      render: (v: unknown) => (v != null ? (typeof v === 'object' ? JSON.stringify(v) : String(v)) : '-'),
    },
    {
      title: 'After Value',
      dataIndex: 'afterValue',
      key: 'afterValue',
      ellipsis: true,
      render: (v: unknown) => (v != null ? (typeof v === 'object' ? JSON.stringify(v) : String(v)) : '-'),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 140,
      render: (v: string | null) => v || '-',
    },
    {
      title: 'Performed By',
      dataIndex: 'performedBy',
      key: 'performedBy',
      width: 140,
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div className={styles.listHeader}>
        <div className={styles.listHeaderLeft}>
          <span className={styles.listTitle}>Audit Log</span>
          <Select
            value={auditLog.entityTypeFilter}
            onChange={setAuditEntityTypeFilter}
            options={ENTITY_TYPES}
            size="small"
            style={{ width: 160 }}
          />
          <Input
            placeholder="Entity handle..."
            prefix={<SearchOutlined />}
            value={auditLog.entityHandleFilter}
            onChange={(e) => setAuditEntityHandleFilter(e.target.value)}
            size="small"
            style={{ width: 200 }}
            allowClear
          />
        </div>
      </div>
      <Table
        dataSource={auditLog.entries}
        columns={columns}
        rowKey="handle"
        loading={auditLog.isLoading}
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />
    </div>
  );
};

export default OrgAuditLogPanel;

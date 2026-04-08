'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Table, Select, Input, Tag, Button, Modal, Tooltip } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import styles from '../../styles/HrmOrganization.module.css';

const ENTITY_TYPES = [
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

/** Detect changed keys between two objects */
function getChangedKeys(before: unknown, after: unknown): Set<string> {
  const changed = new Set<string>();
  if (typeof before !== 'object' || typeof after !== 'object' || !before || !after) return changed;
  const b = before as Record<string, unknown>;
  const a = after as Record<string, unknown>;
  for (const key of Object.keys(a)) {
    if (JSON.stringify(b[key]) !== JSON.stringify(a[key])) changed.add(key);
  }
  return changed;
}

/** Truncate JSON to short preview */
function truncateJson(v: unknown, max = 60): string {
  if (v == null) return '-';
  const str = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return str.length > max ? str.substring(0, max) + '...' : str;
}

const OrgAuditLogPanel: React.FC = () => {
  const {
    auditLog,
    selectedCompanyHandle,
    fetchAuditLog,
    setAuditEntityTypeFilter,
    setAuditEntityHandleFilter,
  } = useHrmOrganizationStore();

  const [modalData, setModalData] = useState<{ title: string; data: unknown; beforeData?: unknown } | null>(null);

  useEffect(() => {
    const entityHandle = selectedCompanyHandle && selectedCompanyHandle !== 'new'
      ? selectedCompanyHandle
      : auditLog.entityHandleFilter;
    fetchAuditLog(auditLog.entityTypeFilter, entityHandle);
  }, [auditLog.entityTypeFilter, auditLog.entityHandleFilter, selectedCompanyHandle, fetchAuditLog]);

  const handleViewJson = useCallback((title: string, data: unknown, beforeData?: unknown) => {
    setModalData({ title, data, beforeData });
  }, []);

  /** Render JSON with changed keys highlighted */
  const renderHighlightedJson = (data: unknown, changedKeys: Set<string>) => {
    if (typeof data !== 'object' || !data) return JSON.stringify(data, null, 2);
    const obj = data as Record<string, unknown>;
    return Object.entries(obj).map(([key, val]) => {
      const valStr = JSON.stringify(val, null, 2);
      const isChanged = changedKeys.has(key);
      return (
        <div key={key} style={{
          padding: '2px 4px',
          backgroundColor: isChanged ? '#fffbe6' : 'transparent',
          borderLeft: isChanged ? '3px solid #faad14' : '3px solid transparent',
          marginBottom: 1,
          fontFamily: 'monospace',
          fontSize: 12,
        }}>
          <span style={{ color: '#1890ff', fontWeight: isChanged ? 700 : 400 }}>"{key}"</span>
          <span style={{ color: '#595959' }}>: </span>
          <span style={{ color: isChanged ? '#d48806' : '#262626', fontWeight: isChanged ? 600 : 400 }}>
            {valStr}
          </span>
        </div>
      );
    });
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'performedAt',
      key: 'performedAt',
      width: 170,
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
      width: 130,
    },
    {
      title: 'Before Value',
      dataIndex: 'beforeValue',
      key: 'beforeValue',
      ellipsis: true,
      render: (v: unknown, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {truncateJson(v)}
          </span>
          {v != null && (
            <Tooltip title="View JSON">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={(e) => { e.stopPropagation(); handleViewJson('Before Value', v); }}
                style={{ flexShrink: 0, opacity: 0.5 }}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: 'After Value',
      dataIndex: 'afterValue',
      key: 'afterValue',
      ellipsis: true,
      render: (v: unknown, record: any) => {
        const changed = getChangedKeys(record.beforeValue, v);
        const hasChanges = changed.size > 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              backgroundColor: hasChanges ? '#fffbe6' : 'transparent',
              padding: hasChanges ? '1px 4px' : 0,
              borderRadius: 3,
              fontWeight: hasChanges ? 500 : 400,
            }}>
              {truncateJson(v)}
            </span>
            {v != null && (
              <Tooltip title="View JSON (changes highlighted)">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={(e) => { e.stopPropagation(); handleViewJson('After Value', v, record.beforeValue); }}
                  style={{ flexShrink: 0, opacity: 0.5 }}
                />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: 'Performed By',
      dataIndex: 'performedBy',
      key: 'performedBy',
      width: 130,
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
        pagination={false}
        scroll={{ y: 'calc(100vh - 300px)' }}
      />

      <Modal
        title={modalData?.title || 'JSON Viewer'}
        open={!!modalData}
        onCancel={() => setModalData(null)}
        footer={null}
        width={700}
      >
        {modalData?.title === 'After Value' && modalData?.beforeData ? (
          <div>
            <div style={{ marginBottom: 8, padding: '6px 12px', background: '#fffbe6', borderRadius: 6, fontSize: 12, color: '#d48806' }}>
              Fields with yellow highlight show what changed from the previous value.
            </div>
            <div style={{ maxHeight: 500, overflow: 'auto', padding: 8, background: '#fafafa', borderRadius: 6 }}>
              {renderHighlightedJson(modalData.data, getChangedKeys(modalData.beforeData, modalData.data))}
            </div>
          </div>
        ) : (
          <pre style={{ maxHeight: 500, overflow: 'auto', padding: 12, background: '#fafafa', borderRadius: 6, fontSize: 12 }}>
            {JSON.stringify(modalData?.data, null, 2)}
          </pre>
        )}
      </Modal>
    </div>
  );
};

export default OrgAuditLogPanel;

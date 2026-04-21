'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Table, Select, Input, Tag, Button, Modal, Tooltip } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import {
  computeChanges,
  objectToRows,
  extractEntityName,
  type AuditChangeRow,
} from '../../utils/auditFieldLabels';
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

const MAX_SUMMARY_FIELDS = 3;

interface AuditEntry {
  handle: string;
  action: string;
  entityType: string;
  beforeValue: unknown;
  afterValue: unknown;
  performedAt: string;
  performedBy: string;
}

type DetailsModalState =
  | { kind: 'changes'; rows: AuditChangeRow[] }
  | { kind: 'snapshot'; label: string; rows: { key: string; label: string; value: string }[] }
  | null;

const OrgAuditLogPanel: React.FC = () => {
  const {
    auditLog,
    selectedCompanyHandle,
    fetchAuditLog,
    setAuditEntityTypeFilter,
    setAuditEntityHandleFilter,
  } = useHrmOrganizationStore();

  const [modalState, setModalState] = useState<DetailsModalState>(null);
  const [modalTitle, setModalTitle] = useState<string>('');

  useEffect(() => {
    const entityHandle = selectedCompanyHandle && selectedCompanyHandle !== 'new'
      ? selectedCompanyHandle
      : auditLog.entityHandleFilter;
    fetchAuditLog(auditLog.entityTypeFilter, entityHandle);
  }, [auditLog.entityTypeFilter, auditLog.entityHandleFilter, selectedCompanyHandle, fetchAuditLog]);

  const openChanges = useCallback((record: AuditEntry) => {
    const entityName =
      extractEntityName(record.afterValue) ||
      extractEntityName(record.beforeValue) ||
      record.entityType;
    if (record.action === 'UPDATE') {
      const rows = computeChanges(record.beforeValue, record.afterValue);
      setModalTitle(`Changes — ${entityName}`);
      setModalState({ kind: 'changes', rows });
    } else if (record.action === 'CREATE') {
      const rows = objectToRows(record.afterValue);
      setModalTitle(`Created — ${entityName}`);
      setModalState({ kind: 'snapshot', label: 'Value', rows });
    } else if (record.action === 'DELETE') {
      const rows = objectToRows(record.beforeValue);
      setModalTitle(`Deleted — ${entityName}`);
      setModalState({ kind: 'snapshot', label: 'Value', rows });
    }
  }, []);

  const summaryOf = useCallback((record: AuditEntry): { text: string; tone: 'changes' | 'snapshot' } => {
    if (record.action === 'CREATE') {
      const name = extractEntityName(record.afterValue);
      return { text: name ? `Created ${name}` : 'Record created', tone: 'snapshot' };
    }
    if (record.action === 'DELETE') {
      const name = extractEntityName(record.beforeValue);
      return { text: name ? `Deleted ${name}` : 'Record deleted', tone: 'snapshot' };
    }
    // UPDATE
    const rows = computeChanges(record.beforeValue, record.afterValue);
    if (rows.length === 0) return { text: 'No visible changes', tone: 'changes' };
    const labels = rows.map((r) => r.label);
    const shown = labels.slice(0, MAX_SUMMARY_FIELDS).join(', ');
    const extra = labels.length > MAX_SUMMARY_FIELDS ? ` +${labels.length - MAX_SUMMARY_FIELDS} more` : '';
    return {
      text: `${rows.length} field${rows.length === 1 ? '' : 's'} changed: ${shown}${extra}`,
      tone: 'changes',
    };
  }, []);

  const columns = useMemo(
    () => [
      {
        title: 'Timestamp',
        dataIndex: 'performedAt',
        key: 'performedAt',
        width: 170,
        ellipsis: true,
        render: (v: string) => {
          const formatted = v ? new Date(v).toLocaleString() : '—';
          return <Tooltip title={formatted}><span>{formatted}</span></Tooltip>;
        },
      },
      {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        width: 110,
        render: (v: string) => (
          <Tag color={ACTION_COLORS[v] || 'default'} style={{ margin: 0 }}>{v}</Tag>
        ),
      },
      {
        title: 'Entity Type',
        dataIndex: 'entityType',
        key: 'entityType',
        width: 140,
        ellipsis: true,
        render: (v: string) => {
          const match = ENTITY_TYPES.find((e) => e.value === v);
          const label = match ? match.label : v;
          return <Tooltip title={label}><span>{label}</span></Tooltip>;
        },
      },
      {
        title: 'Changes',
        key: 'changes',
        ellipsis: true,
        render: (_: unknown, record: AuditEntry) => {
          const { text } = summaryOf(record);
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <Tooltip title={text} placement="topLeft">
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#262626',
                  }}
                >
                  {text}
                </span>
              </Tooltip>
              <Tooltip title="View details">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    openChanges(record);
                  }}
                  style={{ flexShrink: 0 }}
                />
              </Tooltip>
            </div>
          );
        },
      },
      {
        title: 'Performed By',
        dataIndex: 'performedBy',
        key: 'performedBy',
        width: 140,
        ellipsis: true,
        render: (v: string) => {
          const label = v || '—';
          return <Tooltip title={label}><span>{label}</span></Tooltip>;
        },
      },
    ],
    [openChanges, summaryOf]
  );

  const renderModalBody = () => {
    if (!modalState) return null;
    if (modalState.kind === 'changes') {
      if (modalState.rows.length === 0) {
        return <div style={{ color: '#8c8c8c', padding: 16 }}>No user-facing fields changed.</div>;
      }
      return (
        <Table
          size="small"
          pagination={false}
          dataSource={modalState.rows.map((r) => ({ ...r, rowKey: r.key }))}
          rowKey="rowKey"
          columns={[
            { title: 'Field', dataIndex: 'label', key: 'label', width: 200 },
            {
              title: 'Before',
              dataIndex: 'before',
              key: 'before',
              render: (v: string) => (
                <span style={{ color: '#8c8c8c', textDecoration: v === '—' ? 'none' : 'line-through' }}>
                  {v}
                </span>
              ),
            },
            {
              title: 'After',
              dataIndex: 'after',
              key: 'after',
              render: (v: string) => <span style={{ color: '#237804', fontWeight: 500 }}>{v}</span>,
            },
          ]}
        />
      );
    }
    // snapshot (CREATE / DELETE)
    if (modalState.rows.length === 0) {
      return <div style={{ color: '#8c8c8c', padding: 16 }}>No user-facing fields recorded.</div>;
    }
    return (
      <Table
        size="small"
        pagination={false}
        dataSource={modalState.rows.map((r) => ({ ...r, rowKey: r.key }))}
        rowKey="rowKey"
        columns={[
          { title: 'Field', dataIndex: 'label', key: 'label', width: 220 },
          { title: modalState.label, dataIndex: 'value', key: 'value' },
        ]}
      />
    );
  };

  return (
    <div
      style={{
        padding: 16,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <div className={styles.listHeader}>
        <div className={styles.listHeaderLeft} style={{ flexWrap: 'wrap', gap: 8 }}>
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
      <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
        <Table
          dataSource={auditLog.entries}
          columns={columns}
          rowKey="handle"
          loading={auditLog.isLoading}
          size="small"
          pagination={false}
          tableLayout="fixed"
          scroll={{ x: 900, y: 'calc(100vh - 320px)' }}
          style={{ width: '100%' }}
        />
      </div>

      <Modal
        title={modalTitle}
        open={!!modalState}
        onCancel={() => setModalState(null)}
        footer={null}
        width={760}
      >
        {renderModalBody()}
      </Modal>
    </div>
  );
};

export default OrgAuditLogPanel;

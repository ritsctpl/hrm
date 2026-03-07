'use client';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface AuditEntry {
  action: string;
  changedBy: string;
  changedAt: string;
}

interface Props {
  auditLog?: AuditEntry[];
}

const columns: ColumnsType<AuditEntry> = [
  { title: 'Action', dataIndex: 'action', key: 'action' },
  { title: 'Changed By', dataIndex: 'changedBy', key: 'changedBy' },
  { title: 'Date/Time', dataIndex: 'changedAt', key: 'changedAt' },
];

export default function ProjectAuditTab({ auditLog = [] }: Props) {
  return (
    <Table
      columns={columns}
      dataSource={auditLog}
      rowKey="changedAt"
      size="small"
      pagination={{ pageSize: 20 }}
      locale={{ emptyText: 'No audit records' }}
    />
  );
}

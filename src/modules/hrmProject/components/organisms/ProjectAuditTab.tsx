'use client';
import { useEffect, useMemo, useState } from 'react';
import { Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { HrmProjectService } from '../../services/hrmProjectService';
import type { ProjectAuditResponse } from '../../types/api.types';

const { Text } = Typography;

// Match the Reports smart-table: sticky header, body scrolls, no pagination.
const TABLE_SCROLL = { x: 'max-content' as const, y: 'calc(100vh - 320px)' };
const uniq = <T,>(arr: T[]): T[] => Array.from(new Set(arr));

export default function ProjectAuditTab() {
  const { selectedProject } = useHrmProjectStore();
  const [log, setLog] = useState<ProjectAuditResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const columns: ColumnsType<ProjectAuditResponse> = useMemo(() => [
    {
      title: 'Action', dataIndex: 'action', key: 'action', width: 220,
      filters: uniq(log.map((r) => r.action).filter(Boolean) as string[]).map((a) => ({ text: a, value: a })),
      onFilter: (v, r) => r.action === v,
    },
    {
      title: 'Details', dataIndex: 'details', key: 'details',
      render: (d?: string) => d || <Text type="secondary">—</Text>,
    },
    {
      title: 'Changed By', key: 'changedBy', width: 180,
      filters: uniq(log.map((r) => r.changedByName || r.changedBy).filter(Boolean) as string[]).map((c) => ({ text: c, value: c })),
      onFilter: (v, r) => (r.changedByName || r.changedBy) === v,
      render: (_, r) => r.changedByName || r.changedBy || <Text type="secondary">—</Text>,
    },
    {
      title: 'Date/Time', dataIndex: 'changedAt', key: 'changedAt', width: 170,
      defaultSortOrder: 'descend',
      sorter: (a, b) => dayjs(a.changedAt).valueOf() - dayjs(b.changedAt).valueOf(),
      render: (v: string) => {
        const d = v ? dayjs(v) : null;
        return d && d.isValid() ? d.format('DD MMM YYYY, HH:mm') : <Text type="secondary">—</Text>;
      },
    },
  ], [log]);

  useEffect(() => {
    if (!selectedProject) return;
    let cancelled = false;
    setLoading(true);
    HrmProjectService.getProjectHistory(getOrganizationId(), selectedProject.handle)
      .then((data) => { if (!cancelled) setLog(data); })
      .catch(() => { if (!cancelled) setLog([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedProject?.handle]);

  return (
    <Table
      columns={columns}
      dataSource={log}
      loading={loading}
      rowKey={(r, i) => `${r.changedAt}-${i}`}
      size="small"
      pagination={false}
      scroll={TABLE_SCROLL}
      sticky
      locale={{ emptyText: 'No history yet' }}
    />
  );
}

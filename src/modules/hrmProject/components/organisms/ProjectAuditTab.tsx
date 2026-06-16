'use client';
import { useEffect, useState } from 'react';
import { Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { HrmProjectService } from '../../services/hrmProjectService';
import type { ProjectAuditResponse } from '../../types/api.types';

const { Text } = Typography;

const columns: ColumnsType<ProjectAuditResponse> = [
  { title: 'Action', dataIndex: 'action', key: 'action', width: 220 },
  {
    title: 'Details', dataIndex: 'details', key: 'details',
    render: (d?: string) => d || <Text type="secondary">—</Text>,
  },
  {
    title: 'Changed By', key: 'changedBy', width: 180,
    render: (_, r) => r.changedByName || r.changedBy || <Text type="secondary">—</Text>,
  },
  {
    title: 'Date/Time', dataIndex: 'changedAt', key: 'changedAt', width: 170,
    render: (v: string) => {
      const d = v ? dayjs(v) : null;
      return d && d.isValid() ? d.format('DD MMM YYYY, HH:mm') : <Text type="secondary">—</Text>;
    },
  },
];

export default function ProjectAuditTab() {
  const { selectedProject } = useHrmProjectStore();
  const [log, setLog] = useState<ProjectAuditResponse[]>([]);
  const [loading, setLoading] = useState(false);

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
      pagination={{ pageSize: 20, hideOnSinglePage: true }}
      locale={{ emptyText: 'No history yet' }}
    />
  );
}

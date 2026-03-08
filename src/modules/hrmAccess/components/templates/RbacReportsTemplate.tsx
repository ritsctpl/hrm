'use client';

import React, { useState } from 'react';
import { Table, Button, Input, message, Empty, Card, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { HrmAccessService } from '../../services/hrmAccessService';
import type { ColumnsType } from 'antd/es/table';
import type { UserAccessReportResponse, UserRoleAssignmentResponse } from '../../types/api.types';

interface Props {
  site: string;
}

const RbacReportsTemplate: React.FC<Props> = ({ site }) => {
  const [userAccessData, setUserAccessData] = useState<UserAccessReportResponse[]>([]);
  const [orphanedData, setOrphanedData] = useState<UserRoleAssignmentResponse[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [loadingOrphaned, setLoadingOrphaned] = useState(false);
  const [searchUserId, setSearchUserId] = useState('');

  const loadUserAccessReport = async () => {
    setLoadingAccess(true);
    try {
      const data = await HrmAccessService.getUserAccessReport(site, searchUserId || undefined);
      setUserAccessData(data);
    } catch {
      message.error('Failed to load user access report');
    } finally {
      setLoadingAccess(false);
    }
  };

  const loadOrphanedReport = async () => {
    setLoadingOrphaned(true);
    try {
      const data = await HrmAccessService.getOrphanedExpiredAssignments(site);
      setOrphanedData(data);
    } catch {
      message.error('Failed to load orphaned/expired report');
    } finally {
      setLoadingOrphaned(false);
    }
  };

  // Flatten user access report for table display
  // UserAccessReportResponse is EffectivePermissionsResponse: { userId, userDisplayName, permissions[], evaluatedAt }
  const flattenedAccessData = userAccessData.flatMap((user) =>
    user.permissions.map((p, idx) => ({
      key: `${user.userId}-${idx}`,
      userId: user.userId,
      userName: user.userDisplayName,
      moduleCode: p.moduleCode,
      moduleName: p.moduleName,
      objectName: p.objectName,
      action: p.action,
      scopeValue: p.scopeValue,
      grantedByRoles: p.grantedByRoles,
    }))
  );

  const userAccessColumns: ColumnsType<(typeof flattenedAccessData)[0]> = [
    { title: 'User', dataIndex: 'userName', width: 160 },
    { title: 'Module', dataIndex: 'moduleName', width: 160 },
    {
      title: 'Permission',
      key: 'permission',
      render: (_, r) => `${r.objectName ? `${r.objectName}.` : ''}${r.action}`,
    },
    {
      title: 'Granted By',
      dataIndex: 'grantedByRoles',
      render: (roles: string[]) => roles?.join(', ') ?? '--',
    },
  ];

  const orphanedColumns: ColumnsType<UserRoleAssignmentResponse> = [
    { title: 'User', dataIndex: 'userId', width: 160 },
    { title: 'Role', dataIndex: 'roleName', width: 140 },
    {
      title: 'Status',
      dataIndex: 'assignmentStatus',
      width: 100,
      render: (s: string) => (
        <Tag color={s === 'EXPIRED' ? 'default' : 'error'}>{s}</Tag>
      ),
    },
    { title: 'From', dataIndex: 'effectiveFrom', width: 120 },
    { title: 'To', dataIndex: 'effectiveTo', width: 120, render: (v: string | null) => v ?? '--' },
    { title: 'Notes', dataIndex: 'assignmentNotes', render: (v: string | null) => v ?? '--' },
  ];

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* User Access Report */}
      <Card title="User Access Report" size="small">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="Filter by user ID (optional)"
            value={searchUserId}
            onChange={(e) => setSearchUserId(e.target.value)}
            style={{ maxWidth: 300 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={loadUserAccessReport} loading={loadingAccess}>
            Generate Report
          </Button>
        </div>
        <Table
          dataSource={flattenedAccessData}
          columns={userAccessColumns}
          rowKey="key"
          loading={loadingAccess}
          size="small"
          pagination={{ pageSize: 15, showTotal: (t) => `${t} entries` }}
          locale={{ emptyText: <Empty description="Click Generate Report to view data" /> }}
        />
      </Card>

      {/* Orphaned / Expired Assignments */}
      <Card title="Orphaned / Expired Assignments" size="small">
        <Button
          type="primary"
          onClick={loadOrphanedReport}
          loading={loadingOrphaned}
          style={{ marginBottom: 16 }}
        >
          Load Orphaned / Expired
        </Button>
        <Table
          dataSource={orphanedData}
          columns={orphanedColumns}
          rowKey="handle"
          loading={loadingOrphaned}
          size="small"
          pagination={{ pageSize: 15, showTotal: (t) => `${t} entries` }}
          locale={{ emptyText: <Empty description="Click button above to view data" /> }}
        />
      </Card>
    </div>
  );
};

export default RbacReportsTemplate;

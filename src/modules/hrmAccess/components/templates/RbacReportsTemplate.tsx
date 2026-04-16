'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Select, message, Empty, Card, Tag, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { HrmAccessService } from '../../services/hrmAccessService';
import { getObjectLabel } from '../../utils/moduleObjectRegistry';
import type { ColumnsType } from 'antd/es/table';
import type { UserAccessReportResponse, UserRoleAssignmentResponse } from '../../types/api.types';

interface Props {
  site: string;
}

interface UserOption {
  value: string;
  label: string;
  email: string;
}

const RbacReportsTemplate: React.FC<Props> = ({ site }) => {
  const [userAccessData, setUserAccessData] = useState<UserAccessReportResponse[]>([]);
  const [orphanedData, setOrphanedData] = useState<UserRoleAssignmentResponse[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [loadingOrphaned, setLoadingOrphaned] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | undefined>(undefined);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Load initial users on mount
  useEffect(() => {
    loadUsers('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site]);

  const loadUsers = async (query: string) => {
    setSearchingUsers(true);
    try {
      const response = await HrmAccessService.fetchEmployeeDirectory({
        site,
        page: 0,
        size: 100,
        searchTerm: query,
        status: 'ACTIVE',
      });
      if (response.employees && response.employees.length > 0) {
        const mapped: UserOption[] = response.employees.map((emp) => ({
          value: emp.workEmail,
          label: emp.fullName,
          email: emp.workEmail,
        }));
        setUserOptions(mapped);
      } else {
        setUserOptions([]);
      }
    } catch {
      // swallow; empty options
    } finally {
      setSearchingUsers(false);
    }
  };

  const loadUserAccessReport = async () => {
    if (!selectedUserEmail) {
      message.warning('Please select a user');
      return;
    }
    setLoadingAccess(true);
    try {
      const data = await HrmAccessService.getUserAccessReport(site, selectedUserEmail);
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
      isFirstRow: idx === 0,
      rowSpan: idx === 0 ? user.permissions.length : 0,
      moduleCode: p.moduleCode,
      moduleName: p.moduleName,
      objectName: p.objectName,
      action: p.action,
      scopeValue: p.scopeValue,
      grantedByRoles: p.grantedByRoles,
    }))
  );

  const userAccessColumns: ColumnsType<(typeof flattenedAccessData)[0]> = [
    { title: 'Module', dataIndex: 'moduleName', width: 160 },
    {
      title: 'Object',
      dataIndex: 'objectName',
      width: 140,
      render: (text) => text ? getObjectLabel(text) : '--',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 100,
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
          <Select
            showSearch
            placeholder="Select an employee"
            value={selectedUserEmail}
            onChange={(value) => setSelectedUserEmail(value)}
            onSearch={(value) => loadUsers(value)}
            filterOption={false}
            notFoundContent={searchingUsers ? <Spin size="small" /> : <Empty description="No employees found" />}
            style={{ minWidth: 300 }}
            allowClear
            optionLabelProp="label"
          >
            {userOptions.map((user) => (
              <Select.Option key={user.value} value={user.value} label={user.label}>
                <div>
                  <div style={{ fontWeight: 500 }}>{user.label}</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>{user.email}</div>
                </div>
              </Select.Option>
            ))}
          </Select>
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

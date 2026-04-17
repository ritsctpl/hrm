'use client';

import React, { useEffect, useState } from 'react';
import { Table, Spin, Empty, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import type { EmployeeProfile, LeaveSummary } from '../../types/domain.types';

const { Text } = Typography;

interface Props {
  profile: EmployeeProfile;
}

const LeaveSummaryTab: React.FC<Props> = ({ profile }) => {
  const [data, setData] = useState<LeaveSummary[]>(profile.leaveSummary ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ((!profile.leaveSummary || profile.leaveSummary.length === 0) && profile.handle) {
      setLoading(true);
      const organizationId = getOrganizationId();
      if (organizationId) {
        HrmEmployeeService.fetchLeaveSummary(organizationId, profile.handle)
          .then((result) => setData(result ?? []))
          .catch(() => {
            // No leave data available
          })
          .finally(() => setLoading(false));
      }
    }
  }, [profile.handle, profile.leaveSummary]);

  const columns: ColumnsType<LeaveSummary> = [
    {
      title: 'Leave Type',
      dataIndex: 'leaveType',
      key: 'leaveType',
      width: 200,
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      align: 'center',
      render: (v: number) => <Text strong>{v}</Text>,
    },
    {
      title: 'Used',
      dataIndex: 'used',
      key: 'used',
      width: 120,
      align: 'center',
    },
    {
      title: 'Pending',
      dataIndex: 'pending',
      key: 'pending',
      width: 120,
      align: 'center',
      render: (v: number) => v > 0 ? <Text type="warning">{v}</Text> : v,
    },
    {
      title: 'Total Entitlement',
      key: 'total',
      width: 150,
      align: 'center',
      render: (_, record) => record.balance + record.used + record.pending,
    },
  ];

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>;
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="No leave summary data available. Data is synced from the Leave module." />
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="leaveType"
        size="small"
        pagination={false}
        footer={() => (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Leave data is synchronized from the Leave Management module.
          </Text>
        )}
      />
    </div>
  );
};

export default LeaveSummaryTab;

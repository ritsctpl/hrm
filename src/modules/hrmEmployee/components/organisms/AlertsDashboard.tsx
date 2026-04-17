'use client';

import React, { useEffect, useState } from 'react';
import { Drawer, Table, Tabs, Select, Spin, Empty, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import type { ExpiringAlertResponse } from '../../types/api.types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const DAYS_OPTIONS = [
  { label: '30 Days', value: 30 },
  { label: '60 Days', value: 60 },
  { label: '90 Days', value: 90 },
];

const AlertsDashboard: React.FC<Props> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState('documents');
  const [daysAhead, setDaysAhead] = useState(30);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<ExpiringAlertResponse[]>([]);
  const [visas, setVisas] = useState<ExpiringAlertResponse[]>([]);
  const [certs, setCerts] = useState<ExpiringAlertResponse[]>([]);

  useEffect(() => {
    if (!open) return;
    const organizationId = getOrganizationId();
    if (!organizationId) return;

    setLoading(true);
    Promise.all([
      HrmEmployeeService.getExpiringDocuments(organizationId, daysAhead),
      HrmEmployeeService.getExpiringVisas(organizationId, daysAhead),
      HrmEmployeeService.getExpiringCertifications(organizationId, daysAhead),
    ])
      .then(([docs, vis, certifications]) => {
        setDocuments(docs);
        setVisas(vis);
        setCerts(certifications);
      })
      .catch(() => {
        // silently handle errors
      })
      .finally(() => setLoading(false));
  }, [open, daysAhead]);

  const columns: ColumnsType<ExpiringAlertResponse> = [
    { title: 'Employee', dataIndex: 'employeeName', width: 160 },
    { title: 'Item', dataIndex: 'itemName' },
    { title: 'Expiry Date', dataIndex: 'expiryDate', width: 120 },
    {
      title: 'Days Left',
      dataIndex: 'daysUntilExpiry',
      width: 100,
      render: (days: number) => (
        <Tag color={days <= 7 ? 'red' : days <= 30 ? 'orange' : 'blue'}>
          {days} days
        </Tag>
      ),
      sorter: (a, b) => a.daysUntilExpiry - b.daysUntilExpiry,
      defaultSortOrder: 'ascend',
    },
  ];

  const getContent = () => {
    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>;

    // Backend now filters by daysAhead — use the response data directly.
    let data: ExpiringAlertResponse[] = [];
    switch (activeTab) {
      case 'documents':
        data = documents;
        break;
      case 'visas':
        data = visas;
        break;
      case 'certs':
        data = certs;
        break;
    }

    if (data.length === 0) {
      return <Empty description={`No expiring items within ${daysAhead} days`} />;
    }

    return (
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(r) => `${r.employeeHandle}-${r.itemName}`}
        size="small"
        pagination={{ pageSize: 10 }}
      />
    );
  };

  return (
    <Drawer
      title="Alerts Dashboard"
      open={open}
      onClose={onClose}
      width={700}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Select
          value={daysAhead}
          onChange={setDaysAhead}
          options={DAYS_OPTIONS}
          style={{ width: 140 }}
        />
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'documents',
            label: `Documents (${documents.length})`,
            children: getContent(),
          },
          {
            key: 'visas',
            label: `Visas (${visas.length})`,
            children: getContent(),
          },
          {
            key: 'certs',
            label: `Certifications (${certs.length})`,
            children: getContent(),
          },
        ]}
      />
    </Drawer>
  );
};

export default AlertsDashboard;

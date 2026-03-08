'use client';

import React, { useEffect } from 'react';
import { Table, Progress, Select, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { HrmOrganizationService } from '../../services/hrmOrganizationService';
import styles from '../../styles/HrmOrganization.module.css';

const ENTITY_TYPES = [
  { value: '', label: 'All Entities' },
  { value: 'COMPANY', label: 'Company' },
  { value: 'BUSINESS_UNIT', label: 'Business Unit' },
  { value: 'DEPARTMENT', label: 'Department' },
  { value: 'LOCATION', label: 'Location' },
];

const DataCompletenessPanel: React.FC = () => {
  const {
    dataCompleteness,
    fetchDataCompleteness,
  } = useHrmOrganizationStore();

  const [entityTypeFilter, setEntityTypeFilter] = React.useState('');

  useEffect(() => {
    fetchDataCompleteness(entityTypeFilter || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityTypeFilter]);

  const handleExport = async () => {
    const site = parseCookies().site ?? '';
    if (!site) return;
    try {
      const blob = await HrmOrganizationService.exportToCSV(site, entityTypeFilter || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `org-data-completeness-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  };

  const columns = [
    {
      title: 'Entity Code',
      dataIndex: 'entityCode',
      key: 'entityCode',
      width: 140,
    },
    {
      title: 'Entity Type',
      dataIndex: 'entityType',
      key: 'entityType',
      width: 140,
    },
    {
      title: 'Required',
      dataIndex: 'requiredFields',
      key: 'requiredFields',
      width: 100,
      align: 'center' as const,
    },
    {
      title: 'Filled',
      dataIndex: 'filledFields',
      key: 'filledFields',
      width: 100,
      align: 'center' as const,
    },
    {
      title: 'Missing',
      dataIndex: 'missingFields',
      key: 'missingFields',
      width: 100,
      align: 'center' as const,
    },
    {
      title: 'Completeness',
      dataIndex: 'completenessPercent',
      key: 'completenessPercent',
      width: 200,
      render: (v: number) => (
        <Progress
          percent={Math.round(v)}
          size="small"
          status={v >= 100 ? 'success' : v >= 70 ? 'normal' : 'exception'}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div className={styles.listHeader}>
        <div className={styles.listHeaderLeft}>
          <span className={styles.listTitle}>Data Completeness</span>
          <Select
            value={entityTypeFilter}
            onChange={setEntityTypeFilter}
            options={ENTITY_TYPES}
            size="small"
            style={{ width: 160 }}
          />
        </div>
        <Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>
          Export CSV
        </Button>
      </div>
      <Table
        dataSource={dataCompleteness.rows}
        columns={columns}
        rowKey="entityHandle"
        loading={dataCompleteness.isLoading}
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />
    </div>
  );
};

export default DataCompletenessPanel;

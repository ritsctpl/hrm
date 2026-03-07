/**
 * TrainingCertTab - Training and certification entries with expiry alerts
 */

'use client';

import React from 'react';
import { Table, Tag, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { formatDate, isExpiringSoon, isExpired } from '../../utils/transformations';
import type { ProfileTabProps } from '../../types/ui.types';
import type { TrainingCert } from '../../types/domain.types';
import styles from '../../styles/HrmEmployeeTable.module.css';

const TrainingCertTab: React.FC<ProfileTabProps> = ({ profile }) => {
  const { trainingCerts } = profile;

  if (!trainingCerts.length) {
    return (
      <div className={styles.tabContent}>
        <Empty description="No training or certifications recorded" />
      </div>
    );
  }

  const columns: ColumnsType<TrainingCert> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: 'Issuer',
      dataIndex: 'issuer',
      key: 'issuer',
    },
    {
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (d: string | undefined) => {
        if (!d) return '--';
        const expired = isExpired(d);
        const expiring = isExpiringSoon(d);
        return (
          <span>
            {formatDate(d)}{' '}
            {expired && (
              <Tag color="red" style={{ fontSize: 10, marginLeft: 4 }}>
                Expired
              </Tag>
            )}
            {expiring && (
              <Tag color="orange" style={{ fontSize: 10, marginLeft: 4 }}>
                Expiring Soon
              </Tag>
            )}
          </span>
        );
      },
    },
    {
      title: 'Certificate',
      dataIndex: 'certificateUrl',
      key: 'certificateUrl',
      render: (url: string | undefined) =>
        url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
            View
          </a>
        ) : (
          '--'
        ),
    },
  ];

  return (
    <div className={styles.tabContent}>
      <Table<TrainingCert>
        columns={columns}
        dataSource={trainingCerts}
        rowKey={(_, idx) => String(idx)}
        size="small"
        pagination={false}
      />
    </div>
  );
};

export default TrainingCertTab;

/**
 * AssetsTab - List of assets assigned to the employee
 */

'use client';

import React from 'react';
import { Table, Tag, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { formatDate } from '../../utils/transformations';
import { ASSET_CONDITION_COLORS } from '../../utils/constants';
import type { ProfileTabProps } from '../../types/ui.types';
import type { AssetDetail } from '../../types/domain.types';
import styles from '../../styles/HrmEmployeeTable.module.css';

const AssetsTab: React.FC<ProfileTabProps> = ({ profile }) => {
  const { assets } = profile;

  if (!assets.length) {
    return (
      <div className={styles.tabContent}>
        <Empty description="No assets assigned" />
      </div>
    );
  }

  const columns: ColumnsType<AssetDetail> = [
    {
      title: 'Asset ID',
      dataIndex: 'assetId',
      key: 'assetId',
      width: 120,
    },
    {
      title: 'Name',
      dataIndex: 'assetName',
      key: 'assetName',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Assigned Date',
      dataIndex: 'assignedDate',
      key: 'assignedDate',
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      render: (c: string) => {
        const color = ASSET_CONDITION_COLORS[c.toUpperCase()] || 'default';
        return <Tag color={color}>{c}</Tag>;
      },
    },
  ];

  return (
    <div className={styles.tabContent}>
      <Table<AssetDetail>
        columns={columns}
        dataSource={assets}
        rowKey="assetId"
        size="small"
        pagination={false}
      />
    </div>
  );
};

export default AssetsTab;

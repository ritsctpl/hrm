'use client';

import React from 'react';
import { Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CompensationComponent } from '../../types/domain.types';
import { formatINRPlain } from '../../utils/compensationFormatters';
import CalcMethodBadge from '../atoms/CalcMethodBadge';

interface DeductionsGridProps {
  components: CompensationComponent[];
}

const DeductionsGrid: React.FC<DeductionsGridProps> = ({ components }) => {
  const columns: ColumnsType<CompensationComponent> = [
    {
      title: '#',
      dataIndex: 'displayOrder',
      width: 40,
    },
    {
      title: 'Component',
      key: 'name',
      render: (_: unknown, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.componentName}</div>
          <div style={{ color: '#8c8c8c', fontSize: 11 }}>{r.componentCode}</div>
        </div>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'calculationMethod',
      width: 110,
      render: (val: string) => <CalcMethodBadge method={val} />,
    },
    {
      title: 'Basis',
      key: 'basis',
      width: 120,
      render: (_: unknown, r) => {
        if (r.calculationMethod === 'PERCENTAGE' && r.percentage != null) {
          return <Typography.Text type="secondary">{r.percentage}% of base</Typography.Text>;
        }
        return <Typography.Text type="secondary" style={{ fontSize: 12 }}>statutory</Typography.Text>;
      },
    },
    {
      title: 'Computed (INR)',
      dataIndex: 'derivedAmount',
      width: 130,
      align: 'right',
      render: (val: number) => (
        <span style={{ fontWeight: 500, color: '#cf1322' }}>{formatINRPlain(val ?? 0)}</span>
      ),
    },
  ];

  return (
    <Table
      dataSource={components}
      rowKey="componentCode"
      columns={columns}
      size="small"
      pagination={false}
      locale={{ emptyText: 'No statutory deductions' }}
    />
  );
};

export default DeductionsGrid;

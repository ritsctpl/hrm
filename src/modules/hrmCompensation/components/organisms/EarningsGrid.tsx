'use client';

import React, { useCallback } from 'react';
import { Table, InputNumber } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CompensationComponent } from '../../types/domain.types';
import { formatINRPlain } from '../../utils/compensationFormatters';
import CalcMethodBadge from '../atoms/CalcMethodBadge';

interface EarningsGridProps {
  components: CompensationComponent[];
  onChange: (components: CompensationComponent[]) => void;
  disabled?: boolean;
}

const EarningsGrid: React.FC<EarningsGridProps> = ({ components, onChange, disabled = false }) => {
  const handleAmountChange = useCallback(
    (code: string, val: number | null) => {
      const updated = components.map((c) =>
        c.componentCode === code ? { ...c, amount: val ?? 0 } : c,
      );
      onChange(updated);
    },
    [components, onChange],
  );

  const handlePercentChange = useCallback(
    (code: string, val: number | null) => {
      const updated = components.map((c) =>
        c.componentCode === code ? { ...c, percentage: val ?? 0 } : c,
      );
      onChange(updated);
    },
    [components, onChange],
  );

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
      title: 'Input',
      key: 'input',
      width: 140,
      render: (_: unknown, r) => {
        if (disabled) return r.calculationMethod === 'PERCENTAGE' ? `${r.percentage ?? 0}%` : formatINRPlain(r.amount ?? 0);
        if (r.calculationMethod === 'FIXED') {
          return (
            <InputNumber
              min={0}
              value={r.amount}
              onChange={(v) => handleAmountChange(r.componentCode, v)}
              size="small"
              style={{ width: 120 }}
            />
          );
        }
        if (r.calculationMethod === 'PERCENTAGE') {
          return (
            <InputNumber
              min={0}
              max={100}
              value={r.percentage}
              onChange={(v) => handlePercentChange(r.componentCode, v)}
              size="small"
              style={{ width: 80 }}
              suffix="%"
            />
          );
        }
        return <span style={{ color: '#8c8c8c', fontSize: 12 }}>formula</span>;
      },
    },
    {
      title: 'Computed (INR)',
      dataIndex: 'derivedAmount',
      width: 130,
      align: 'right',
      render: (val: number) => (
        <span style={{ fontWeight: 500 }}>{formatINRPlain(val ?? 0)}</span>
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
    />
  );
};

export default EarningsGrid;

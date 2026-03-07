'use client';

import React, { useCallback } from 'react';
import { Table, InputNumber, Select, Button, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import type { SalaryStructureComponent } from '../../types/domain.types';
import { CALC_METHOD_OPTIONS } from '../../utils/compensationConstants';
import CalcMethodBadge from '../atoms/CalcMethodBadge';
import structureStyles from '../../styles/SalaryStructure.module.css';

interface StructureComponentsTableProps {
  components: SalaryStructureComponent[];
  onChange: (components: SalaryStructureComponent[]) => void;
}

const StructureComponentsTable: React.FC<StructureComponentsTableProps> = ({
  components,
  onChange,
}) => {
  const handleRemove = useCallback(
    (code: string) => {
      const updated = components
        .filter((c) => c.componentCode !== code)
        .map((c, i) => ({ ...c, displayOrder: i + 1 }));
      onChange(updated);
    },
    [components, onChange],
  );

  const handleMethodChange = useCallback(
    (code: string, method: string) => {
      const updated = components.map((c) =>
        c.componentCode === code ? { ...c, calculationMethod: method as SalaryStructureComponent['calculationMethod'] } : c,
      );
      onChange(updated);
    },
    [components, onChange],
  );

  const handleValueChange = useCallback(
    (code: string, field: 'defaultAmount' | 'defaultPercentage', val: number | null) => {
      const updated = components.map((c) =>
        c.componentCode === code ? { ...c, [field]: val ?? undefined } : c,
      );
      onChange(updated);
    },
    [components, onChange],
  );

  const columns: ColumnsType<SalaryStructureComponent> = [
    {
      key: 'drag',
      width: 32,
      render: () => (
        <DragIndicatorIcon className={structureStyles.dragHandle} style={{ fontSize: 16 }} />
      ),
    },
    {
      title: '#',
      dataIndex: 'displayOrder',
      width: 40,
    },
    {
      title: 'Component',
      dataIndex: 'componentCode',
      width: 110,
      render: (val: string) => <strong style={{ fontSize: 13 }}>{val}</strong>,
    },
    {
      title: 'Method',
      dataIndex: 'calculationMethod',
      width: 150,
      render: (val: string, record) => (
        <Select
          value={val}
          onChange={(v) => handleMethodChange(record.componentCode, v)}
          options={CALC_METHOD_OPTIONS}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Default Value',
      key: 'value',
      render: (_: unknown, record) => {
        if (record.calculationMethod === 'FIXED') {
          return (
            <InputNumber
              min={0}
              value={record.defaultAmount}
              onChange={(v) => handleValueChange(record.componentCode, 'defaultAmount', v)}
              size="small"
              style={{ width: 120 }}
              placeholder="Amount"
            />
          );
        }
        if (record.calculationMethod === 'PERCENTAGE') {
          return (
            <InputNumber
              min={0}
              max={100}
              value={record.defaultPercentage}
              onChange={(v) => handleValueChange(record.componentCode, 'defaultPercentage', v)}
              size="small"
              style={{ width: 80 }}
              suffix="%"
              placeholder="%"
            />
          );
        }
        return <CalcMethodBadge method="FORMULA" />;
      },
    },
    {
      key: 'remove',
      width: 40,
      render: (_: unknown, record) => (
        <Tooltip title="Remove">
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteIcon style={{ fontSize: 14 }} />}
            onClick={() => handleRemove(record.componentCode)}
          />
        </Tooltip>
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
      locale={{ emptyText: 'Drop components here to build the structure' }}
    />
  );
};

export default StructureComponentsTable;

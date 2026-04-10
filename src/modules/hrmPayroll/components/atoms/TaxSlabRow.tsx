'use client';

import React from 'react';
import { InputNumber, Button, Space } from 'antd';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { TaxSlabRowProps } from '../../types/ui.types';
import type { TaxSlab } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';

const TaxSlabRow: React.FC<TaxSlabRowProps> = ({ slab, index, onChange, onDelete }) => {
  const update = (patch: Partial<TaxSlab>) => onChange(index, { ...slab, ...patch });

  return (
    <Space>
      <InputNumber
        value={slab.fromAmount}
        min={0}
        placeholder="From (INR)"
        onChange={(v) => update({ fromAmount: v ?? 0 })}
        style={{ width: 130 }}
        formatter={(v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      />
      <InputNumber
        value={slab.toAmount ?? undefined}
        min={0}
        placeholder="To (INR, blank = no limit)"
        onChange={(v) => update({ toAmount: v ?? null })}
        style={{ width: 160 }}
        formatter={(v) => (v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
      />
      <InputNumber
        value={slab.taxRate}
        min={0}
        max={100}
        step={0.5}
        addonAfter="%"
        placeholder="Rate"
        onChange={(v) => update({ taxRate: v ?? 0 })}
        style={{ width: 110 }}
      />
      <Can I="delete">
        <Button
          type="text"
          danger
          icon={<DeleteOutlineIcon fontSize="small" />}
          onClick={() => onDelete(index)}
        />
      </Can>
    </Space>
  );
};

export default TaxSlabRow;

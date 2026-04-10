'use client';

import React from 'react';
import { InputNumber, Button, Space } from 'antd';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { PtSlabRowProps } from '../../types/ui.types';
import type { ProfessionalTaxSlab } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';

const PtSlabRow: React.FC<PtSlabRowProps> = ({ slab, index, onChange, onDelete }) => {
  const update = (patch: Partial<ProfessionalTaxSlab>) => onChange(index, { ...slab, ...patch });

  return (
    <Space>
      <InputNumber
        value={slab.fromSalary}
        min={0}
        placeholder="From Salary"
        onChange={(v) => update({ fromSalary: v ?? 0 })}
        style={{ width: 130 }}
      />
      <InputNumber
        value={slab.toSalary ?? undefined}
        min={0}
        placeholder="To Salary (blank = no limit)"
        onChange={(v) => update({ toSalary: v ?? null })}
        style={{ width: 160 }}
      />
      <InputNumber
        value={slab.monthlyPT}
        min={0}
        placeholder="Monthly PT (INR)"
        onChange={(v) => update({ monthlyPT: v ?? 0 })}
        style={{ width: 130 }}
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

export default PtSlabRow;

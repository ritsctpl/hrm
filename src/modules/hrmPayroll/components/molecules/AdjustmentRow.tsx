'use client';

import React from 'react';
import { Select, Input, InputNumber, Button, Space } from 'antd';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { PayrollAdjustmentDraft } from '../../stores/payrollStore';
import { ADJUSTMENT_TYPES } from '../../utils/payrollConstants';
import Can from '../../../hrmAccess/components/Can';

interface AdjustmentRowProps {
  adjustment: PayrollAdjustmentDraft;
  index: number;
  onDelete: (index: number) => void;
}

const AdjustmentRow: React.FC<AdjustmentRowProps> = ({ adjustment, index, onDelete }) => {
  return (
    <Space wrap>
      <span style={{ minWidth: 140, fontSize: 13 }}>{adjustment.employeeName}</span>
      <Select
        value={adjustment.adjustmentType}
        options={ADJUSTMENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        style={{ width: 140 }}
        disabled
      />
      <Input value={adjustment.description} style={{ width: 180 }} disabled />
      <InputNumber
        value={adjustment.amount}
        prefix="₹"
        style={{ width: 120 }}
        disabled
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

export default AdjustmentRow;

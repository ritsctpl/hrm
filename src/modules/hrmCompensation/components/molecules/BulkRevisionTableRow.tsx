'use client';

import React, { useCallback } from 'react';
import { InputNumber } from 'antd';
import type { SalaryRevisionRow } from '../../types/domain.types';
import { formatINRPlain } from '../../utils/compensationFormatters';

interface BulkRevisionTableRowProps {
  row: SalaryRevisionRow;
  onIncrementChange: (employeeId: string, newPercent: number) => void;
}

const BulkRevisionTableRow: React.FC<BulkRevisionTableRowProps> = ({
  row,
  onIncrementChange,
}) => {
  const handleChange = useCallback(
    (val: number | null) => {
      if (val !== null) onIncrementChange(row.employeeId, val);
    },
    [row.employeeId, onIncrementChange],
  );

  return (
    <>
      <td>{row.employeeId}</td>
      <td>{row.employeeName}</td>
      <td>{row.department}</td>
      <td style={{ textAlign: 'right' }}>{formatINRPlain(row.currentBasic)}</td>
      <td>
        <InputNumber
          min={0}
          max={100}
          value={row.incrementPercent}
          onChange={handleChange}
          style={{ width: 80 }}
          size="small"
          suffix="%"
        />
      </td>
      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINRPlain(row.newBasic)}</td>
    </>
  );
};

export default BulkRevisionTableRow;

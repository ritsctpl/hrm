'use client';

import React from 'react';
import { Typography } from 'antd';
import type { CurrencyCellProps } from '../../types/ui.types';
import { formatINRPlain } from '../../utils/compensationFormatters';

const CurrencyCell: React.FC<CurrencyCellProps> = ({ value, colored = false }) => {
  const text = formatINRPlain(value ?? 0);
  if (colored) {
    return (
      <Typography.Text strong style={{ color: '#52c41a' }}>
        {text}
      </Typography.Text>
    );
  }
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{text}</span>;
};

export default CurrencyCell;

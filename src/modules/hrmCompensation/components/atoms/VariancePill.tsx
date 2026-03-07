'use client';

import React from 'react';
import type { VariancePillProps } from '../../types/ui.types';

const VariancePill: React.FC<VariancePillProps> = ({ value, suffix = '%' }) => {
  const isPositive = value >= 0;
  const color = isPositive ? '#52c41a' : '#ff4d4f';
  const background = isPositive ? '#f6ffed' : '#fff2f0';
  const border = isPositive ? '#b7eb8f' : '#ffa39e';
  const sign = isPositive ? '+' : '';

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 8px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        color,
        background,
        border: `1px solid ${border}`,
      }}
    >
      {sign}{value.toFixed(1)}{suffix}
    </span>
  );
};

export default VariancePill;

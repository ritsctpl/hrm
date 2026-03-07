'use client';
import React from 'react';
import type { CapacityStatus } from '../../types/domain.types';
import { CAPACITY_COLORS } from '../../utils/projectConstants';

interface CapacityColorDotProps {
  status: CapacityStatus | 'GREY';
  size?: number;
}

const CapacityColorDot: React.FC<CapacityColorDotProps> = ({ status, size = 10 }) => {
  const color = status === 'GREY' ? '#d9d9d9' : CAPACITY_COLORS[status as CapacityStatus];
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
};

export default CapacityColorDot;

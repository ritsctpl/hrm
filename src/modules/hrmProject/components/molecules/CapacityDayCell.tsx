'use client';
import React from 'react';
import { Tooltip } from 'antd';
import type { CapacityDayCellProps } from '../../types/ui.types';
import CapacityColorDot from '../atoms/CapacityColorDot';
import { CAPACITY_COLORS } from '../../utils/projectConstants';

const CapacityDayCell: React.FC<CapacityDayCellProps> = ({ capacity }) => {
  if (capacity.holiday || capacity.leave) {
    return (
      <Tooltip title={capacity.leave ? 'On Leave' : 'Holiday'}>
        <span style={{ color: '#bfbfbf', fontSize: 11 }}>—</span>
      </Tooltip>
    );
  }

  const color = CAPACITY_COLORS[capacity.capacityStatus];
  return (
    <Tooltip title={`Allocated: ${capacity.allocatedHours}h / Available: ${capacity.availableHours}h`}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
        <CapacityColorDot status={capacity.capacityStatus} size={8} />
        <span style={{ fontSize: 12, color }}>{capacity.allocatedHours}h</span>
      </span>
    </Tooltip>
  );
};

export default CapacityDayCell;

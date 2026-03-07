'use client';

import React from 'react';
import { DatePicker, Space } from 'antd';
import dayjs from 'dayjs';
import type { RbacAssignmentDateRangeProps } from '../../types/ui.types';

const RbacAssignmentDateRange: React.FC<RbacAssignmentDateRangeProps> = ({
  effectiveFrom,
  effectiveTo,
  disabled = false,
  onChangeFrom,
  onChangeTo,
}) => {
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <DatePicker
        placeholder="Effective From *"
        value={effectiveFrom ? dayjs(effectiveFrom) : null}
        disabled={disabled}
        onChange={(date) => onChangeFrom(date ? date.format('YYYY-MM-DD') : '')}
        style={{ width: '100%' }}
      />
      <DatePicker
        placeholder="Effective To (optional)"
        value={effectiveTo ? dayjs(effectiveTo) : null}
        disabled={disabled}
        onChange={(date) => onChangeTo(date ? date.format('YYYY-MM-DD') : null)}
        style={{ width: '100%' }}
      />
    </Space>
  );
};

export default RbacAssignmentDateRange;

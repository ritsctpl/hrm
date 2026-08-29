'use client';

import React from 'react';
import { Tag } from 'antd';
import type { CalcMethodBadgeProps } from '../../types/ui.types';
import { CALC_METHOD_COLOR_MAP, CALC_METHOD_LABEL_MAP } from '../../utils/compensationConstants';

const CalcMethodBadge: React.FC<CalcMethodBadgeProps> = ({ method }) => {
  const color = CALC_METHOD_COLOR_MAP[method] ?? 'default';
  return (
    <Tag color={color} style={{ fontSize: 11 }}>
      {CALC_METHOD_LABEL_MAP[method] ?? method}
    </Tag>
  );
};

export default CalcMethodBadge;

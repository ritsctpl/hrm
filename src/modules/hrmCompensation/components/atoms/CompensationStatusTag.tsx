'use client';

import React from 'react';
import { Tag } from 'antd';
import type { CompensationStatusTagProps } from '../../types/ui.types';
import { STATUS_COLOR_MAP } from '../../utils/compensationConstants';

const CompensationStatusTag: React.FC<CompensationStatusTagProps> = ({ status }) => {
  const color = STATUS_COLOR_MAP[status] ?? 'default';
  return <Tag color={color}>{status}</Tag>;
};

export default CompensationStatusTag;

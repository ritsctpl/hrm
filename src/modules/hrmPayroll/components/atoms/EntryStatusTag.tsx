'use client';

import React from 'react';
import { Tag } from 'antd';
import type { PayrollEntryStatus } from '../../types/domain.types';
import { ENTRY_STATUS_COLORS } from '../../utils/payrollConstants';

interface EntryStatusTagProps {
  status: PayrollEntryStatus;
}

const EntryStatusTag: React.FC<EntryStatusTagProps> = ({ status }) => {
  const color = ENTRY_STATUS_COLORS[status] ?? 'default';
  return <Tag color={color}>{status}</Tag>;
};

export default EntryStatusTag;

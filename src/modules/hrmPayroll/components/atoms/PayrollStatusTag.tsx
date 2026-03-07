'use client';

import React from 'react';
import { Tag } from 'antd';
import type { PayrollRunStatus } from '../../types/domain.types';
import { PAYROLL_STATUS_COLORS } from '../../utils/payrollConstants';

interface PayrollStatusTagProps {
  status: PayrollRunStatus;
}

const PayrollStatusTag: React.FC<PayrollStatusTagProps> = ({ status }) => {
  const color = PAYROLL_STATUS_COLORS[status] ?? 'default';
  return <Tag color={color}>{status}</Tag>;
};

export default PayrollStatusTag;

'use client';

import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { HolidayStatus } from '../../types/domain.types';

interface HolidayStatusIconProps {
  status: HolidayStatus;
}

export default function HolidayStatusIcon({ status }: HolidayStatusIconProps) {
  if (status === 'COMPLETED') {
    return <CheckCircleOutline style={{ color: '#52c41a', fontSize: 16 }} />;
  }
  return <AccessTimeIcon style={{ color: '#1890ff', fontSize: 16 }} />;
}

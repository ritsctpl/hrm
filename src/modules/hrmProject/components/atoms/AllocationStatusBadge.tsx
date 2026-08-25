'use client';
import React from 'react';
import { Tag } from 'antd';
import type { AllocationStatusBadgeProps } from '../../types/ui.types';
import type { AllocationStatus } from '../../types/domain.types';
import { ALLOCATION_STATUS_COLORS } from '../../utils/projectConstants';

const LABELS: Record<AllocationStatus, string> = {
  APPROVED: 'Approved', CANCELLED: 'Cancelled',
};

const AllocationStatusBadge: React.FC<AllocationStatusBadgeProps> = ({ status }) => (
  <Tag color={ALLOCATION_STATUS_COLORS[status]}>{LABELS[status] ?? status}</Tag>
);

export default AllocationStatusBadge;

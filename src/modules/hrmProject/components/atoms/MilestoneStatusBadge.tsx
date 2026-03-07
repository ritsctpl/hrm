'use client';
import React from 'react';
import { Tag } from 'antd';
import type { MilestoneStatusBadgeProps } from '../../types/ui.types';
import { MILESTONE_STATUS_COLORS } from '../../utils/projectConstants';

const LABELS: Record<string, string> = {
  NOT_STARTED: 'Not Started', IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed', DELAYED: 'Delayed',
};

const MilestoneStatusBadge: React.FC<MilestoneStatusBadgeProps> = ({ status }) => (
  <Tag color={MILESTONE_STATUS_COLORS[status]}>{LABELS[status] ?? status}</Tag>
);

export default MilestoneStatusBadge;

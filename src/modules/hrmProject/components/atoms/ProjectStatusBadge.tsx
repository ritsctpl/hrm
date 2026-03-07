'use client';
import React from 'react';
import { Tag } from 'antd';
import type { ProjectStatusBadgeProps } from '../../types/ui.types';
import { PROJECT_STATUS_COLORS } from '../../utils/projectConstants';

const LABELS: Record<string, string> = {
  DRAFT: 'Draft', ACTIVE: 'Active', ON_HOLD: 'On Hold',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

const ProjectStatusBadge: React.FC<ProjectStatusBadgeProps> = ({ status }) => (
  <Tag color={PROJECT_STATUS_COLORS[status]}>{LABELS[status] ?? status}</Tag>
);

export default ProjectStatusBadge;

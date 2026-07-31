'use client';

import React from 'react';
import { Tag } from 'antd';
import type { GuideStatus } from '../../types/domain.types';
import { STATUS_COLORS } from '../../utils/guideConstants';

interface GuideStatusTagProps {
  status: GuideStatus;
}

const LABELS: Record<GuideStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

const GuideStatusTag: React.FC<GuideStatusTagProps> = ({ status }) => (
  <Tag color={STATUS_COLORS[status] ?? 'default'} style={{ marginInlineEnd: 0 }}>
    {LABELS[status] ?? status}
  </Tag>
);

export default GuideStatusTag;

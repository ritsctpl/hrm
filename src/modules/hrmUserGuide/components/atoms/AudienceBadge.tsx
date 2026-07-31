'use client';

import React from 'react';
import { Tag, Tooltip } from 'antd';
import type { GuideAudience } from '../../types/domain.types';

interface AudienceBadgeProps {
  audience: GuideAudience;
}

/**
 * Only rendered for ADMIN guides — tagging every general guide with
 * "All employees" would be noise on a screen where that is the norm.
 */
const AudienceBadge: React.FC<AudienceBadgeProps> = ({ audience }) => {
  if (audience !== 'ADMIN') return null;
  return (
    <Tooltip title="Written for administrators of this module">
      <Tag color="gold" style={{ marginInlineEnd: 0 }}>
        Admin
      </Tag>
    </Tooltip>
  );
};

export default AudienceBadge;

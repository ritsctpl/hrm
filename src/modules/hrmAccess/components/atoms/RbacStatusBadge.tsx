'use client';

import React from 'react';
import { Tag } from 'antd';
import type { RbacStatusBadgeProps } from '../../types/ui.types';

const RbacStatusBadge: React.FC<RbacStatusBadgeProps> = ({
  isActive,
  isSystemRole = false,
  assignmentStatus,
}) => {
  if (assignmentStatus) {
    const colorMap: Record<string, string> = {
      ACTIVE: 'success',
      EXPIRED: 'default',
      REVOKED: 'error',
    };
    return (
      <Tag color={colorMap[assignmentStatus] ?? 'default'}>
        {assignmentStatus.charAt(0) + assignmentStatus.slice(1).toLowerCase()}
      </Tag>
    );
  }

  if (isSystemRole) {
    return <Tag color="purple">System</Tag>;
  }

  return <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>;
};

export default RbacStatusBadge;

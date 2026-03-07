'use client';

import React from 'react';
import { Tag } from 'antd';
import type { RbacScopeTagProps } from '../../types/ui.types';
import { SCOPE_TAG_COLORS } from '../../utils/rbacConstants';

const RbacScopeTag: React.FC<RbacScopeTagProps> = ({ scope }) => {
  const color = SCOPE_TAG_COLORS[scope] ?? 'default';
  const label =
    scope === 'GLOBAL'
      ? 'Global'
      : scope === 'BU'
      ? 'Business Unit'
      : scope === 'DEPARTMENT'
      ? 'Department'
      : scope;

  return <Tag color={color}>{label}</Tag>;
};

export default RbacScopeTag;

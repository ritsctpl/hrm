'use client';

import React from 'react';
import { Tag } from 'antd';
import type { OrgStatusTagProps } from '../../types/ui.types';

const OrgStatusTag: React.FC<OrgStatusTagProps> = ({ active }) => {
  if (active === 1) {
    return <Tag color="success">Active</Tag>;
  }
  return <Tag color="error">Inactive</Tag>;
};

export default OrgStatusTag;

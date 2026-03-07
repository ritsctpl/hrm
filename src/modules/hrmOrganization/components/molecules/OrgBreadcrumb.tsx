'use client';

import React from 'react';
import { Breadcrumb, Typography } from 'antd';
import HomeIcon from '@mui/icons-material/Home';

interface OrgBreadcrumbProps {
  items: string[];
}

const OrgBreadcrumb: React.FC<OrgBreadcrumbProps> = ({ items }) => {
  const breadcrumbItems = items.map((item, idx) => ({
    key: idx,
    title: idx === 0
      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <HomeIcon style={{ fontSize: 14 }} />
          <span>{item}</span>
        </span>
      : <Typography.Text style={{ fontSize: 12 }}>{item}</Typography.Text>,
  }));

  return (
    <Breadcrumb
      items={breadcrumbItems}
      style={{ marginBottom: 8 }}
    />
  );
};

export default OrgBreadcrumb;
